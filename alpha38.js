// Alpha 38 — screenshots can be pasted straight into Bluey's chat.
// The textarea keeps PC screenshot paste useful while preserving the compact mobile composer.
const blueyAlpha38PreviousSend=send;
const blueyComposer38=document.querySelector('#form');
const blueyInput38=document.querySelector('#input');
const blueyPasteLimit38=5;
if(window.BlueyCharacter)window.BlueyCharacter.version='1.0-alpha38';
if(window.blueyAbout)window.blueyAbout.version='1.0-alpha38';

function blueyResizeComposer38(){
 if(!blueyInput38)return;
 blueyInput38.style.height='auto';
 blueyInput38.style.height=Math.min(132,Math.max(42,blueyInput38.scrollHeight))+'px';
}

blueyInput38?.addEventListener('input',blueyResizeComposer38);
blueyInput38?.addEventListener('keydown',event=>{
 if(event.key==='Enter'&&!event.shiftKey&&!event.ctrlKey&&!event.metaKey&&!event.isComposing){
  event.preventDefault();
  blueyComposer38.requestSubmit();
 }
});

blueyInput38?.addEventListener('paste',async event=>{
 const clipboard=event.clipboardData;
 if(!clipboard||typeof blueyReadPhoto!=='function')return;
 const candidates=[];
 const addFile=file=>{
  if(file&&file.type?.startsWith('image/')&&!candidates.includes(file))candidates.push(file);
 };
 for(const item of clipboard.items||[])if(item.kind==='file')addFile(item.getAsFile());
 for(const file of clipboard.files||[])addFile(file);
 if(!candidates.length)return; // Text pastes continue through the browser unchanged.
 event.preventDefault();
 const remaining=Math.max(0,blueyPasteLimit38-blueyPhotos.length);
 if(!remaining){tempStatus('Bluey can hold up to five photos at a time. Remove one to add another.',4500);return}
 const selected=candidates.slice(0,remaining);
 try{
  const imported=await Promise.all(selected.map(blueyReadPhoto));
  blueyPhotos.push(...imported);
  blueyRecentPhotos=[];
  blueySyncControls();
  blueyPlaySound('photo');
  const more=candidates.length>selected.length?' I added the first five.':'';
  tempStatus(`${imported.length===1?'Screenshot':'Screenshots'} pasted and ready to send.${more}`,4000);
 }catch(error){
  console.warn('Bluey could not read a pasted screenshot.',error);
  tempStatus(error?.message||'I could not open that pasted picture. Try saving it as a PNG or JPEG first.',5000);
 }
});
blueyComposer38?.addEventListener('submit',()=>queueMicrotask(blueyResizeComposer38));

// Make image-only sends useful: the user can paste, press Send, and Bluey will inspect it.
send=async function(text){
 const value=String(text||'').trim();
 if(!value&&blueyPhotos.length)return blueyAlpha38PreviousSend('What can you tell me about this picture?');
 return blueyAlpha38PreviousSend(value);
};

blueyResizeComposer38();
