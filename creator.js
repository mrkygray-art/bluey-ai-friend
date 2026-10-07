// Bluey knows his creator. Ky opens a private link once per device:
//   https://bluey-ai-friend.vercel.app/?creator=<code>
// The code is saved in this browser (localStorage bluey-creator), removed from the address bar, and
// sent with every /api/chat request. api/chat.js compares it with the BLUEY_CREATOR_CODE secret on
// the server; only a match tells Bluey "this is Ky Gray, who built you". A wrong or missing code
// changes nothing. ?creator=off forgets it on this device. Loaded early, so greetings.js can greet
// Ky by name (cosmetic only; the server decides what Bluey believes).
// An app added to the iPhone Home Screen has its own storage (separate from Safari) and no address
// bar, so the code can also be typed in the message box as "creator: <code>" (or "creator: off").
// That message is caught here, saved, and never sent to Bluey or shown in the chat.
(function(){
'use strict';
const KEY='bluey-creator';
let code=null;
try{
 const url=new URL(location.href);const given=url.searchParams.get('creator');
 if(given!==null){
  if(given==='off'||given===''){localStorage.removeItem(KEY)}
  else if(/^[A-Za-z0-9_-]{8,80}$/.test(given)){localStorage.setItem(KEY,given);window.blueyCreatorJustSaved=true}
  // window.history: the app has its own global `history` (the chat), which hides the browser's.
  url.searchParams.delete('creator');window.history.replaceState(null,'',url.pathname+(url.search||'')+url.hash);
 }
}catch(_){/* a bad link or blocked storage never stops the app */}
try{code=localStorage.getItem(KEY)}catch(_){code=null}
if(window.blueyCreatorJustSaved)addEventListener('load',()=>setTimeout(()=>{if(typeof tempStatus==='function')tempStatus('Hi K.Y.! I’ll know it’s you on this device now.',7000)},3400));

const previousFetch=window.fetch;
window.fetch=function(resource,init){
 const url=typeof resource==='string'?resource:resource?.url||'';
 if(code&&/\/api\/chat(\?|$)/.test(url)&&typeof init?.body==='string'){
  try{const body=JSON.parse(init.body);body.creator=code;init={...init,body:JSON.stringify(body)}}catch(_){}
 }
 return previousFetch.call(this,resource,init);
};
function welcome(){if(typeof tempStatus==='function')tempStatus('Hi K.Y.! I’ll know it’s you on this device now.',7000)}
// "creator: <code>" typed in the message box (runs before the app's own submit handler)
const form=document.getElementById('form'),box=document.getElementById('input');
form?.addEventListener('submit',e=>{
 const m=String(box?.value||'').trim().match(/^creator[:\s]+([A-Za-z0-9_-]{8,80}|off)$/i);if(!m)return;
 e.preventDefault();e.stopImmediatePropagation();box.value='';
 try{if(m[1].toLowerCase()==='off'){localStorage.removeItem(KEY);code=null;if(typeof tempStatus==='function')tempStatus('Okay, I’ve forgotten that on this device.',4000)}else{localStorage.setItem(KEY,m[1]);code=m[1];welcome()}}catch(_){}
},true);
window.blueyIsCreator=()=>!!code;
})();
