export const config={api:{bodyParser:false}};
async function read(req){const parts=[];for await(const c of req)parts.push(c);return Buffer.concat(parts)}
export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY is not configured'});
 try{
  const body=await read(req),ct=req.headers['content-type']||'';
  const r=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':ct},body});
  const d=await r.json();if(!r.ok)return res.status(r.status).json({error:d.error?.message||'Transcription failed'});
  return res.status(200).json({text:d.text||''});
 }catch(e){return res.status(500).json({error:e.message||'Transcription failed'})}
}