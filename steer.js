// Steer buttons: under Bluey's latest draft (an email, text, post, plan...), offer
// Shorter / Warmer / More specific / Different angle. Tapping one sends an ordinary
// message ("Make it shorter."), so people see in their own chat that a few plain words
// steer the result. Teach without teaching.
//
// The brain marks drafts with brain.isDraft (api/chat.js). The older layers call
// add('assistant', reply) without the brain, so this layer reads each /api/chat
// response as it arrives and remembers the latest one. The response is parsed before
// the caller gets it, so the flag is always ready by the time add() runs.
(function(){
'use strict';
const STEERS=[
 ['Shorter','Make it shorter.'],
 ['Warmer','Make it warmer.'],
 ['More specific','Make it more specific.'],
 ['Different angle','Try a different angle.']
];
let lastChat=null;

const blueyFetchBeforeSteer=window.fetch;
window.fetch=async function(resource,options){
 const response=await blueyFetchBeforeSteer.apply(this,arguments);
 const url=typeof resource==='string'?resource:resource?.url||'';
 if(/\/api\/chat(\?|$)/.test(url)&&response.ok){
  try{lastChat=await response.clone().json()}catch(_){lastChat=null}
 }
 return response;
};

function clearSteers(){document.querySelectorAll('.bluey-steer').forEach(row=>row.remove())}

const blueyAddBeforeSteer=add;
add=function(role,text){
 blueyAddBeforeSteer(role,text);
 if(role!=='assistant')return;
 clearSteers();
 const chat=lastChat;lastChat=null;
 if(!chat?.brain?.isDraft||chat.reply!==text)return;
 const node=messages.lastElementChild;
 const anchor=node?.classList.contains('bluey-reply-actions')?node:null;
 if(!anchor)return;
 const row=document.createElement('div');row.className='bluey-steer';row.setAttribute('role','group');row.setAttribute('aria-label','Change this draft');
 for(const [label,message] of STEERS){
  const button=document.createElement('button');button.type='button';button.textContent=label;
  button.addEventListener('click',()=>{
   clearSteers();
   if(typeof blueyUnlockPhoneAudio==='function')blueyUnlockPhoneAudio();
   send(message);
  });
  row.appendChild(button);
 }
 anchor.after(row);
};
})();
