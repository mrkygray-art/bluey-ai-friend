// What Bluey remembers, on this device (no sign-up). api/chat.js returns `remember`
// ([{kind, subject, fact}]: name, work, projects, goals) and `forget` ([subject] or "everything").
// - Saved in localStorage `bluey-memory` (max 30, one fact per subject: a new fact replaces the
//   old one) and sent with every /api/chat request as `memory`, so Bluey can use it.
// - Each change shows a small note under the reply ("💾 I'll remember: …") with Undo.
// - "What Bluey remembers" in the blue + menu opens a page listing these facts and the preferences
//   saved by preferences.js (localStorage `bluey-preferences`), each with Forget, plus Forget
//   everything. It replaces the old Remembered list in the menu.
// - Same shape as the `memories` table in supabase/accounts_v1.sql, so when sign-in arrives a
//   person's device memory can move into their account.
(function(){
'use strict';
const KEY='bluey-memory',PREFS='bluey-preferences',MAX=30;
const KINDS={about_me:'About you',project:'Projects',goal:'Goals',other:'Other'};
const read=(k)=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}};
const load=()=>read(KEY).filter(m=>m&&typeof m.fact==='string'&&typeof m.subject==='string');
const save=list=>{try{localStorage.setItem(KEY,JSON.stringify(list.slice(-MAX)))}catch(_){}refresh()};
const same=(a,b)=>String(a).trim().toLowerCase()===String(b).trim().toLowerCase();
// Facts are stored about the person ("Their name is Jason.") for Bluey; shown to them as "Your name is Jason."
const toYou=f=>String(f).replace(/^They are\b/i,'You are').replace(/^They're\b/i,'You’re').replace(/^They\b/i,'You').replace(/^Their\b/i,'Your').replace(/\b(their)\b/gi,'your').replace(/\b(them)\b/gi,'you').replace(/\b(they are)\b/gi,'you are');

function remember(m){const list=load(),old=list.find(x=>same(x.subject,m.subject));const next=list.filter(x=>x!==old);next.push({kind:m.kind,subject:m.subject,fact:m.fact,at:Date.now()});save(next);return old||null}
function forget(subject){
 if(same(subject,'everything')){const all=load();save([]);return all}
 const list=load(),gone=list.filter(x=>same(x.subject,subject)||x.subject.toLowerCase().includes(String(subject).toLowerCase()));
 if(gone.length)save(list.filter(x=>!gone.includes(x)));return gone;
}

// Requests carry what this device remembers; responses may add or forget things.
let lastChat=null;
const previousFetch=window.fetch;
window.fetch=async function(resource,init){
 const url=typeof resource==='string'?resource:resource?.url||'';
 const chat=/\/api\/chat(\?|$)/.test(url);
 if(chat&&typeof init?.body==='string'){const list=load();if(list.length){try{const body=JSON.parse(init.body);body.memory=list.map(({kind,subject,fact})=>({kind,subject,fact}));init={...init,body:JSON.stringify(body)}}catch(_){}}}
 const response=await previousFetch.call(this,resource,init);
 if(chat&&response.ok){try{lastChat=await response.clone().json()}catch(_){lastChat=null}}
 return response;
};

// "💾 I'll remember: …" / "🧹 Forgotten: …" under the reply, with Undo
const previousAdd=add;
add=function(role,text){
 previousAdd(role,text);
 if(role!=='assistant')return;
 const d=lastChat;lastChat=null;
 if(!d||d.reply!==text)return;
 const notes=[];
 for(const m of Array.isArray(d.remember)?d.remember:[]){const old=remember(m);notes.push({icon:'💾',text:'I’ll remember: '+toYou(m.fact),undo:()=>{forget(m.subject);if(old)remember(old)}})}
 for(const s of Array.isArray(d.forget)?d.forget:[]){const gone=forget(s);if(gone.length)notes.push({icon:'🧹',text:same(s,'everything')?'Forgotten: everything I remembered on this device':'Forgotten: '+gone.map(g=>toYou(g.fact)).join(' '),undo:()=>gone.forEach(remember)})}
 if(!notes.length)return;
 const box=document.createElement('div');box.className='bluey-memory-notes';
 for(const n of notes){
  const row=document.createElement('div');row.className='bluey-memory-note';
  const t=document.createElement('span');t.textContent=n.icon+' '+n.text;
  const u=document.createElement('button');u.type='button';u.textContent='Undo';
  u.addEventListener('click',()=>{n.undo();row.remove();if(!box.children.length)box.remove();if(typeof tempStatus==='function')tempStatus('Okay, undone.',2500)});
  row.append(t,u);box.append(row);
 }
 let anchor=null;for(let el=messages.lastElementChild;el;el=el.previousElementSibling){if(el.classList.contains('msg'))break;if(el.classList.contains('bluey-reply-actions')){anchor=el;break}}
 (anchor||messages.lastElementChild).after(box);
};

// "What Bluey remembers" in the + menu
let item=null,count=null;
function build(){
 const menu=document.querySelector('.bluey-plus-menu');if(!menu||item)return;
 item=document.createElement('button');item.type='button';item.className='bluey-plus-item bluey-memory-item';
 const i=document.createElement('span');i.className='bluey-plus-icon';i.setAttribute('aria-hidden','true');i.textContent='🧠';
 const t=document.createElement('span');t.className='bluey-plus-text';t.textContent='What Bluey remembers';
 count=document.createElement('small');t.append(count);
 item.append(i,t);
 item.addEventListener('click',()=>{menu.hidden=true;document.querySelector('.bluey-plus-toggle')?.setAttribute('aria-expanded','false');openPage()});
 const head=menu.querySelector('.bluey-plus-head');menu.insertBefore(item,head);
 refresh();
}
function refresh(){if(!count)return;const n=load().length+read(PREFS).length;count.textContent=n?`${n} thing${n===1?'':'s'}, saved on this device`:'Nothing yet, saved on this device'}

function openPage(){
 const back=document.createElement('div');back.className='bluey-memory-back';back.setAttribute('role','dialog');back.setAttribute('aria-modal','true');back.setAttribute('aria-label','What Bluey remembers');
 const sheet=document.createElement('div');sheet.className='bluey-memory-sheet';back.append(sheet);
 const close=()=>{back.remove();document.removeEventListener('keydown',esc)};const esc=e=>{if(e.key==='Escape')close()};
 function draw(){
  sheet.replaceChildren();
  const h=document.createElement('h2');h.textContent='What Bluey remembers';
  const lead=document.createElement('p');lead.className='bluey-memory-lead';lead.textContent='Saved only on this device, so it stays private and goes away if you clear your browser. Tap Forget on anything you want Bluey to let go of.';
  sheet.append(h,lead);
  const facts=load(),prefs=read(PREFS).filter(p=>typeof p==='string');
  const group=(title,rows)=>{if(!rows.length)return;const g=document.createElement('section');const t=document.createElement('h3');t.textContent=title;g.append(t);for(const [text,drop] of rows){const r=document.createElement('div');r.className='bluey-memory-row';const s=document.createElement('span');s.textContent=text;const b=document.createElement('button');b.type='button';b.textContent='Forget';b.setAttribute('aria-label','Forget: '+text);b.addEventListener('click',()=>{drop();draw()});r.append(s,b);g.append(r)}sheet.append(g)};
  for(const kind of Object.keys(KINDS))group(KINDS[kind],facts.filter(f=>(KINDS[f.kind]?f.kind:'other')===kind).map(f=>[toYou(f.fact),()=>forget(f.subject)]));
  group('How you like answers',prefs.map((p,i)=>[p,()=>{const left=read(PREFS).filter((_,j)=>j!==i);try{localStorage.setItem(PREFS,JSON.stringify(left))}catch(_){}if(window.blueyRenderRemembered)blueyRenderRemembered();refresh()}]));
  if(!facts.length&&!prefs.length){const e=document.createElement('p');e.className='bluey-memory-empty';e.textContent='Nothing yet. Tell Bluey your name or what you’re working on, and he’ll keep it here.';sheet.append(e)}
  const actions=document.createElement('div');actions.className='bluey-memory-actions';
  if(facts.length||prefs.length){
   const all=document.createElement('button');all.type='button';all.className='is-quiet';all.textContent='Forget everything';
   let armed=false;all.addEventListener('click',()=>{if(!armed){armed=true;all.textContent='Tap again to forget everything';return}save([]);try{localStorage.setItem(PREFS,'[]')}catch(_){}if(window.blueyRenderRemembered)blueyRenderRemembered();refresh();draw()});
   actions.append(all);
  }
  const done=document.createElement('button');done.type='button';done.textContent='Done';done.addEventListener('click',close);actions.append(done);
  sheet.append(actions);done.focus({preventScroll:true});
 }
 back.addEventListener('click',e=>{if(e.target===back)close()});document.addEventListener('keydown',esc);
 draw();document.body.append(back);
}
build();
document.addEventListener('DOMContentLoaded',build);
window.blueyMemory={list:load,remember,forget,refresh};
})();
