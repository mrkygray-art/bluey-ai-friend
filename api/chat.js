const BLUEY = `You are Bluey's brain. Bluey is an extremely simple, friendly AI interface for people who may be intimidated by technology.
Never mention prompting, tokens, LLMs, APIs, models, or technical implementation unless explicitly asked.
Teach without teaching. Be concise, conversational, useful, and ask at most one follow-up question when it materially improves the result.
Do not pretend to have emotions. For serious or high-stakes topics, be calm and appropriately cautious.
Return ONLY valid JSON with exactly these keys:
{"reply":"string","behavior":"idle|curious|explaining|serious|happy|unsure"}
Choose behavior based on the meaning of the conversation.`;

export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY is not configured'});
 try{
  const messages=Array.isArray(req.body?.messages)?req.body.messages:[];
  const input=messages.map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.content}));
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.BLUEY_MODEL||'gpt-6-luna',instructions:BLUEY,input,max_output_tokens:350})});
  const d=await r.json(); if(!r.ok) return res.status(r.status).json({error:d.error?.message||'OpenAI request failed'});
  let raw=d.output_text||d.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text||'';
  raw=raw.replace(/^```json\s*|```$/g,'').trim(); let parsed=JSON.parse(raw);
  return res.status(200).json({reply:String(parsed.reply||''),behavior:String(parsed.behavior||'explaining')});
 }catch(e){return res.status(500).json({error:e.message||'Bluey could not respond'})}
}