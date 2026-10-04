export const config={api:{bodyParser:false}};

async function readRequest(req){
  const parts=[];
  for await(const chunk of req) parts.push(chunk);
  return Buffer.concat(parts);
}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"OPENAI_API_KEY is not configured in Vercel"});
  try{
    const raw=await readRequest(req);
    const incomingType=req.headers["content-type"]||"";
    const boundaryMatch=incomingType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if(!boundaryMatch) return res.status(400).json({error:"Missing audio form boundary"});
    const oldBoundary=boundaryMatch[1]||boundaryMatch[2];

    // Forward the browser's multipart body and inject the required model field
    // immediately before the terminating boundary.
    const marker=Buffer.from(`--${oldBoundary}--`);
    const idx=raw.lastIndexOf(marker);
    if(idx<0) return res.status(400).json({error:"Invalid audio form data"});
    const modelPart=Buffer.from(
      `--${oldBoundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-transcribe\r\n`
    );
    const body=Buffer.concat([raw.subarray(0,idx),modelPart,raw.subarray(idx)]);

    const r=await fetch("https://api.openai.com/v1/audio/transcriptions",{
      method:"POST",
      headers:{
        Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type":incomingType
      },
      body
    });
    const d=await r.json();
    if(!r.ok){
      console.error("Transcription API error",r.status,d);
      return res.status(r.status).json({error:d?.error?.message||`Transcription failed (${r.status})`});
    }
    return res.status(200).json({text:d.text||""});
  }catch(e){
    console.error("Transcription server error",e);
    return res.status(500).json({error:e?.message||"Transcription failed"});
  }
}