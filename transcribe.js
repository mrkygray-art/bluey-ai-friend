import OpenAI, { toFile } from "openai";
import formidable from "formidable";
import fs from "fs/promises";

export const config={api:{bodyParser:false}};
const one=v=>Array.isArray(v)?v[0]:v;

function normalizedType(name,mime){
  const n=(name||"").toLowerCase();
  const m=(mime||"").toLowerCase();
  if(n.endsWith(".webm")||m.includes("webm")) return "audio/webm";
  if(n.endsWith(".ogg")||m.includes("ogg")) return "audio/ogg";
  if(n.endsWith(".m4a")||n.endsWith(".mp4")||m.includes("mp4")) return "audio/mp4";
  if(n.endsWith(".wav")||m.includes("wav")) return "audio/wav";
  return m||"application/octet-stream";
}

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  try{
    const form=formidable({multiples:false,maxFileSize:15*1024*1024});
    const [fields,files]=await form.parse(req);
    const audio=one(files.audio);
    if(!audio)return res.status(400).json({error:"No audio file received"});
    if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY is not configured"});

    const durationMs=one(fields.duration_ms)||null;
    const bytes=await fs.readFile(audio.filepath);
    const filename=audio.originalFilename||"bluey.webm";
    const contentType=normalizedType(filename,audio.mimetype);

    console.log("Bluey transcription upload prepared",{
      bytes:bytes.length,
      incomingMime:audio.mimetype,
      contentType,
      filename,
      durationMs,
      signature:Array.from(bytes.subarray(0,8)).map(b=>b.toString(16).padStart(2,"0")).join(" ")
    });

    // Important: construct an explicit upload File instead of passing a temp-path stream.
    // This preserves filename/type metadata in the multipart request sent by the OpenAI SDK.
    const upload=await toFile(bytes,filename,{type:contentType});
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});

    const out=await client.audio.transcriptions.create({
      file:upload,
      model:process.env.BLUEY_TRANSCRIBE_MODEL||"gpt-4o-mini-transcribe"
    });

    const text=(out?.text||"").trim();
    console.log("Bluey transcription success",{characters:text.length});
    if(!text)return res.status(422).json({error:"No speech was transcribed"});
    return res.status(200).json({text});
  }catch(e){
    console.error("Bluey transcription server error",{
      name:e?.name,message:e?.message,status:e?.status,code:e?.code,type:e?.type
    });
    return res.status(e?.status||500).json({error:e?.message||"Transcription failed"});
  }
}
