// Talk hint: a readable line under Bluey's greeting ("Tap me, the big blue ball, to talk. Tap me
// again when you're done.") for people who haven't used voice yet. It stays on every visit
// until they've sent VOICE_USES_TO_LEARN voice messages (counted from successful
// /api/transcribe replies; localStorage bluey-voice-uses), then goes away for good.
// Hidden while Bluey is listening, thinking, or speaking, when his status line says what's
// happening. Typing never hides it: it's about learning the voice button.
(function(){
'use strict';
const KEY='bluey-voice-uses',VOICE_USES_TO_LEARN=2;
const uses=()=>{try{return Number(localStorage.getItem(KEY))||0}catch(_){return 0}};
const copy=document.querySelector('.stage-copy'),status=document.getElementById('status'),orb=document.getElementById('orb');
if(!copy||!status)return;

let hint=null;
if(uses()<VOICE_USES_TO_LEARN){
 hint=document.createElement('p');hint.className='bluey-talk-hint';
 hint.innerHTML='<span aria-hidden="true">👆</span> Tap me, the big blue ball, to talk. Tap me again when you’re done.';
 status.after(hint);
}

// Count a voice message each time a recording is written down
const realFetch=window.fetch;
window.fetch=async function(input,init){
 const res=await realFetch.apply(this,arguments);
 try{
  const url=typeof input==='string'?input:input?.url||'';
  if(res.ok&&/\/api\/transcribe\b/.test(url)){
   const n=uses()+1;
   try{localStorage.setItem(KEY,String(n))}catch(_){}
   if(n>=VOICE_USES_TO_LEARN&&hint){hint.remove();hint=null}
  }
 }catch(_){}
 return res;
};

// Out of the way while Bluey is busy with a recording or a reply
const BUSY=['bluey-listening','bluey-thinking','bluey-speaking'];
function sync(){if(hint)hint.hidden=!!(orb&&BUSY.some(c=>orb.classList.contains(c)))||document.getElementById('app')?.classList.contains('working')}
if(orb)new MutationObserver(sync).observe(orb,{attributes:true,attributeFilter:['class']});
const app=document.getElementById('app');if(app)new MutationObserver(sync).observe(app,{attributes:true,attributeFilter:['class']});
sync();
window.blueyTalkHint={uses,shown:()=>!!hint};
})();
