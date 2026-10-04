const BLUEY = `You are Bluey's brain. Bluey is an extremely simple, friendly AI interface for people who may be intimidated by technology.
Never mention prompting, tokens, LLMs, APIs, models, or technical implementation unless explicitly asked.
Teach without teaching. Be concise, conversational, useful, and ask at most one follow-up question when it materially improves the result.
Do not pretend to have emotions. For serious or high-stakes topics, be calm and appropriately cautious.
Choose one behavior based on the meaning of the conversation: idle, curious, explaining, serious, happy, unsure.`;

const schema={
  type:"object",
  additionalProperties:false,
  properties:{
    reply:{type:"string"},
    behavior:{type:"string",enum:["idle","curious","explaining","serious","happy","unsure"]}
  },
  required:["reply","behavior"]
};

function outputText(data){
  if(typeof data.output_text==="string" && data.output_text) return data.output_text;
  for(const item of data.output||[]){
    for(const c of item.content||[]){
      if((c.type==="output_text"||c.type==="text") && typeof c.text==="string") return c.text;
    }
  }
  return "";
}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"OPENAI_API_KEY is not configured in Vercel"});
  try{
    const messages=Array.isArray(req.body?.messages)?req.body.messages:[];
    const input=messages.map(m=>({
      role:m.role==="assistant"?"assistant":"user",
      content:[{type:m.role==="assistant"?"output_text":"input_text",text:String(m.content||"")}]
    }));

    const payload={
      model:process.env.BLUEY_MODEL||"gpt-6-luna",
      instructions:BLUEY,
      input,
      max_output_tokens:350,
      text:{
        format:{
          type:"json_schema",
          name:"bluey_response",
          strict:true,
          schema
        }
      }
    };

    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify(payload)
    });
    const d=await r.json();

    if(!r.ok){
      console.error("OpenAI API error",r.status,d);
      return res.status(r.status).json({
        error:d?.error?.message||`OpenAI request failed (${r.status})`,
        code:d?.error?.code||null
      });
    }

    const raw=outputText(d);
    if(!raw) return res.status(502).json({error:"The model returned no text"});
    let parsed;
    try{parsed=JSON.parse(raw)}
    catch{ return res.status(502).json({error:"Bluey received an unexpected response format"}) }

    return res.status(200).json({
      reply:String(parsed.reply||""),
      behavior:String(parsed.behavior||"explaining")
    });
  }catch(e){
    console.error("Bluey server error",e);
    return res.status(500).json({error:e?.message||"Bluey could not respond"});
  }
}