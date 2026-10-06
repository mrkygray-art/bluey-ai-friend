// Preferences the user chooses to keep, stored only in this browser.
// - When the brain notices a lasting preference (brain.preferenceNoticed, e.g. "Keep answers
//   short."), a small card asks "Remember this for next time?" with Remember / Not now.
//   Nothing is saved unless the user taps Remember.
// - Saved preferences (max 8) are added to every /api/chat request; api/chat.js treats them
//   as style preferences only.
// - A "Remembered ▾" list in the blue + menu shows them, each with Forget,
//   plus Forget all. It only appears once something is saved.
(function(){
'use strict';
const KEY='bluey-preferences',MAX=8;
let lastChat=null;

function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,MAX):[]}catch(_){return[]}}
function save(list){try{localStorage.setItem(KEY,JSON.stringify(list.slice(0,MAX)))}catch(_){}renderMenu()}
const same=(a,b)=>a.trim().toLowerCase().replace(/[.!]+$/,'')===b.trim().toLowerCase().replace(/[.!]+$/,'');

const blueyFetchBeforePrefs=window.fetch;
window.fetch=async function(resource,options){
 const url=typeof resource==='string'?resource:resource?.url||'';
 const isChat=/\/api\/chat(\?|$)/.test(url);
 if(isChat&&options&&typeof options.body==='string'){
  const prefs=load();
  if(prefs.length){try{const body=JSON.parse(options.body);body.preferences=prefs;options={...options,body:JSON.stringify(body)}}catch(_){}}
 }
 const response=await blueyFetchBeforePrefs.call(this,resource,options);
 if(isChat&&response.ok){try{lastChat=await response.clone().json()}catch(_){lastChat=null}}
 return response;
};

function pill(label,onClick){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',onClick);return b}

const blueyAddBeforePrefs=add;
add=function(role,text){
 blueyAddBeforePrefs(role,text);
 if(role!=='assistant')return;
 document.querySelectorAll('.bluey-remember').forEach(el=>el.remove());
 const chat=lastChat;lastChat=null;
 const noticed=typeof chat?.brain?.preferenceNoticed==='string'?chat.brain.preferenceNoticed.trim().slice(0,120):'';
 if(!noticed||chat.reply!==text||load().some(p=>same(p,noticed)))return;
 // Last element = this reply's own buttons (Copy, the guess line, steer buttons), so the card goes after them.
 const anchor=messages.lastElementChild;if(!anchor)return;
 const card=document.createElement('div');card.className='bluey-remember';card.setAttribute('role','group');card.setAttribute('aria-label','Remember a preference');
 const ask=document.createElement('span');ask.append('Remember this for next time? ');const q=document.createElement('q');q.textContent=noticed;ask.appendChild(q);
 card.append(ask,
  pill('Remember',()=>{save([...load(),noticed]);card.replaceChildren(document.createTextNode('Got it. I’ll remember that in this browser. You can change it under Remembered in the + menu.'));setTimeout(()=>card.remove(),6000)}),
  pill('Not now',()=>card.remove()));
 anchor.after(card);
};

// "Remembered ▾" inside the blue + menu (controls.js makes the slot and calls
// blueyRenderRemembered once it exists); before that, in the session tools.
let wrap=null;
function renderMenu(){
 const tools=document.querySelector('.bluey-plus-remembered')||document.querySelector('.bluey-session-tools');if(!tools)return;
 const prefs=load();
 if(!prefs.length){wrap?.remove();wrap=null;return}
 if(!wrap)wrap=document.createElement('div');
 if(wrap.parentElement!==tools){wrap.className='bluey-remembered';tools.prepend(wrap)}
 const wasOpen=wrap.querySelector('.bluey-remembered-menu')&&!wrap.querySelector('.bluey-remembered-menu').hidden;
 wrap.replaceChildren();
 const toggle=pill(`Remembered (${prefs.length}) ▾`,()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden))});
 toggle.setAttribute('aria-haspopup','true');toggle.setAttribute('aria-expanded',String(!!wasOpen));
 const menu=document.createElement('div');menu.className='bluey-remembered-menu';menu.hidden=!wasOpen;
 const head=document.createElement('p');head.textContent='Saved in this browser only:';menu.appendChild(head);
 prefs.forEach((p,i)=>{const row=document.createElement('div');row.className='bluey-remembered-row';const t=document.createElement('span');t.textContent=p;row.append(t,pill('Forget',()=>save(load().filter((_,j)=>j!==i))));menu.appendChild(row)});
 if(prefs.length>1)menu.appendChild(pill('Forget all',()=>{if(window.confirm('Forget everything Bluey remembers in this browser?'))save([])}));
 wrap.append(toggle,menu);
}
document.addEventListener('click',e=>{if(wrap&&e.target.isConnected&&!e.target.closest('.bluey-remembered')){const m=wrap.querySelector('.bluey-remembered-menu');if(m&&!m.hidden){m.hidden=true;wrap.querySelector('button')?.setAttribute('aria-expanded','false')}}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&wrap){const m=wrap.querySelector('.bluey-remembered-menu');if(m)m.hidden=true}});
window.blueyRenderRemembered=renderMenu;
renderMenu();
})();
