// Regression snapshot for cleanups: records how the app LOOKS (computed styles of every element
// in several states, phone and desktop) and how it BEHAVES (which messages reach /api/chat,
// what local app actions do), with the AI mocked and Math.random seeded so runs repeat.
// Take one before a change and one after, then compare:
//   node scripts/snapshot.cjs before.json   (needs `vercel dev --listen 3210`)
//   node scripts/snapshot.cjs after.json
//   node scripts/snapshot.cjs --diff before.json after.json
// NODE_PATH must point at a folder with puppeteer-core.
const fs=require('fs');
if(process.argv[2]==='--diff'){
 const [a,b]=process.argv.slice(3).map(f=>JSON.parse(fs.readFileSync(f,'utf8')));let n=0;
 const keys=new Set([...Object.keys(a),...Object.keys(b)]);
 for(const k of keys){
  if(k.endsWith('/styles')&&a[k]&&b[k]){
   // Element by element, property by property.
   for(const el of new Set([...Object.keys(a[k]),...Object.keys(b[k])])){
    if(!a[k][el]||!b[k][el]){n++;if(n<=80)console.log('DIFF',k,el,a[k][el]?'only before':'only after');continue}
    for(const prop of new Set([...Object.keys(a[k][el]),...Object.keys(b[k][el])]))if(a[k][el][prop]!==b[k][el][prop]){n++;if(n<=80)console.log('DIFF',k,el,prop+':',a[k][el][prop],'->',b[k][el][prop])}
   }
   continue;
  }
  const x=JSON.stringify(a[k]),y=JSON.stringify(b[k]);if(x!==y){n++;if(n<=80)console.log('DIFF',k,'\n  before:',x?.slice(0,300),'\n  after: ',y?.slice(0,300))}
 }
 console.log(n?`${n} differences`:`identical (${keys.size} entries)`);process.exit(n?1:0);
}
const puppeteer=require('puppeteer-core');
const BASE=process.env.BLUEY_URL||'http://localhost:3210',OUT=process.argv[2]||'snapshot.json';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const base={sources:[],searched:false,offers:[],safety:null,handoff:null,behavior:'explaining',spellingSuggestion:null,documentsReceived:0,imagesSubmitted:0,imagesReceived:0,photoApiVersion:'alpha12',brainApiVersion:'test'};
function mock(body){
 const t=String((body.messages||[]).slice(-1)[0]?.content||'');
 if(/^make it shorter/i.test(t))return{...base,reply:'Running 10 minutes late. Sorry!',brain:{isDraft:true,assumption:null}};
 if(/email|text to/i.test(t))return{...base,reply:"Hi Sam,\n\nI'm running about 10 minutes late. Sorry for the wait!\n\nBest,\nAlex",brain:{isDraft:true,assumption:'I kept it friendly, as if Sam is a coworker.'}};
 if(/speech/i.test(t))return{...base,reply:"Sure! What's the occasion?",brain:{isDraft:false,needsQuestion:true,mode:'DISCOVER',betterPrompt:'Write a short [occasion] speech for [audience].',betterPromptWhy:'It says what the speech is for.',tipSlots:[{blank:'[occasion]',label:'Occasion',options:['Wedding','Retirement']},{blank:'[audience]',label:'Audience',options:['Family','Coworkers']}]}};
 if(/scam/i.test(t))return{...base,reply:"This looks like a **scam**. Don't click the link.",safety:{verdict:'scam',headline:'Real delivery companies do not text you a link to pay a fee.'},brain:{isDraft:false}};
 if(/^(hi|hello|i'?m bored)/i.test(t))return{...base,reply:'Hi! Want a riddle or a blue fact?',offers:['Give me a riddle','Tell me a round-and-blue fact'],brain:{isDraft:false}};
 if(body.documents?.length)return{...base,reply:'The oldest job is **Harbor**.',documentsReceived:body.documents.length,brain:{isDraft:false}};
 return{...base,reply:'### Plan\n- **One** thing\n- Two things\n\nThat is the idea.',brain:{isDraft:false}};
}
const PROPS=['display','position','visibility','color','background-color','background-image','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-decoration-line','white-space','margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left','border-top-width','border-top-style','border-top-color','border-radius','box-shadow','z-index','overflow-x','overflow-y','flex-direction','flex-wrap','justify-content','align-items','gap','grid-template-columns','cursor','zoom','opacity','max-width','min-height','list-style-type'];
// Elements whose size/position move every frame (the orb drifting) are compared without geometry.
async function styles(p){
 return p.evaluate(PROPS=>{
  const moving=el=>!!el.closest('.stage');const out={},seen={};
  const name=el=>{let s=el.tagName.toLowerCase();if(el.id)s+='#'+el.id;const c=[...el.classList].filter(x=>!/^(bluey-(idle|recognize|meeting|listening|thinking)|idle|warm|working|explaining|curious|serious|happy|unsure|thinking|speaking)$/.test(x)).sort();if(c.length)s+='.'+c.join('.');return s};
  for(const el of document.body.querySelectorAll('*')){
   if(['SCRIPT','STYLE','LINK','svg','path'].includes(el.tagName))continue;
   const cs=getComputedStyle(el);const rec={};for(const k of PROPS)rec[k]=cs.getPropertyValue(k);
   if(!moving(el)&&cs.display!=='none'){const r=el.getBoundingClientRect();rec.box=[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)].join(',')}
   const key=name(el);seen[key]=(seen[key]||0)+1;out[key+' #'+seen[key]]=rec;
  }
  return out;
 },PROPS);
}
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const snap={};
 for(const [w,h,m,tag] of [[390,844,true,'phone'],[1280,900,false,'desk']]){
  const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));let chats=0;
  await p.setBypassServiceWorker(true);await p.setRequestInterception(true);
  p.on('request',r=>{const u=r.url();
   if(u.includes('/api/chat')){chats++;return r.respond({status:200,contentType:'application/json',body:JSON.stringify(mock(JSON.parse(r.postData()||'{}')))})}
   if(u.includes('/api/')){return r.respond({status:503,contentType:'application/json',body:'{"error":"off in snapshot"}'})}
   r.continue()});
  await p.evaluateOnNewDocument(()=>{let s=42;Math.random=()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296};
   const css=()=>{const st=document.createElement('style');st.textContent='*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}';document.documentElement.appendChild(st)};
   if(document.documentElement)css();else document.addEventListener('DOMContentLoaded',css)});
  await p.setViewport({width:w,height:h,isMobile:m,hasTouch:m});
  await p.goto(BASE+'/',{waitUntil:'networkidle2'});
  await p.evaluate(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('bluey-voice-on','false');localStorage.setItem('bluey-sounds-on','false')});
  await p.reload({waitUntil:'networkidle2'});await wait(2500);
  const state=async name=>{await wait(700);const s=await styles(p);snap[`${tag}/${name}/styles`]=s;snap[`${tag}/${name}/text`]=await p.evaluate(()=>[...document.querySelectorAll('.messages>*')].map(e=>e.className+': '+(e.innerText||'').replace(/\s+/g,' ').slice(0,120)))};
  const ask=async t=>{const n0=chats,a0=await p.$$eval('.msg.assistant',x=>x.length);await p.evaluate(t=>{const i=document.querySelector('#input');i.value=t;document.querySelector('#form').requestSubmit()},t);
   for(let s=0;s<30;s++){await wait(200);if(chats>n0&&await p.$$eval('.msg.assistant',x=>x.length)>a0)break}await wait(1500);
   return{toBrain:chats-n0,lastReply:await p.$$eval('.msg.assistant',x=>(x[x.length-1]?.dataset.raw||x[x.length-1]?.textContent||'').slice(0,100)).catch(()=>''),room:await p.evaluate(()=>document.querySelector('.stage')?.dataset.blueyWorld||document.body.className.match(/bluey-world\S*/)?.[0]||''),status:await p.$eval('#status',e=>e.textContent)}};
  await state('start');
  await p.click('.bluey-plus-toggle');await state('plus-menu');await p.keyboard.press('Escape');
  snap[`${tag}/ask/hi`]=await ask('hi');await state('offers');
  snap[`${tag}/ask/email`]=await ask('Write an email to Sam saying I will be 10 minutes late');await state('draft');
  snap[`${tag}/ask/shorter`]=await ask('Make it shorter.');
  snap[`${tag}/ask/speech`]=await ask('Help me write a speech');await state('tip-card');
  snap[`${tag}/ask/scam`]=await ask('Is this a scam? USPS pay $1.99 at usps-help.com');await state('scam');
  snap[`${tag}/ask/plan`]=await ask('Make me a plan for Saturday');
  // local app actions (these must not reach the brain)
  for(const t of ['where are we?','take me to the library','tell me about the lamp','go home','tell me a story','dance for me'])snap[`${tag}/local/${t}`]=await ask(t);
  await state('after-local');
  await p.evaluate(()=>{localStorage.setItem('bluey-ease',JSON.stringify({text:'larger'}))});await p.reload({waitUntil:'networkidle2'});await wait(2500);await state('larger-restored');
  snap[`${tag}/errors`]=errs;
  await p.close();
 }
 fs.writeFileSync(OUT,JSON.stringify(snap,null,1));console.log('wrote',OUT,Object.keys(snap).length,'entries');
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
