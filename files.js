// Files: photos, PDF, Word (.docx), text, and CSV, added from the blue + menu (controls.js),
// pasted, or dropped on the page.
// - Photos join the existing photo flow (blueyPhotos, alpha7/alpha10), up to five.
// - Documents are read right here in the browser: PDF with pdf.js, Word with mammoth (both
//   loaded from cdnjs only when needed), text and CSV as they are. Only the text goes to
//   Bluey. A PDF with no text (a scan) is turned into photos of its first pages instead.
// - The full text of every attached document goes with each /api/chat and /api/document
//   request (fetch is wrapped below), so follow-up questions still see it, until the user
//   removes it (×) or starts a New chat. api/chat.js frames it as the complete document.
// - Nothing is ever cut silently: a file over the size limit is refused with a plain message.
// - Long pastes (4,000+ characters) become a "Pasted text" attachment, the way Claude does,
//   so Bluey knows it has the whole thing.
// - Attached documents are kept in sessionStorage: they survive a refresh, and are gone when
//   the tab closes.
(function(){
'use strict';
const LIMIT=250000; // characters across all documents (~100 pages); api/chat.js enforces the same
const MAX_DOCS=5,PASTE_AS_FILE=4000,MAX_FILE_MB=25,KEY='bluey-documents';
const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
const MAMMOTH='https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.13.0/mammoth.browser.min.js';
const MAMMOTH_SRI='sha512-5hAL8cCOeSztnaZ+3xjLAflXeSwJpGrdrH6McLq2Dtl0vfvCQw+jO9q652eMASTNAU8anRvrXnlW9QqzlfN2HA==';
const ICON={pdf:'📄',docx:'📝',csv:'📊',text:'📃'};
const KIND_NAME={pdf:'PDF',docx:'Word document',csv:'CSV file',text:'text file'};

let docs=load();
function load(){try{const v=JSON.parse(sessionStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(d=>d&&typeof d.text==='string'&&typeof d.name==='string'):[]}catch(_){return[]}}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(docs))}catch(_){/* storage full or blocked: keep them for this page only */}}
const say=(text,ms=5000)=>{if(typeof tempStatus==='function')tempStatus(text,ms);else statusEl.textContent=text};
const words=t=>(String(t).trim().match(/\S+/g)||[]).length;
const total=()=>docs.reduce((n,d)=>n+d.text.length,0);
const fmt=n=>n.toLocaleString('en-US');
const extOf=name=>(String(name).toLowerCase().match(/\.([a-z0-9]+)$/)||[])[1]||'';
function kindOf(file){
 const ext=extOf(file.name),type=String(file.type||'').toLowerCase();
 if(type.startsWith('image/')||['jpg','jpeg','png','gif','webp','heic','heif','bmp'].includes(ext))return 'image';
 if(ext==='pdf'||type==='application/pdf')return 'pdf';
 if(ext==='docx'||type.includes('wordprocessingml'))return 'docx';
 if(ext==='doc'||type==='application/msword')return 'doc';
 if(ext==='csv'||type==='text/csv')return 'csv';
 if(['txt','md','markdown','text'].includes(ext)||type==='text/plain'||type==='text/markdown')return 'text';
 return null;
}
function meta(d){
 if(d.kind==='csv'){const rows=d.text.split(/\r?\n/).filter(l=>l.trim()).length;return `${fmt(rows)} row${rows===1?'':'s'}`}
 const w=`${fmt(words(d.text))} word${words(d.text)===1?'':'s'}`;
 return d.pages?`${d.pages} page${d.pages===1?'':'s'} · ${w}`:w;
}

// --- reading -------------------------------------------------------------------------
let pdfjs=null,mammothReady=null;
async function loadPdfJs(){
 if(pdfjs)return pdfjs;
 const lib=await import(PDFJS);lib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;return pdfjs=lib;
}
function loadMammoth(){
 if(window.mammoth)return Promise.resolve();
 return mammothReady||=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=MAMMOTH;s.integrity=MAMMOTH_SRI;s.crossOrigin='anonymous';s.onload=resolve;s.onerror=()=>{mammothReady=null;reject(new Error('load'))};document.head.appendChild(s)});
}
async function readPdf(file){
 const lib=await loadPdfJs();
 const pdf=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise;
 const pages=[];
 for(let n=1;n<=pdf.numPages;n++){
  const content=await (await pdf.getPage(n)).getTextContent();
  let text='';for(const item of content.items){if(typeof item.str!=='string')continue;text+=item.str;if(item.hasEOL)text+='\n'}
  pages.push(text.replace(/[ \t]+\n/g,'\n').trim());
 }
 const text=pages.join('\n\n');
 if(text.replace(/\s/g,'').length>=30)return {text,pages:pdf.numPages};
 // A scan: pictures of pages with no text layer. Look at the first pages as photos instead.
 const room=Math.max(0,5-blueyPhotos.length),shots=[];
 for(let n=1;n<=Math.min(pdf.numPages,room);n++){
  const page=await pdf.getPage(n),base=page.getViewport({scale:1}),scale=Math.min(2,1100/Math.max(base.width,base.height)),view=page.getViewport({scale});
  const canvas=document.createElement('canvas');canvas.width=Math.round(view.width);canvas.height=Math.round(view.height);
  const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);
  await page.render({canvasContext:c,viewport:view}).promise;
  shots.push({name:`${file.name} page ${n}`,dataUrl:canvas.toDataURL('image/jpeg',.72)});
 }
 return {scan:true,shots,pages:pdf.numPages};
}
async function readDocx(file){await loadMammoth();const r=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return {text:String(r.value||'').replace(/\n{3,}/g,'\n\n').trim()}}

function addDoc(doc){
 if(!doc.text.trim()){say(`${doc.name} looks empty to me. Is it the right file?`);return false}
 if(docs.some(d=>d.name===doc.name&&d.text===doc.text)){say(`${doc.name} is already here.`,3500);return false}
 if(docs.length>=MAX_DOCS){say(`I can hold ${MAX_DOCS} files at a time. Remove one with its × to add another.`);return false}
 if(total()+doc.text.length>LIMIT){
  const pages=Math.max(1,Math.round(doc.text.length/2500)),others=docs.length?' together with the other files here':'';
  say(`${doc.name} is too long for me to read all at once${others} (about ${fmt(pages)} pages of text, and I can take about ${Math.round(LIMIT/2500)}). Try a shorter file, or paste in just the part you need.`,9000);
  return false;
 }
 docs.push({name:doc.name,kind:doc.kind,pages:doc.pages||null,text:doc.text,sent:false});save();render();return true;
}

async function addFiles(list){
 const images=[],added=[];
 for(const file of list){
  const kind=kindOf(file);
  if(kind==='image'){images.push(file);continue}
  if(!kind){say(`I can read photos, PDF, Word (.docx), text, and CSV files. ${file.name} is a different kind of file.`,7000);continue}
  if(kind==='doc'){say(`${file.name} is an older Word file I can't open. In Word, choose File, then Save As, and pick Word Document (.docx) or PDF. Then add it again.`,9000);continue}
  if(file.size>MAX_FILE_MB*1024*1024){say(`${file.name} is too big for me (over ${MAX_FILE_MB} MB). Try a smaller copy, or just the pages you need.`,7000);continue}
  statusEl.textContent=`Reading ${file.name}…`;
  try{
   if(kind==='pdf'){
    const r=await readPdf(file);
    if(r.scan){
     if(!r.shots.length){say(`${file.name} is pictures of pages, and I'm already holding five photos. Send those first, then add it again.`,7000);continue}
     blueyPhotos.push(...r.shots);blueyRecentPhotos=[];blueySyncControls();
     say(`${file.name} is pictures of pages, not text, so I'll look at ${r.pages===1?'it as a photo':r.shots.length===r.pages?`its ${r.pages} pages as photos`:`the first ${r.shots.length} pages as photos`}.`,7000);
     added.push(file.name);continue;
    }
    if(addDoc({name:file.name,kind,pages:r.pages,text:r.text}))added.push(file.name);
   }else if(kind==='docx'){
    const r=await readDocx(file);if(addDoc({name:file.name,kind,text:r.text}))added.push(file.name);
   }else{
    if(addDoc({name:file.name,kind,text:(await file.text()).replace(/^﻿/,'')}))added.push(file.name);
   }
  }catch(e){
   console.error('Bluey could not read a file',file.name,e);
   say(e?.message==='load'?'I need an internet connection to open that kind of file. Check your connection and try again.':`I couldn't open ${file.name}. If it has a password, remove it, or save it again as a PDF and try once more.`,8000);
  }
  if(statusEl.textContent===`Reading ${file.name}…`)statusEl.textContent='';
 }
 if(images.length){
  const room=Math.max(0,5-blueyPhotos.length);
  if(!room)say('I can hold five photos at a time. Remove one to add another.',5000);
  else{
   try{const photos=await Promise.all(images.slice(0,room).map(blueyReadPhoto));blueyPhotos.push(...photos);blueyRecentPhotos=[];blueySyncControls();added.push(...photos.map(p=>p.name));if(images.length>room)say('I added the first five photos.',4000)}
   catch(e){say(e?.message||'I could not open that photo.',5000)}
  }
 }
 if(added.length){
  if(typeof blueyPlaySound==='function')blueyPlaySound('photo');
  const docNames=docs.filter(d=>!d.sent).map(d=>d.name);
  if(docNames.length&&!/pictures of pages|too long|older Word/.test(statusEl.textContent))say(docNames.length===1?`Got ${docNames[0]}. Ask me anything about it, or just press Send.`:`Got ${docNames.length} files. Ask me anything about them, or just press Send.`,5500);
  else if(!docNames.length&&!statusEl.textContent)say('Got them! Tell me what you’d like me to notice or make.',5500);
  input.focus({preventScroll:true});
 }
}

// --- the tray of attached documents, above the message box -----------------------------
const tray=document.createElement('div');tray.id='bluey-doc-tray';tray.setAttribute('aria-live','polite');
form.before(tray);
function chip(d,{removable}){
 const c=document.createElement('span');c.className='bluey-doc-chip'+(d.sent?' is-sent':'');
 c.title=d.sent?'Bluey can see this for the rest of the chat':'Ready to send';
 const icon=document.createElement('span');icon.className='bluey-doc-icon';icon.setAttribute('aria-hidden','true');icon.textContent=ICON[d.kind]||'📄';
 const text=document.createElement('span');text.className='bluey-doc-text';
 const name=document.createElement('span');name.className='bluey-doc-name';name.textContent=d.name;
 const info=document.createElement('small');info.textContent=meta(d);
 text.append(name,info);c.append(icon,text);
 if(removable){
  const x=document.createElement('button');x.type='button';x.textContent='×';x.setAttribute('aria-label',`Remove ${d.name}`);
  x.addEventListener('click',()=>{docs=docs.filter(o=>o!==d);save();render();say(`Removed ${d.name}.`+(d.sent?' I won’t look at it anymore.':''),3500)});
  c.append(x);
 }
 return c;
}
function render(){
 tray.replaceChildren();
 if(!docs.length)return;
 for(const d of docs)tray.append(chip(d,{removable:true}));
 const note=document.createElement('span');note.className='bluey-doc-note';
 note.textContent=docs.some(d=>!d.sent)?'Ready to send':'In this chat';
 tray.append(note);
}
render();

// --- every chat and document request carries the attached documents ---------------------
const previousFetch=window.fetch;
window.fetch=async function(resource,init){
 const url=typeof resource==='string'?resource:resource?.url||'';
 if(!docs.length||!/\/api\/(chat|document)(\?|$)/.test(url)||typeof init?.body!=='string')return previousFetch.apply(this,arguments);
 let body;try{body=JSON.parse(init.body)}catch(_){return previousFetch.apply(this,arguments)}
 const sending=docs.slice(),fresh=sending.filter(d=>!d.sent),bubble=[...messages.querySelectorAll('.msg.user')].pop();
 body.documents=sending.map(({name,kind,pages,text})=>({name,kind,pages,text}));
 const res=await previousFetch.call(this,resource,{...init,body:JSON.stringify(body)});
 if(res.ok){
  if(fresh.length&&bubble?.isConnected){const row=document.createElement('div');row.className='bluey-msg-files';for(const d of fresh)row.append(chip({...d,sent:true},{removable:false}));bubble.after(row)}
  fresh.forEach(d=>{d.sent=true});save();render();
  if(/\/api\/chat/.test(url))res.clone().json().then(d=>{if(d&&d.documentsReceived!==sending.length)say('I couldn’t read your file this time. Please try sending again.',7000)}).catch(()=>{});
 }
 return res;
};

// --- pasting and dropping ---------------------------------------------------------------
input.addEventListener('paste',e=>{
 const cb=e.clipboardData;if(!cb)return;
 const files=[...cb.files||[]].filter(f=>kindOf(f)!=='image'); // pasted pictures: alpha38
 if(files.length){e.preventDefault();addFiles(files);return}
 if([...cb.items||[]].some(i=>i.kind==='file'))return;
 const text=cb.getData('text/plain');
 if(!text||text.length<PASTE_AS_FILE)return;
 e.preventDefault();
 const n=docs.filter(d=>/^Pasted text( \d+)?$/.test(d.name)).length;
 if(addDoc({name:n?`Pasted text ${n+1}`:'Pasted text',kind:'text',text:text.trim()}))say('That’s a lot of text, so I turned it into an attachment. I’ll read all of it. Add a question, or just press Send.',6500);
});
let dragDepth=0;
const hasFiles=e=>[...(e.dataTransfer?.types||[])].includes('Files');
document.addEventListener('dragenter',e=>{if(!hasFiles(e))return;e.preventDefault();dragDepth++;document.body.classList.add('bluey-dropping')});
document.addEventListener('dragover',e=>{if(hasFiles(e))e.preventDefault()});
document.addEventListener('dragleave',e=>{if(!hasFiles(e))return;dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)document.body.classList.remove('bluey-dropping')});
document.addEventListener('drop',e=>{if(!hasFiles(e))return;e.preventDefault();dragDepth=0;document.body.classList.remove('bluey-dropping');const list=[...e.dataTransfer.files||[]];if(list.length)addFiles(list)});

window.blueyAddFiles=addFiles;
window.blueyDocsPending=()=>docs.some(d=>!d.sent);
window.blueyClearDocuments=()=>{docs=[];save();render()};
})();
