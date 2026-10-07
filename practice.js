// Practice talks: rehearse a tough conversation with Bluey playing the other person, then get
// kind feedback. api/chat.js returns `practice` ({status: setup|in-character|feedback, role}).
// - Start: "🎭 Practice a tough talk" in the blue + menu, the "Help me practice a tough
//   conversation" starter, or just asking. During setup Bluey offers scenarios as tappable offers.
// - In character: a banner above the message box ("Practice talk · Bluey is playing: Landlord")
//   with Hint and End practice; each in-character reply gets a small 🎭 role tag. Every
//   /api/chat request carries practice:{active:true, role}, so Bluey stays in character, and
//   brain-first.js keeps travel and object words from turning practice lines into app actions.
// - End practice sends practice:{end:true}: Bluey steps out and gives kind feedback (what went
//   well, one thing to try, a line you could use). Kept in sessionStorage across a refresh.
(function(){
'use strict';
const KEY='bluey-practice';
let state=null,ending=false,lastChat=null;
try{state=JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(_){state=null}
const save=()=>{try{state?sessionStorage.setItem(KEY,JSON.stringify(state)):sessionStorage.removeItem(KEY)}catch(_){}};

// Banner above the message box
const banner=document.createElement('div');banner.id='bluey-practice-bar';banner.hidden=true;banner.setAttribute('role','status');
const label=document.createElement('span');label.className='bluey-practice-label';
const hint=document.createElement('button');hint.type='button';hint.className='is-hint';hint.textContent='Hint';hint.setAttribute('aria-label','Get a hint for what to say next');
const end=document.createElement('button');end.type='button';end.className='is-end';end.textContent='End practice';
banner.append(label,hint,end);
(document.getElementById('bluey-doc-tray')||form).before(banner);
function render(){
 const on=!!state;banner.hidden=!on;document.body.classList.toggle('bluey-practicing',on);
 if(!on)return;
 label.replaceChildren();
 const mask=document.createElement('span');mask.setAttribute('aria-hidden','true');mask.textContent='🎭 ';
 const strong=document.createElement('strong');strong.textContent='Practice talk';
 label.append(mask,strong,document.createTextNode(' · Bluey is playing: '+(state.role||'the other person')));
}
render();
hint.addEventListener('click',()=>{if(state)send('(Hint, please: what could I say next?)')});
end.addEventListener('click',()=>{if(!state)return;ending=true;send('End practice. How did I do?')});

// Requests carry the practice state; responses update it.
const previousFetch=window.fetch;
window.fetch=async function(resource,init){
 const url=typeof resource==='string'?resource:resource?.url||'';
 const chat=/\/api\/chat(\?|$)/.test(url);
 if(chat&&state&&typeof init?.body==='string'){
  try{const body=JSON.parse(init.body);body.practice=ending?{end:true,role:state.role}:{active:true,role:state.role};init={...init,body:JSON.stringify(body)}}catch(_){}
 }
 const response=await previousFetch.call(this,resource,init);
 if(chat){
  ending=false;
  if(response.ok){
   try{
    const d=await response.clone().json();lastChat=d;
    const p=d.practice;
    if(p?.status==='in-character'){state={role:p.role||state?.role||'the other person'};save();render()}
    else if(p?.status==='feedback'||(!p&&state)){state=null;save();render()}
   }catch(_){lastChat=null}
  }
 }
 return response;
};

// 🎭 role tag above each in-character reply
const previousAdd=add;
add=function(role,text){
 previousAdd(role,text);
 if(role!=='assistant')return;
 const d=lastChat;lastChat=null;
 if(d?.practice?.status!=='in-character'||d.reply!==text)return;
 let bubble=null;for(let el=messages.lastElementChild;el;el=el.previousElementSibling)if(el.classList.contains('msg')){bubble=el;break}
 if(!bubble?.classList.contains('assistant'))return;
 const tag=document.createElement('div');tag.className='bluey-practice-tag';tag.textContent='🎭 '+(d.practice.role||'In character');
 bubble.before(tag);bubble.classList.add('is-in-character');
};

// "🎭 Practice a tough talk" in the blue + menu, after the scam check
function addMenuItem(){
 const menu=document.querySelector('.bluey-plus-menu');if(!menu||menu.querySelector('.bluey-practice-item'))return;
 const b=document.createElement('button');b.type='button';b.className='bluey-plus-item bluey-practice-item';
 const i=document.createElement('span');i.className='bluey-plus-icon';i.setAttribute('aria-hidden','true');i.textContent='🎭';
 const t=document.createElement('span');t.className='bluey-plus-text';t.textContent='Practice a tough talk';
 const h=document.createElement('small');h.textContent='Rehearse a call or chat, then get kind feedback';t.append(h);
 b.append(i,t);
 b.addEventListener('click',()=>{menu.hidden=true;document.querySelector('.bluey-plus-toggle')?.setAttribute('aria-expanded','false');send("I'd like to practice a tough conversation.")});
 const scam=menu.querySelector('.bluey-scam-item'),adds=[...menu.querySelectorAll('.bluey-plus-item:not(.bluey-install)')];
 const after=scam||adds[adds.length-1];after?after.after(b):menu.prepend(b);
}
addMenuItem();
document.addEventListener('DOMContentLoaded',addMenuItem);

window.blueyPracticeActive=()=>!!state;
window.blueyEndPractice=()=>{state=null;ending=false;save();render()};
})();
