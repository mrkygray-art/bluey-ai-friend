// Simpler bottom controls.
// - Voice and Sounds are combined into one pill ("🔊 Sound ▾"). Tapping it opens a small menu
//   holding the original Voice: On/Off and Sounds: On/Off buttons, moved there as they are,
//   so every existing behavior (alpha7, alpha36, alpha8...) keeps working by id.
// - "Save chat" is hidden in controls.css; its code in alpha36.js is kept.
// - The "Small spelling suggestion" card is switched off (the browser's own spell check in the
//   chat box underlines mistakes and offers fixes on right-click, like Notepad). Its code in
//   alpha7.js is kept; blueyShowSuggestion is just replaced with a no-op here.
blueyShowSuggestion=function(){};

(function(){
'use strict';
const voice=document.getElementById('bluey-voice'),sounds=document.getElementById('bluey-sounds');
if(!voice||!sounds)return;
const wrap=document.createElement('div');wrap.className='bluey-audio';
const toggle=document.createElement('button');toggle.type='button';toggle.className='bluey-audio-toggle';
toggle.setAttribute('aria-haspopup','true');toggle.setAttribute('aria-expanded','false');
const menu=document.createElement('div');menu.className='bluey-audio-menu';menu.hidden=true;
menu.setAttribute('role','group');menu.setAttribute('aria-label','Voice and sounds');
voice.parentElement.insertBefore(wrap,voice);
menu.append(voice,sounds);
wrap.append(toggle,menu);

const isOn=b=>b.getAttribute('aria-pressed')==='true'||/:\s*on\b/i.test(b.textContent||'');
function label(){
 const v=isOn(voice),s=isOn(sounds);
 toggle.textContent=(v||s?'🔊 Sound':'🔇 Muted')+' ▾';
 toggle.setAttribute('aria-label',`Voice ${v?'on':'off'}, sounds ${s?'on':'off'}. Change`);
}
label();
const watch=new MutationObserver(label);
for(const b of [voice,sounds])watch.observe(b,{attributes:true,attributeFilter:['aria-pressed'],childList:true,characterData:true,subtree:true});

function close(){menu.hidden=true;toggle.setAttribute('aria-expanded','false')}
toggle.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)voice.focus({preventScroll:true})});
document.addEventListener('click',e=>{if(!e.target.closest('.bluey-audio'))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
})();
