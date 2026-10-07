// Sources under a reply that used web search (api/chat.js returns `sources`, keeping only links
// the search really returned). Shown as a small list: page title + site, opening in a new tab,
// with the page's own preview picture as a thumbnail when it has one.
// Also: when a reply is taking a while (searching can take 20-40 seconds), the "Thinking…"
// status changes to a friendlier note so the wait doesn't look broken.
(function(){
'use strict';
let lastChat=null,slowTimer=null;
const SLOW='Still working on it… looking things up can take a moment.';
const blueyFetchBeforeSources=window.fetch;
window.fetch=async function(resource,options){
 const url=typeof resource==='string'?resource:resource?.url||'';
 const isChat=/\/api\/chat(\?|$)/.test(url);
 if(isChat){clearTimeout(slowTimer);slowTimer=setTimeout(()=>{if(/^Thinking/.test(statusEl.textContent||''))statusEl.textContent=SLOW},8000)}
 try{
  const response=await blueyFetchBeforeSources.apply(this,arguments);
  if(isChat&&response.ok){try{lastChat=await response.clone().json()}catch(_){lastChat=null}}
  return response;
 }finally{if(isChat){clearTimeout(slowTimer);if(statusEl.textContent===SLOW)statusEl.textContent=''}}
};

const site=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(_){return ''}};

const blueyAddBeforeSources=add;
add=function(role,text){
 blueyAddBeforeSources(role,text);
 if(role!=='assistant')return;
 const chat=lastChat;lastChat=null;
 const list=Array.isArray(chat?.sources)?chat.sources.filter(s=>s&&/^https?:\/\//i.test(String(s.url||''))):[];
 if(!list.length||chat.reply!==text||chat.handoff)return; // the hand-off card shows its own Official help links
 // Right after this reply's Copy / Play again row.
 let anchor=null;
 for(let el=messages.lastElementChild;el;el=el.previousElementSibling){if(el.classList.contains('msg'))break;if(el.classList.contains('bluey-reply-actions')){anchor=el;break}}
 const box=document.createElement('div');box.className='bluey-sources';
 const head=document.createElement('p');head.className='bluey-sources-head';head.textContent='Sources';box.appendChild(head);
 const ol=document.createElement('ol');
 for(const s of list){
  const li=document.createElement('li');const a=document.createElement('a');
  a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';
  a.textContent=s.title||site(s.url);
  const where=document.createElement('span');where.className='bluey-sources-site';where.textContent=site(s.url);
  // The page's own preview picture (api/_previews.js), when it has one. It links to the page too;
  // if it doesn't load, it quietly goes away.
  if(/^https:\/\//i.test(String(s.image||''))){
   const pic=document.createElement('a');pic.className='bluey-sources-thumb';pic.href=s.url;pic.target='_blank';pic.rel='noopener noreferrer';pic.tabIndex=-1;pic.setAttribute('aria-hidden','true');
   const img=document.createElement('img');img.src=s.image;img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
   img.addEventListener('error',()=>{pic.remove();li.classList.remove('has-thumb')});
   pic.append(img);li.classList.add('has-thumb');li.append(pic);
  }
  const words=document.createElement('span');words.className='bluey-sources-words';words.append(a,where);
  li.append(words);ol.appendChild(li);
 }
 box.appendChild(ol);
 (anchor||messages.lastElementChild).after(box);
};
})();
