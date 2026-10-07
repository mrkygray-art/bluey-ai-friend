// Bluey knows his creator. Ky opens a private link once per device:
//   https://bluey-ai-friend.vercel.app/?creator=<code>
// The code is saved in this browser (localStorage bluey-creator), removed from the address bar, and
// sent with every /api/chat request. api/chat.js compares it with the BLUEY_CREATOR_CODE secret on
// the server; only a match tells Bluey "this is Ky Gray, who built you". A wrong or missing code
// changes nothing. ?creator=off forgets it on this device. Loaded early, so greetings.js can greet
// Ky by name (cosmetic only; the server decides what Bluey believes).
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
window.blueyIsCreator=()=>!!code;
})();
