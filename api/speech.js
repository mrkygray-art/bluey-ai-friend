import { overLimit } from "./_limit.js";
// Bluey's generated speech endpoint. OPENAI_API_KEY stays on the server.
export const config={api:{bodyParser:{sizeLimit:"64kb"}}};

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});if(overLimit(req,res,"speech",60,500))return;
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured in Vercel"});
  // Lowercase "ky" (ky-gray-portfolio.vercel.app) is read as the letters "K Y"; "Ky" is said
  // right. Only the audio changes (format.js blueySpeakable does the same for the browser voice).
  const text=String(req.body?.text||"").trim()
    .replace(/\bky[-\s]gray[-\s]portfolio\b/gi,"Ky Gray portfolio")
    .replace(/\bky(?=[-\s]gray\b)/g,"Ky")
    // Ky's partner Leigh says her name like "sleigh" without the S: "Lay" (and "Laybug").
    .replace(/\bLeigh(bug)?\b/gi,(_,bug)=>"Lay"+(bug?"bug":""));
  // "Slower voice" in the + menu (ease.js): calmer pacing for people who find fast speech hard to follow.
  const slow=req.body?.slow===true;
  if(!text)return res.status(400).json({error:"Add a reply for Bluey to speak"});
  if(text.length>4096)return res.status(413).json({error:"That reply is too long to speak in one go"});
  try{
    const response=await fetch("https://api.openai.com/v1/audio/speech",{
      method:"POST",
      headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:process.env.BLUEY_SPEECH_MODEL||"gpt-4o-mini-tts",
        voice:process.env.BLUEY_SPEECH_VOICE||"echo",
        input:text,
        instructions:"Speak in a warm, friendly, clear conversational voice. Sound playful and curious when it fits, but never childish or rushed. Use natural pauses and crisp pronunciation. This is Bluey, a small blue digital friend who helps people feel comfortable and capable. Speak with a warm, gentle Irish accent."+(slow?" Speak noticeably slower than usual, calm and unhurried, with a short pause after each sentence, for a listener who finds fast speech hard to follow.":""),
        response_format:"mp3",
        speed:slow?0.85:1
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
