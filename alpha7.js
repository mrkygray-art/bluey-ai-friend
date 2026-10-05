// Alpha 7: useful files and gentle feedback, with the same small blue friend.
const blueyOriginalSendAlpha7=send;
const blueyPhotoInput=document.querySelector('#bluey-photo-input');
const blueyAttachButton=document.querySelector('#bluey-attach');
const blueyFileLabel=document.querySelector('#bluey-files');
const blueyVoiceButton=document.querySelector('#bluey-voice');
const blueySoundsButton=document.querySelector('#bluey-sounds');
let blueyPhotos=[],blueyRecentPhotos=[];
let blueyVoiceOn=localStorage.getItem('bluey-voice-on')!=='false';
let blueySoundsOn=localStorage.getItem('bluey-sounds-on')!=='false';
let blueyAudioContext=null,blueyLastSound=0;
function blueySyncControls(){
 blueyVoiceButton.textContent='Voice: '+(blueyVoiceOn?'On':'Off');blueyVoiceButton.setAttribute('aria-pressed',String(blueyVoiceOn));
 blueySoundsButton.textContent='Sounds: '+(blueySoundsOn?'On':'Off');blueySoundsButton.setAttribute('aria-pressed',String(blueySoundsOn));
 const count=blueyPhotos.length||blueyRecentPhotos.length;
 blueyFileLabel.textContent=count?`${count} photo${count===1?'':'s'} ${blueyPhotos.length?'ready':'remembered'}`:'';
 if(typeof blueyRenderPhotoPreview==='function')blueyRenderPhotoPreview();
}
blueySyncControls();
blueyVoiceButton.addEventListener('click',()=>{blueyVoiceOn=!blueyVoiceOn;localStorage.setItem('bluey-voice-on',String(blueyVoiceOn));if(!blueyVoiceOn&&'speechSynthesis'in window)speechSynthesis.cancel();blueySyncControls();});
blueySoundsButton.addEventListener('click',()=>{blueySoundsOn=!blueySoundsOn;localStorage.setItem('bluey-sounds-on',String(blueySoundsOn));blueySyncControls();if(blueySoundsOn)blueyPlaySound('hello');});
blueyAttachButton.addEventListener('click',()=>blueyPhotoInput.click());
function blueyPlaySound(kind='reply'){
 if(!blueySoundsOn||Date.now()-blueyLastSound<250)return;
 blueyLastSound=Date.now();
 try{
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  blueyAudioContext ||= new C();if(blueyAudioContext.state==='suspended')blueyAudioContext.resume();
  const melodies={think:[440,590],hello:[560,760],travel:[520,740,980],photo:[670,920],reply:[740,990],unsure:[350,294],happy:[650,870,1050],swoosh:[430,660,980]};
  const now=blueyAudioContext.currentTime,notes=melodies[kind]||melodies.reply;
  notes.forEach((hz,i)=>{const o=blueyAudioContext.createOscillator(),g=blueyAudioContext.createGain(),start=now+i*.09;o.type='sine';o.frequency.setValueAtTime(hz,start);o.frequency.exponentialRampToValueAtTime(hz*.88,start+.11);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.035,start+.018);g.gain.exponentialRampToValueAtTime(.0001,start+.17);o.connect(g);g.connect(blueyAudioContext.destination);o.start(start);o.stop(start+.18)});
 }catch(_){/* sound is an optional little flourish */}
}
function blueyReadPhoto(file){return new Promise((resolve,reject)=>{
 const reader=new FileReader();reader.onerror=()=>reject(new Error('I could not open that photo.'));
 reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error('That photo format did not open.'));image.onload=()=>{
  const scale=Math.min(1,1100/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
  const c=canvas.getContext('2d');c.drawImage(image,0,0,canvas.width,canvas.height);
  resolve({name:file.name||'Bluey photo',dataUrl:canvas.toDataURL('image/jpeg',.72)});
 };image.src=reader.result};reader.readAsDataURL(file);
})}
blueyPhotoInput.addEventListener('change',async()=>{
 const list=[...blueyPhotoInput.files||[]].slice(0,5);
 try{blueyPhotos=await Promise.all(list.map(blueyReadPhoto));blueyRecentPhotos=[];blueySyncControls();if(blueyPhotos.length){blueyPlaySound('photo');tempStatus('Got them! Tell me what you’d like me to notice or make.',5500)}}
 catch(e){tempStatus(e.message||'I could not open that photo.');blueyPhotos=[];blueySyncControls()}
 blueyPhotoInput.value='';
});
function blueyDocumentFormat(text){
 const t=String(text||'').toLowerCase();
 if(!/\b(create|make|build|save|export|turn|put|write|generate|convert|format)\b/.test(t))return null;
 if(/\b(excel|spreadsheet|\.xlsx|xlsx file)\b/.test(t))return 'xlsx';
 if(/\b(word|\.docx|word document|\.doc)\b/.test(t))return 'docx';
 if(/\b(pdf|\.pdf)\b/.test(t))return 'pdf';
 return null;
}
function blueyShowSuggestion(text){
 if(!text||!messages.lastElementChild)return;
 const box=document.createElement('div');box.className='bluey-suggestion';box.append(document.createTextNode('Small spelling suggestion: '));
 const corrected=document.createElement('span');corrected.textContent=text;box.appendChild(corrected);
 const button=document.createElement('button');button.type='button';button.textContent='Use this';button.addEventListener('click',()=>{input.value=text;input.focus();box.remove()});box.appendChild(button);messages.appendChild(box);messages.scrollTop=messages.scrollHeight;
}
function blueyAddDownload(blob,filename){
 const link=document.createElement('a');link.className='bluey-download';link.href=URL.createObjectURL(blob);link.download=filename;link.textContent='↓  Download '+filename;messages.appendChild(link);messages.scrollTop=messages.scrollHeight;
 setTimeout(()=>URL.revokeObjectURL(link.href),10*60*1000);
}
async function blueyCreateDocument(text,format,photos){
 touchActivity();add('user',text);history.push({role:'user',content:text});input.value='';behavior('thinking');blueyPlaySound('think');statusEl.textContent='Putting your file together…';
 try{
  const r=await fetch('/api/document',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({format,messages:history.slice(-20),attachments:photos})});
  if(!r.ok){let d={};try{d=await r.json()}catch{}throw new Error(d.error||'Bluey could not create that file.')}
  const blob=await r.blob(),disposition=r.headers.get('content-disposition')||'',match=disposition.match(/filename="?([^";]+)"?/i),filename=match?.[1]||`bluey-document.${format}`;
  add('assistant',`All set. I made the ${format==='xlsx'?'spreadsheet':format==='docx'?'Word document':'PDF'} for you.`);blueyAddDownload(blob,filename);history.push({role:'assistant',content:`Created ${filename}.`});behavior('happy');blueyPlaySound('reply');blueyPhotos=[];blueyRecentPhotos=[];blueySyncControls();statusEl.textContent='';
 }catch(e){console.error('Bluey document error',e);statusEl.textContent=e.message||'I hit a snag making that file. Try again in a moment.';behavior('unsure')}
}
async function blueyChatWithPhotos(text,photos){
 touchActivity();detectQuietIntent(text);add('user',text);history.push({role:'user',content:text});input.value='';behavior('thinking');blueyPlaySound('think');statusEl.textContent=`Sending ${photos.length} photo${photos.length===1?'':'s'} to Bluey…`;
 try{
  const r=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:history.slice(-20),attachments:photos})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'Bluey could not look at that yet.');
  if(!d.photoApiVersion)throw new Error('The live server did not confirm your photo. Update api/chat.js from the current bundle and redeploy. Your photo is still here.');
  if(d.imagesSubmitted!==photos.length)throw new Error(`The server received ${Number(d.imagesSubmitted)||0} of ${photos.length} photo uploads. Your photo is still here—please try again after the server update.`);
  if(d.imagesReceived!==photos.length)throw new Error(`The server received ${Number(d.imagesReceived)||0} readable images from ${photos.length} photo uploads. Your photo is still here—please try another image format or upload again.`);
  statusEl.textContent=`Bluey received ${d.imagesReceived} photo${d.imagesReceived===1?'':'s'}.`;add('assistant',d.reply);history.push({role:'assistant',content:d.reply});behavior(d.behavior);if(blueyVoiceOn)speak(d.reply,d.behavior);blueyPlaySound('reply');blueyShowSuggestion(d.spellingSuggestion);
  blueyRecentPhotos=photos;blueyPhotos=[];blueySyncControls();
  setTimeout(()=>{if(statusEl.textContent===`Bluey received ${d.imagesReceived} photo${d.imagesReceived===1?'':'s'}.`)statusEl.textContent=''},3500);
 }catch(e){console.error('Bluey photo chat error',e);statusEl.textContent=e.message||'I had trouble with that photo. Let’s try again.';behavior('unsure')}
}
send=async function(text){
 const clean=String(text||'').trim();if(!clean)return;
 const format=blueyDocumentFormat(clean);
 if(format){await blueyCreateDocument(clean,format,blueyPhotos.length?blueyPhotos:blueyRecentPhotos);return}
 const mentionsPhoto=/\b(photo|picture|image|attached|these|this|those)\b/i.test(clean);
 const photos=blueyPhotos.length?blueyPhotos:(mentionsPhoto?blueyRecentPhotos:[]);
 if(photos.length){await blueyChatWithPhotos(clean,photos);return}
 await blueyOriginalSendAlpha7(clean);
};
// The older conversational paths call speak directly; this gate makes the mute immediate.
const blueySpeakAlpha7=speak;
speak=function(text,b){if(!blueyVoiceOn)return;if(!('speechSynthesis'in window))return;blueySpeakAlpha7(text,b)};
// A room is a quick invitation to explore, not a layer that should linger forever.
let blueyRoomCleanupTimer=null;
const blueyEnterWorldAlpha7=enterWorld;
enterWorld=function(place,announce=true){
 clearTimeout(blueyRoomCleanupTimer);blueyEnterWorldAlpha7(place,announce);blueyPlaySound('travel');
 if(blueyVisibleObjects?.length){blueyRoomCleanupTimer=setTimeout(()=>{blueyVisibleObjects.forEach(el=>el.classList.add('bluey-object-fade'));setTimeout(()=>{blueyVisibleObjects.forEach(el=>el.remove());blueyVisibleObjects=[];blueyObjectFocus=null},850)},16000)}
};
