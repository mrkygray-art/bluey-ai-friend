import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";
export const config={api:{bodyParser:false}};
const one=v=>Array.isArray(v)?v[0]:v;
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 try{
  const form=formidable({multiples:false,maxFileSize:15*1024*1024});
  const [fields,files]=await form.parse(req),audio=one(files.audio);
  if(!audio)return res.status(400).json({error:"No audio file received"});
  console.log("Bluey native audio upload",{bytes:audio.size,mimetype:audio.mimetype,filename:audio.originalFilename,durationMs:one(fields.duration_ms)||null});
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const out=await client.audio.transcriptions.create({file:fs.createReadStream(audio.filepath),model:"gpt-4o-mini-transcribe"});
  const text=(out?.text||"").trim();
  console.log("Bluey transcription result",{textLength:text.length});
  if(!text)return res.status(422).json({error:"Bluey heard audio but no speech was transcribed"});
  res.status(200).json({text});
 }catch(e){
  console.error("Bluey transcription server error",{name:e?.name,message:e?.message,status:e?.status,code:e?.code,type:e?.type});
  res.status(e?.status||500).json({error:e?.message||"Transcription failed"});
 }
}