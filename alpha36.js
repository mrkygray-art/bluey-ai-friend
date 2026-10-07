// Alpha 36 — reliable voice playback, remembered chats, and simple reply tools.
window.blueyServerVoiceEnabled=true;
const blueySpeechTestLine='Hi! Bluey here. I can hear you just fine, and my voice is ready.';
let blueySpeechSequence=0,blueySpeechController=null,blueyCurrentSource=null,blueySpeakingKey='',blueySpeakingAt=0;

function blueyUnlockPhoneAudio(){
 try{
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  if(!blueyAudioContext)blueyAudioContext=new C();
  if(blueyAudioContext.state==='suspended')blueyAudioContext.resume().catch(()=>{});
 }catch(_){/* The generated audio request can still use browser playback. */}
}
function blueyStopVoice(){
 blueySpeechSequence++;
 try{blueySpeechController?.abort()}catch(_){}
 blueySpeechController=null;
 try{blueyCurrentSource?.stop()}catch(_){}
 blueyCurrentSource=null;
 if('speechSynthesis'in window)try{speechSynthesis.cancel()}catch(_){}
}
function blueyBrowserSpeech(text,b){
 if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance!=='function')return false;
 try{
  const utterance=new SpeechSynthesisUtterance(text),voices=speechSynthesis.getVoices()||[];
  utterance.voice=voices.find(v=>/coral|samantha|aria|jenny|ava/i.test(v.name)&&/^en/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang))||null;
  utterance.rate=.97;utterance.onstart=()=>behavior(b==='serious'?'serious':b==='curious'?'curious':b==='happy'?'happy':'explaining');
  utterance.onend=()=>behavior('idle');speechSynthesis.speak(utterance);return true;
 }catch(_){return false}
}
const blueySpeakAlpha36Previous=speak;
speak=async function(text,b='explaining'){
 const spoken=String(text||'').trim();if(!spoken||!blueyVoiceOn)return;
 const now=Date.now();if(spoken===blueySpeakingKey&&now-blueySpeakingAt<1600)return;
 blueySpeakingKey=spoken;blueySpeakingAt=now;blueyStopVoice();blueyUnlockPhoneAudio();
 const sequence=blueySpeechSequence;
 try{
  const chunks=[];let remaining=spoken;
  while(remaining.length>3900){
   let cut=remaining.lastIndexOf(' ',3900),sentence=Math.max(remaining.lastIndexOf('. ',3900),remaining.lastIndexOf('? ',3900),remaining.lastIndexOf('! ',3900));
   if(sentence>1800)cut=sentence+1;if(cut<1200)cut=3900;
   chunks.push(remaining.slice(0,cut).trim());remaining=remaining.slice(cut).trim();
  }
  if(remaining)chunks.push(remaining);
  for(const chunk of chunks){
   if(sequence!==blueySpeechSequence||!blueyVoiceOn)return;
   blueySpeechController=new AbortController();
   const response=await fetch('/api/speech',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:chunk}),signal:blueySpeechController.signal});
   if(!response.ok){const details=await response.json().catch(()=>({}));throw new Error(details.error||`Voice service returned ${response.status}`)}
   const bytes=await response.arrayBuffer();if(sequence!==blueySpeechSequence||!blueyVoiceOn)return;
   if(!blueyAudioContext)blueyUnlockPhoneAudio();
   if(!blueyAudioContext)throw new Error('Phone audio is not available');
   if(blueyAudioContext.state==='suspended')await blueyAudioContext.resume();
   const buffer=await blueyAudioContext.decodeAudioData(bytes.slice(0));if(sequence!==blueySpeechSequence||!blueyVoiceOn)return;
   const source=blueyAudioContext.createBufferSource();source.buffer=buffer;source.connect(blueyAudioContext.destination);blueyCurrentSource=source;
   behavior(b==='serious'?'serious':b==='curious'?'curious':b==='happy'?'happy':'explaining');
   await new Promise(resolve=>{source.onended=resolve;source.start(0)});
   if(sequence===blueySpeechSequence)blueyCurrentSource=null;
  }
  if(sequence===blueySpeechSequence){behavior('idle');statusEl.textContent=''}
 }catch(error){
  if(error?.name==='AbortError'||sequence!==blueySpeechSequence||!blueyVoiceOn)return;
  console.warn('Generated voice playback unavailable; trying device voice.',error);
  const played=blueyBrowserSpeech(spoken,b);
  if(played){statusEl.textContent='Using your phone’s speech voice as a backup.';setTimeout(()=>{if(statusEl.textContent==='Using your phone’s speech voice as a backup.')statusEl.textContent=''},4500)}
  else statusEl.textContent='Bluey could not play audio. Check media volume, then tap Voice to test again.';
 }
};

// Unlock Web Audio from the actual phone tap before a network response is awaited.
form.addEventListener('pointerdown',blueyUnlockPhoneAudio,{capture:true});
form.addEventListener('submit',blueyUnlockPhoneAudio,{capture:true});
document.querySelector('#bluey-voice').addEventListener('click',()=>{
 if(!blueyVoiceOn){blueyStopVoice();return}
 blueyUnlockPhoneAudio();statusEl.textContent='Testing Bluey’s voice…';speak(blueySpeechTestLine,'happy');
});

// Small message actions stay outside the text paragraph, so screen readers and speech read only the reply.
const blueyAddAlpha36Previous=add;
add=function(role,text){
 blueyAddAlpha36Previous(role,text);
 const node=messages.lastElementChild;
 if(role==='assistant'&&node?.classList.contains('msg')){
  const actions=document.createElement('div');actions.className='bluey-reply-actions';
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copy';copy.setAttribute('aria-label','Copy Bluey’s reply');
  copy.addEventListener('click',async()=>{try{await (window.blueyCopyReply?blueyCopyReply(String(text)):navigator.clipboard.writeText(String(text)));tempStatus('Copied Bluey’s reply.',2200)}catch{tempStatus('Copy is unavailable in this browser.',2500)}});
  const replay=document.createElement('button');replay.type='button';replay.textContent='▶ Play again';replay.setAttribute('aria-label','Play Bluey’s reply again');
  replay.addEventListener('click',()=>{blueyUnlockPhoneAudio();blueySpeakingKey='';speak(String(text),'explaining')});
  actions.append(copy,replay);node.after(actions);
 }
 setTimeout(blueySaveConversation,0);
};

// Keep the current text conversation on this device, so a refresh does not erase it.
const blueyConversationKey='bluey-alpha36-conversation';
function blueySaveConversation(){
 try{
  const transcript=[...messages.querySelectorAll('.msg')].map(node=>({role:node.classList.contains('assistant')?'assistant':'user',content:node.dataset.raw??node.textContent??''}));
  if(transcript.length)localStorage.setItem(blueyConversationKey,JSON.stringify(transcript.slice(-100)));
  else localStorage.removeItem(blueyConversationKey);
 }catch(_){/* Private browsing/storage limits should never block chat. */}
}
function blueyRestoreConversation(){
 try{
  const saved=JSON.parse(localStorage.getItem(blueyConversationKey)||'[]');if(!Array.isArray(saved)||!saved.length)return;
  for(const item of saved.slice(-100)){
   if(!item||!['user','assistant'].includes(item.role)||typeof item.content!=='string')continue;
   let paragraph;if(item.role==='assistant'&&window.blueyFormat)paragraph=blueyFormat(item.content);else{paragraph=document.createElement('p');paragraph.className='msg '+item.role;paragraph.textContent=item.content}messages.appendChild(paragraph);
   history.push({role:item.role,content:item.content});
   if(item.role==='assistant'){
    const actions=document.createElement('div');actions.className='bluey-reply-actions';
    const copy=document.createElement('button');copy.type='button';copy.textContent='Copy';copy.addEventListener('click',async()=>{try{await (window.blueyCopyReply?blueyCopyReply(item.content):navigator.clipboard.writeText(item.content));tempStatus('Copied Bluey’s reply.',2200)}catch{}});
    const replay=document.createElement('button');replay.type='button';replay.textContent='▶ Play again';replay.addEventListener('click',()=>{blueyUnlockPhoneAudio();blueySpeakingKey='';speak(item.content,'explaining')});actions.append(copy,replay);paragraph.after(actions);
   }
  }
  if(history.length)working();messages.scrollTop=messages.scrollHeight;
 }catch(_){try{localStorage.removeItem(blueyConversationKey)}catch(__){}}
}
blueyRestoreConversation();

const blueyTools=document.querySelector('#bluey-tools');
const blueySessionTools=document.createElement('div');blueySessionTools.className='bluey-tool-group bluey-session-tools';
const blueyNewChat=document.createElement('button');blueyNewChat.type='button';blueyNewChat.textContent='New chat';blueyNewChat.setAttribute('aria-label','Start a new chat');
blueyNewChat.addEventListener('click',()=>{
 if(history.length&&!window.confirm('Start a new chat? This clears the conversation saved on this device.'))return;
 blueyStopVoice();history.length=0;messages.replaceChildren();localStorage.removeItem(blueyConversationKey);blueyPhotos=[];blueyRecentPhotos=[];if(window.blueyClearDocuments)blueyClearDocuments();if(window.blueyEndPractice)blueyEndPractice();
 if(typeof blueySyncControls==='function')blueySyncControls();input.value='';statusEl.textContent='';app.classList.remove('working');tempStatus('Fresh page, fresh start. I’m right here.',3000);input.focus();
});
const blueyExport=document.createElement('button');blueyExport.type='button';blueyExport.textContent='↓ Save chat';blueyExport.setAttribute('aria-label','Download this conversation as a text file');
blueyExport.addEventListener('click',()=>{
 const transcript=[...messages.querySelectorAll('.msg')].map(node=>`${node.classList.contains('user')?'You':'Bluey'}: ${node.textContent}`).join('\n\n');
 if(!transcript){tempStatus('There is nothing to save yet.',2000);return}
 const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([transcript],{type:'text/plain;charset=utf-8'}));link.download=`bluey-chat-${new Date().toISOString().slice(0,10)}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});
blueySessionTools.append(blueyNewChat,blueyExport);blueyTools.appendChild(blueySessionTools);

// Download chat and regenerate-last-reply are keyboard-friendly, device-safe helpers.
input.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();form.requestSubmit()}});
