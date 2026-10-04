import formidable from "formidable";
import fs from "fs";
import OpenAI, { toFile } from "openai";

export const config = { api: { bodyParser: false } };

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      maxFiles: 1,
      maxFileSize: 20 * 1024 * 1024,
      allowEmptyFiles: false
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function first(v) { return Array.isArray(v) ? v[0] : v; }

function inspectWav(buf) {
  if (buf.length < 44) throw new Error("WAV_TOO_SMALL");
  const ascii = (a,b) => buf.subarray(a,b).toString("ascii");
  const riff = ascii(0,4), wave = ascii(8,12);
  if (riff !== "RIFF" || wave !== "WAVE") throw new Error(`BAD_WAV_HEADER:${riff}/${wave}`);

  let offset=12, fmt=null, data=null;
  while (offset + 8 <= buf.length) {
    const id=ascii(offset,offset+4);
    const size=buf.readUInt32LE(offset+4);
    const body=offset+8;
    if (body+size > buf.length) break;
    if (id==="fmt " && size>=16) {
      fmt={
        audioFormat:buf.readUInt16LE(body),
        channels:buf.readUInt16LE(body+2),
        sampleRate:buf.readUInt32LE(body+4),
        byteRate:buf.readUInt32LE(body+8),
        blockAlign:buf.readUInt16LE(body+12),
        bitsPerSample:buf.readUInt16LE(body+14)
      };
    }
    if (id==="data") data={offset:body,size};
    offset=body+size+(size%2);
  }
  if (!fmt) throw new Error("WAV_FMT_CHUNK_MISSING");
  if (!data) throw new Error("WAV_DATA_CHUNK_MISSING");
  if (fmt.audioFormat!==1) throw new Error(`WAV_NOT_PCM:${fmt.audioFormat}`);
  if (fmt.channels!==1) throw new Error(`WAV_CHANNELS:${fmt.channels}`);
  if (fmt.bitsPerSample!==16) throw new Error(`WAV_BITS:${fmt.bitsPerSample}`);
  if (data.size<=0) throw new Error("WAV_EMPTY_DATA");

  const expectedBlock=fmt.channels*(fmt.bitsPerSample/8);
  if (fmt.blockAlign!==expectedBlock) throw new Error("WAV_BAD_BLOCK_ALIGN");
  const expectedRate=fmt.sampleRate*fmt.blockAlign;
  if (fmt.byteRate!==expectedRate) throw new Error("WAV_BAD_BYTE_RATE");

  return {...fmt,dataBytes:data.size,dataOffset:data.offset,fileBytes:buf.length};
}


function analyzePcm16(buf,wav){
  const start=wav.dataOffset,end=Math.min(buf.length,start+wav.dataBytes);
  let peak=0,sumSq=0,nearSilent=0,clipped=0,count=0;
  for(let i=start;i+1<end;i+=2){
    const v=buf.readInt16LE(i)/32768,a=Math.abs(v);
    peak=Math.max(peak,a); sumSq+=v*v;
    if(a<0.003)nearSilent++;
    if(a>0.98)clipped++;
    count++;
  }
  const rms=count?Math.sqrt(sumSq/count):0;
  const silencePercent=count?nearSilent/count*100:100;
  const clippingPercent=count?clipped/count*100:0;
  let audioStatus="good";
  if(peak<0.01||rms<0.0015||silencePercent>99)audioStatus="silent";
  else if(peak<0.04||rms<0.006||silencePercent>94)audioStatus="too_quiet";
  else if(clippingPercent>5)audioStatus="clipping";
  return {sampleCount:count,peak:+peak.toFixed(6),rms:+rms.toFixed(6),
    silencePercent:+silencePercent.toFixed(2),clippingPercent:+clippingPercent.toFixed(2),audioStatus};
}

export default async function handler(req,res) {
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"Transcription temporarily unavailable"});

  let tempPath;
  try {
    const {fields,files}=await parseForm(req);
    const audio=first(files.audio);
    const durationMs=first(fields.duration_ms);
    if(!audio?.filepath) return res.status(400).json({error:"No audio received"});
    tempPath=audio.filepath;

    const bytes=await fs.promises.readFile(tempPath);
    let wav;
    try {
      wav=inspectWav(bytes);
    } catch(e) {
      console.error("Bluey WAV validation failed",{message:e.message,bytes:bytes.length});
      return res.status(400).json({error:"Recorded audio was invalid"});
    }

    console.log("Bluey WAV validated",{
      ...wav,
      durationMs:durationMs||null,
      incomingMime:audio.mimetype,
      incomingName:audio.originalFilename
    });

    const diagnostic=analyzePcm16(bytes,wav);
    console.log("Bluey audio diagnostic",{durationMs:durationMs||null,...diagnostic});
    if(diagnostic.audioStatus==="silent"){
      return res.status(422).json({error:"Bluey recorded silence",diagnostic});
    }

    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});

    // Important: create an explicit SDK Uploadable with a clean filename/MIME.
    // This avoids relying on Formidable's temporary-file metadata.
    const upload=await toFile(bytes,"bluey.wav",{type:"audio/wav"});

    const result=await client.audio.transcriptions.create({
      file:upload,
      model:process.env.BLUEY_TRANSCRIBE_MODEL||"gpt-4o-mini-transcribe",
      response_format:"json"
    });

    // 0.4.8: inspect the response safely and normalize common SDK/API shapes.
    const responseShape={
      jsType:typeof result,
      constructor:result?.constructor?.name||null,
      keys:result && typeof result==="object" ? Object.keys(result).slice(0,20) : [],
      hasText:typeof result?.text==="string",
      hasOutputText:typeof result?.output_text==="string",
      dataType:typeof result?.data
    };
    console.log("Bluey transcription response shape",responseShape);

    let text="";
    if(typeof result==="string") text=result.trim();
    else if(typeof result?.text==="string") text=result.text.trim();
    else if(typeof result?.output_text==="string") text=result.output_text.trim();
    else if(typeof result?.data?.text==="string") text=result.data.text.trim();
    else if(typeof result?.transcript==="string") text=result.transcript.trim();

    // Last-resort safe inspection: stringify only a short redacted preview.
    if(!text){
      let preview="";
      try{
        preview=JSON.stringify(result,(key,value)=>{
          if(/key|token|authorization|secret/i.test(key)) return "[REDACTED]";
          return value;
        });
      }catch(_){}
      console.error("Bluey transcription returned no normalized text",{
        ...responseShape,
        preview:preview ? preview.slice(0,1000) : null
      });
      return res.status(422).json({error:"No speech detected"});
    }

    console.log("Bluey transcription success",{characters:text.length});
    return res.status(200).json({text});
  } catch(e) {
    console.error("Bluey transcription server error",{
      name:e?.name,message:e?.message,status:e?.status,code:e?.code,type:e?.type
    });
    return res.status(e?.status||500).json({error:"Transcription temporarily unavailable"});
  } finally {
    if(tempPath) fs.promises.unlink(tempPath).catch(()=>{});
  }
}