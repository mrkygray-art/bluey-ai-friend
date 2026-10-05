// Bluey's generated speech endpoint. OPENAI_API_KEY stays on the server.
export const config={api:{bodyParser:{sizeLimit:"64kb"}}};

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured in Vercel"});
  const text=String(req.body?.text||"").trim();
  if(!text)return res.status(400).json({error:"Add a reply for Bluey to speak"});
  if(text.length>4096)return res.status(413).json({error:"That reply is too long to speak in one go"});
  try{
    const response=await fetch("https://api.openai.com/v1/audio/speech",{
      method:"POST",
      headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:process.env.BLUEY_SPEECH_MODEL||"gpt-4o-mini-tts",
        voice:process.env.BLUEY_SPEECH_VOICE||"coral",
        input:text,
        instructions:"Speak in a warm, friendly, clear conversational voice. Sound playful and curious when it fits, but never childish or rushed. Use natural pauses and crisp pronunciation. This is Bluey, a small blue digital friend who helps people feel comfortable and capable.",
        response_format:"mp3",
        speed:1
      })
    });
    if(!response.ok){
      const body=await response.json().catch(()=>({}));
      console.error("Bluey speech provider error",response.status,body);
      return res.status(response.status).json({error:body?.error?.message||"Bluey's voice service could not make audio"});
    }
    const bytes=Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type","audio/mpeg");
    res.setHeader("Content-Length",String(bytes.length));
    res.setHeader("Cache-Control","no-store");
    res.setHeader("X-Bluey-Speech-Version","alpha36");
    return res.status(200).send(bytes);
  }catch(error){
    console.error("Bluey speech endpoint error",error);
    return res.status(500).json({error:"Bluey's voice could not be prepared"});
  }
}
