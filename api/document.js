import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from "docx";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";

const schema={
  type:"object",additionalProperties:false,
  properties:{
    title:{type:"string"},
    paragraphs:{type:"array",items:{type:"string"}},
    bullets:{type:"array",items:{type:"string"}},
    headers:{type:"array",items:{type:"string"}},
    rows:{type:"array",items:{type:"array",items:{type:"string"}}}
  },
  required:["title","paragraphs","bullets","headers","rows"]
};

export const config={api:{bodyParser:{sizeLimit:"4mb"}}};

function outputText(data){
  if(typeof data.output_text==="string"&&data.output_text)return data.output_text;
  for(const item of data.output||[])for(const c of item.content||[])if((c.type==="output_text"||c.type==="text")&&typeof c.text==="string")return c.text;
  return "";
}
function decodeImage(a){
  const m=String(a?.dataUrl||"").match(/^data:image\/(png|jpeg|webp);base64,([\s\S]+)$/i);
  if(!m)return null;
  return {buffer:Buffer.from(m[2],"base64"),mime:`image/${m[1].toLowerCase()==="jpg"?"jpeg":m[1].toLowerCase()}`,name:String(a.name||"Photo")};
}
function safeName(s){return (String(s||"bluey-document").normalize("NFKD").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").slice(0,64)||"bluey-document").toLowerCase()}

async function makePdf(data,images){
  const doc=new PDFDocument({size:"LETTER",margin:54,autoFirstPage:true});
  const chunks=[];doc.on("data",c=>chunks.push(c));
  const done=new Promise((resolve,reject)=>{doc.on("end",()=>resolve(Buffer.concat(chunks)));doc.on("error",reject)});
  doc.fillColor("#087fc4").fontSize(22).font("Helvetica-Bold").text(data.title||"Bluey's notes");
  doc.moveDown(.7).fillColor("#20262d").font("Helvetica").fontSize(11);
  for(const p of data.paragraphs||[]){doc.text(p,{lineGap:3});doc.moveDown(.55)}
  if(data.bullets?.length){for(const b of data.bullets)doc.list([b],{bulletRadius:2,indent:16});doc.moveDown(.5)}
  if(data.headers?.length){doc.moveDown(.4);doc.font("Helvetica-Bold").text(data.headers.join("    |    "));doc.moveDown(.25).font("Helvetica");for(const row of data.rows||[])doc.text(row.join("    |    "),{lineGap:2});}
  for(let i=0;i<images.length;i++){
    const image=images[i];
    if(!["image/jpeg","image/png"].includes(image.mime))continue;
    doc.addPage();doc.font("Helvetica-Bold").fontSize(15).fillColor("#087fc4").text(`Photo ${i+1}`);doc.moveDown(.6);
    doc.image(image.buffer,{fit:[480,620],align:"center",valign:"center"});
  }
  doc.end();return done;
}

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured in Vercel"});
  try{
    const format=String(req.body?.format||"").toLowerCase();
    if(!["pdf","docx","xlsx"].includes(format))return res.status(400).json({error:"Choose PDF, Word, or Excel."});
    const messages=Array.isArray(req.body?.messages)?req.body.messages.slice(-16):[];
    const images=(Array.isArray(req.body?.attachments)?req.body.attachments:[]).map(decodeImage).filter(Boolean).slice(0,5);
    const input=messages.map((m,i)=>({role:m.role==="assistant"?"assistant":"user",content:[{type:m.role==="assistant"?"output_text":"input_text",text:String(m.content||"")},...(m.role!=="assistant"&&i===messages.length-1?images.map(x=>({type:"input_image",image_url:`data:${x.mime};base64,${x.buffer.toString("base64")}`,detail:"high"})):[])]}));
    if(!input.length)input.push({role:"user",content:[{type:"input_text",text:"Create a useful starter document with a friendly, concise structure."}]});
    input.push({role:"user",content:[{type:"input_text",text:`Prepare content for a ${format.toUpperCase()} file based on our conversation and attached images. Preserve the user's intent. If this is a spreadsheet request, create a clear table with useful column headings and realistic sample rows when requested. If images are attached, read visible text and describe relevant details accurately; do not invent unreadable text. Include enough content for the requested document, but don't add filler. Return a useful title, paragraphs, optional bullets, and an optional table.`}]});
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.BLUEY_MODEL||"gpt-6-luna",instructions:"You prepare clear, accurate document content for Bluey, a kind and capable digital friend. Keep the tone natural and useful.",input,max_output_tokens:2400,text:{format:{type:"json_schema",name:"bluey_document",strict:true,schema}}})});
    const raw=await response.json();
    if(!response.ok){console.error("Bluey document model error",response.status,raw);return res.status(response.status).json({error:raw?.error?.message||"Bluey couldn't prepare the document."})}
    let data;try{data=JSON.parse(outputText(raw))}catch{return res.status(502).json({error:"Bluey couldn't format the document content."})}
    const base=safeName(req.body?.filename||data.title);
    let bytes,mime,filename;
    if(format==="xlsx"){
      const aoa=[[data.title||"Bluey's table"]];
      if(data.paragraphs?.length){aoa.push([""]);for(const p of data.paragraphs)aoa.push([p]);}
      if(data.headers?.length){aoa.push([""]);aoa.push(data.headers);for(const row of data.rows||[])aoa.push(row)}
      else if(data.bullets?.length){aoa.push([""]);aoa.push(["Notes"]);for(const b of data.bullets)aoa.push([b]);}
      const ws=XLSX.utils.aoa_to_sheet(aoa);ws["!cols"]=(data.headers?.length?data.headers:["Notes"]).map(()=>({wch:24}));
      const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Bluey's notes");bytes=XLSX.write(wb,{type:"buffer",bookType:"xlsx"});mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";filename=`${base}.xlsx`;
    }else if(format==="docx"){
      const children=[new Paragraph({text:data.title||"Bluey's notes",heading:HeadingLevel.TITLE}),...(data.paragraphs||[]).map(text=>new Paragraph({children:[new TextRun(text)]})),...(data.bullets||[]).map(text=>new Paragraph({text,bullet:{indent:360}}))];
      if(data.headers?.length){children.push(new Paragraph({text:data.headers.join("    |    "),heading:HeadingLevel.HEADING_2}));for(const row of data.rows||[])children.push(new Paragraph({text:row.join("    |    ")}));}
      for(let i=0;i<images.length;i++){
        const x=images[i];if(!["image/jpeg","image/png"].includes(x.mime))continue;
        children.push(new Paragraph({text:`Photo ${i+1}`,heading:HeadingLevel.HEADING_2}));
        children.push(new Paragraph({children:[new ImageRun({data:x.buffer,type:x.mime==="image/png"?"png":"jpg",transformation:{width:480,height:320}})]}));
      }
      bytes=await Packer.toBuffer(new Document({sections:[{children}]}));mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document";filename=`${base}.docx`;
    }else{bytes=await makePdf(data,images);mime="application/pdf";filename=`${base}.pdf`}
    res.setHeader("Content-Type",mime);res.setHeader("Content-Disposition",`attachment; filename="${filename}"`);res.setHeader("Cache-Control","no-store");return res.status(200).send(bytes);
  }catch(e){console.error("Bluey document error",e);return res.status(500).json({error:e?.message||"Bluey couldn't create that file."})}
}
