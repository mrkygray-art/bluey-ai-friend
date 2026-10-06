// Simpler bottom controls.
// - A round blue "+" at the left of the message box opens one menu that holds everything
//   that isn't New chat: Add photos & files, Take a photo (phones only), the Voice and Sounds
//   switches, and Remembered (preferences.js renders into the menu's slot). New controls go
//   here too, so the screen stays clean. The old Add photos and Sound pills are gone.
// - #bluey-voice and #bluey-sounds are moved (not copied) into the menu, so every existing
//   behavior (alpha7, alpha36, alpha8...) keeps working by id. When Voice is off, the "+"
//   shows a small muted badge, so a quiet Bluey isn't a mystery.
// - files.js handles what the two pickers return (photos, PDF, Word, text, CSV).
// - "Save chat" is hidden in controls.css; its code in alpha36.js is kept.
// - The "Small spelling suggestion" card is switched off (the browser's own spell check in the
//   chat box underlines mistakes and offers fixes on right-click, like Notepad). Its code in
//   alpha7.js is kept; blueyShowSuggestion is just replaced with a no-op here.
blueyShowSuggestion=function(){};

(function(){
'use strict';
const form=document.getElementById('form'),voice=document.getElementById('bluey-voice'),sounds=document.getElementById('bluey-sounds');
if(!form||!voice||!sounds)return;
const phone=window.matchMedia?.('(pointer: coarse)').matches;

const wrap=document.createElement('div');wrap.className='bluey-plus';
const toggle=document.createElement('button');toggle.type='button';toggle.className='bluey-plus-toggle';
toggle.setAttribute('aria-haspopup','true');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Add photos and files, and settings');
toggle.title='Add photos and files';
const plus=document.createElement('span');plus.className='bluey-plus-sign';plus.setAttribute('aria-hidden','true');plus.textContent='+';
const badge=document.createElement('span');badge.className='bluey-plus-muted';badge.setAttribute('aria-hidden','true');badge.textContent='🔇';
toggle.append(plus,badge);

const menu=document.createElement('div');menu.className='bluey-plus-menu';menu.hidden=true;menu.setAttribute('role','group');menu.setAttribute('aria-label','Add and settings');
function item(icon,label,hint,onClick){
 const b=document.createElement('button');b.type='button';b.className='bluey-plus-item';
 const i=document.createElement('span');i.className='bluey-plus-icon';i.setAttribute('aria-hidden','true');i.textContent=icon;
 const t=document.createElement('span');t.className='bluey-plus-text';t.textContent=label;
 if(hint){const h=document.createElement('small');h.textContent=hint;t.append(h)}
 b.append(i,t);b.addEventListener('click',()=>{close();onClick()});return b;
}
const pickFiles=document.createElement('input');pickFiles.type='file';pickFiles.multiple=true;pickFiles.hidden=true;pickFiles.id='bluey-file-input';
pickFiles.accept='image/*,.pdf,.docx,.doc,.txt,.md,.csv,text/plain,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const camera=document.createElement('input');camera.type='file';camera.accept='image/*';camera.setAttribute('capture','environment');camera.hidden=true;camera.id='bluey-camera-input';
menu.append(item('📎','Add photos & files','Pictures, PDF, Word, text, CSV',()=>pickFiles.click()));
if(phone)menu.append(item('📷','Take a photo','',()=>camera.click()));
const soundHead=document.createElement('p');soundHead.className='bluey-plus-head';soundHead.textContent='Sound';
const switches=document.createElement('div');switches.className='bluey-plus-switches';switches.append(voice,sounds);
const remembered=document.createElement('div');remembered.className='bluey-plus-remembered';
menu.append(soundHead,switches,remembered);
wrap.append(toggle,menu,pickFiles,camera);
form.prepend(wrap);

// files.js reads what these return.
pickFiles.addEventListener('change',()=>{const list=[...pickFiles.files||[]];pickFiles.value='';if(list.length&&window.blueyAddFiles)blueyAddFiles(list)});
camera.addEventListener('change',()=>{const list=[...camera.files||[]];camera.value='';if(list.length&&window.blueyAddFiles)blueyAddFiles(list)});

const isOn=b=>b.getAttribute('aria-pressed')==='true'||/:\s*on\b/i.test(b.textContent||'');
function label(){toggle.classList.toggle('is-muted',!isOn(voice))}
label();
const watch=new MutationObserver(label);
for(const b of [voice,sounds])watch.observe(b,{attributes:true,attributeFilter:['aria-pressed'],childList:true,characterData:true,subtree:true});

function close(){menu.hidden=true;toggle.setAttribute('aria-expanded','false')}
toggle.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)menu.querySelector('button')?.focus({preventScroll:true})});
// A tap on Forget re-renders the Remembered list, so its button is gone by the time this runs.
document.addEventListener('click',e=>{if(e.target.isConnected&&!e.target.closest('.bluey-plus'))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){close();toggle.focus({preventScroll:true})}});
if(window.blueyRenderRemembered)blueyRenderRemembered();
})();
