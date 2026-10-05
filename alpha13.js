// Alpha 13: let the user verify speech on the current phone and explain playback failures.
blueyVoiceButton.addEventListener('click',()=>{
 if(window.blueyServerVoiceEnabled)return;
 if(!blueyVoiceOn)return;
 if(!('speechSynthesis'in window)||typeof window.SpeechSynthesisUtterance!=='function'){
  statusEl.textContent='This browser does not support Bluey’s spoken replies. Try opening Bluey in Chrome.';
  return;
 }
 statusEl.textContent='Testing Bluey’s voice…';
 speak('Hi there! Bluey’s voice is ready.','happy');
 setTimeout(()=>{
  const synth=window.speechSynthesis;
  if(blueyVoiceOn&&statusEl.textContent==='Testing Bluey’s voice…'&&!synth.speaking&&!synth.pending){
   statusEl.textContent='No audio started. Check your phone’s media volume and Text-to-speech settings.';
  }
 },2500);
});

// Alpha 43 bootstrap: load World Truth only after the existing static Alpha modules
// have finished, so it can safely wrap the final room/object/send engines.
window.addEventListener('load',()=>{
 if(document.querySelector('script[data-bluey-alpha43]'))return;
 const script=document.createElement('script');
 script.src='/alpha43.js';
 script.dataset.blueyAlpha43='true';
 script.onload=()=>console.info('[Bluey] Alpha 43 bootstrap loaded');
 script.onerror=()=>console.error('[Bluey] Alpha 43 failed to load');
 document.body.appendChild(script);
},{once:true});
