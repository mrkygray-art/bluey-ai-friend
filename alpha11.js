// Alpha 11: every assistant message uses the voice setting, with duplicate-call protection.
let blueyLastSpokenText='',blueyLastSpokenAt=0;
const blueySpeakAlpha11=speak;
speak=function(text,b){
 if(!blueyVoiceOn||!('speechSynthesis'in window)||!text)return;
 const normalized=String(text).trim();
 if(normalized===blueyLastSpokenText&&Date.now()-blueyLastSpokenAt<900)return;
 blueyLastSpokenText=normalized;blueyLastSpokenAt=Date.now();
 try{window.speechSynthesis.resume?.()}catch(_){/* browser may not expose resume */}
 blueySpeakAlpha11(normalized,b);
};
const blueyAddAlpha11=add;
add=function(role,text){
 blueyAddAlpha11(role,text);
 if(role==='assistant'&&blueyVoiceOn){
  const node=messages.lastElementChild;
  setTimeout(()=>{
   if(!blueyVoiceOn||!node?.isConnected)return;
   const currentBehavior=[...mover.classList].find(name=>valid.has(name))||'explaining';
   // The reply's own text (format.js keeps it in data-raw): a formatted bubble's textContent
   // runs list items together ("Packing listTent and stakes").
   speak(node.dataset.raw||node.textContent,currentBehavior);
  },0);
 }
};
// Resume browser speech from the user's tap before a network response arrives.
form.addEventListener('submit',()=>{
 if(blueyVoiceOn&&'speechSynthesis'in window){try{window.speechSynthesis.resume?.()}catch(_){}}
},{capture:true});
