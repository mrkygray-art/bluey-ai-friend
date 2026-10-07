// "Easier to use" settings in the blue + menu, for older and first-time users:
// - Text size: Normal / Large / Larger. Scales the chat, the message box, and the file tray
//   (CSS zoom on those areas, set by data-text on <html>, so every pill and chip grows too).
// - Slower voice: asks /api/speech for slower, calmer speech, and slows the browser's own
//   voice (used when generated speech is unavailable).
// - Simpler words: every /api/chat request carries simple:true, and Bluey answers in short
//   sentences with everyday words.
// Saved in this browser (localStorage bluey-ease) and applied before the page is shown.
(function(){
'use strict';
const KEY='bluey-ease',SIZES=[['normal','A','Normal text'],['large','A+','Large text'],['larger','A++','Larger text']];
let ease={text:'normal',slow:false,simple:false};
try{Object.assign(ease,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_){}
if(!SIZES.some(s=>s[0]===ease.text))ease.text='normal';
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(ease))}catch(_){}};
const apply=()=>{document.documentElement.dataset.text=ease.text};
apply();

// Requests carry the choices.
const previousFetch=window.fetch;
window.fetch=function(resource,init){
 const url=typeof resource==='string'?resource:resource?.url||'';
 const chat=/\/api\/chat(\?|$)/.test(url),speech=/\/api\/speech(\?|$)/.test(url);
 if((chat&&ease.simple)||(speech&&ease.slow)){
  if(typeof init?.body==='string'){try{const body=JSON.parse(init.body);if(chat)body.simple=true;else body.slow=true;init={...init,body:JSON.stringify(body)}}catch(_){}}
 }
 return previousFetch.call(this,resource,init);
};
// The browser's own voice (fallback) slows down too.
if('speechSynthesis' in window&&typeof speechSynthesis.speak==='function'){
 const speak=speechSynthesis.speak.bind(speechSynthesis);
 speechSynthesis.speak=function(u){try{if(ease.slow&&u&&typeof u.rate==='number')u.rate=Math.min(u.rate,.8)}catch(_){}return speak(u)};
}

function build(){
 const menu=document.querySelector('.bluey-plus-menu');if(!menu||menu.querySelector('.bluey-ease'))return;
 const box=document.createElement('div');box.className='bluey-ease';
 const head=document.createElement('p');head.className='bluey-plus-head';head.textContent='Easier to use';
 const sizes=document.createElement('div');sizes.className='bluey-ease-sizes';sizes.setAttribute('role','group');sizes.setAttribute('aria-label','Text size');
 const sizeButtons=SIZES.map(([value,label,name])=>{
  const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',name);b.title=name;b.dataset.size=value;
  b.addEventListener('click',()=>{ease.text=value;save();apply();sync();if(typeof tempStatus==='function')tempStatus(value==='normal'?'Normal text size.':'Bigger text, coming right up.',2500)});
  sizes.append(b);return b;
 });
 const toggles=document.createElement('div');toggles.className='bluey-ease-toggles';
 function toggle(key,label){
  const b=document.createElement('button');b.type='button';
  b.addEventListener('click',()=>{ease[key]=!ease[key];save();sync()});
  b.sync=()=>{b.textContent=`${label}: ${ease[key]?'On':'Off'}`;b.setAttribute('aria-pressed',String(!!ease[key]))};
  toggles.append(b);return b;
 }
 const slow=toggle('slow','Slower voice'),simple=toggle('simple','Simpler words');
 function sync(){sizeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.size===ease.text)));slow.sync();simple.sync()}
 sync();
 box.append(head,sizes,toggles);
 const remembered=menu.querySelector('.bluey-plus-remembered');
 remembered?menu.insertBefore(box,remembered):menu.append(box);
}
build();
document.addEventListener('DOMContentLoaded',build);
window.blueyEase=()=>({...ease});
})();
