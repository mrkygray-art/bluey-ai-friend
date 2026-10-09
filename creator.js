// Bluey knows his creator only when Ky is signed in on his own account. The server decides
// (api/_creator.js checks the signed-in account that account.js sends) and says so in each
// /api/chat reply as `creator`. This file only keeps a note of that answer, so greetings.js can
// greet Ky with his own hellos on the next visit (cosmetic only; the server decides what Bluey
// believes). Signing out (account.js) clears the note.
// The old private-link code (?creator=<code>, localStorage bluey-creator) no longer counts: any
// copy left on a device is removed, and the parameter is dropped from the address bar.
(function(){
'use strict';
const KEY='bluey-is-ky',OLD='bluey-creator';
try{
 localStorage.removeItem(OLD);
 const url=new URL(location.href);
 if(url.searchParams.has('creator')){url.searchParams.delete('creator');window.history.replaceState(null,'',url.pathname+(url.search||'')+url.hash)}
}catch(_){/* blocked storage never stops the app */}
let known=false;
try{known=localStorage.getItem(KEY)==='1'}catch(_){}

function set(on){
 if(on===known)return;
 known=on;
 try{on?localStorage.setItem(KEY,'1'):localStorage.removeItem(KEY)}catch(_){}
 if(on&&typeof tempStatus==='function')tempStatus('Hi K.Y.! I know it’s you.',6000);
}

const previousFetch=window.fetch;
window.fetch=function(resource,init){
 const url=typeof resource==='string'?resource:resource?.url||'';
 const p=previousFetch.call(this,resource,init);
 if(/\/api\/chat(\?|$)/.test(url))p.then(r=>{if(r.ok)r.clone().json().then(d=>{if(typeof d?.creator==='boolean')set(d.creator)}).catch(()=>{})}).catch(()=>{});
 return p;
};
window.blueyIsCreator=()=>known;
window.blueyForgetCreator=()=>set(false);
})();
