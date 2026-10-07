// Scam and safety check. When someone asks whether a text, email, call, pop-up, or screenshot
// is a scam, api/chat.js returns `safety` ({verdict, headline}); this shows the verdict as a
// clear banner above Bluey's reply (red for a scam, amber for warning signs, blue when it's
// unclear, green-ish for "looks normal, but double-check"). Bluey never says "definitely safe".
// Also adds "Check a message for scams" to the blue + menu: it starts the question in the
// message box, so people can paste the message or add a screenshot.
(function(){
'use strict';
const LOOK={
 scam:{icon:'🚩',label:'Looks like a scam'},
 warning:{icon:'⚠️',label:'Warning signs'},
 unclear:{icon:'🔍',label:'Not sure yet'},
 'likely-ok':{icon:'✅',label:'Looks normal, but double-check'}
};
let lastChat=null;
const previousFetch=window.fetch;
window.fetch=async function(resource){
 const url=typeof resource==='string'?resource:resource?.url||'';
 const response=await previousFetch.apply(this,arguments);
 if(/\/api\/chat(\?|$)/.test(url)&&response.ok){try{lastChat=await response.clone().json()}catch(_){lastChat=null}}
 return response;
};

const previousAdd=add;
add=function(role,text){
 previousAdd(role,text);
 if(role!=='assistant')return;
 const chat=lastChat;lastChat=null;
 const s=chat?.safety,look=s&&LOOK[s.verdict];
 if(!look||chat.reply!==text)return;
 let bubble=null;
 for(let el=messages.lastElementChild;el;el=el.previousElementSibling)if(el.classList.contains('msg')){bubble=el;break}
 if(!bubble||!bubble.classList.contains('assistant'))return;
 const box=document.createElement('div');box.className='bluey-safety is-'+s.verdict;box.setAttribute('role','status');
 const icon=document.createElement('span');icon.className='bluey-safety-icon';icon.setAttribute('aria-hidden','true');icon.textContent=look.icon;
 const words=document.createElement('span');words.className='bluey-safety-text';
 const label=document.createElement('strong');label.textContent=look.label;words.append(label);
 if(s.headline){const h=document.createElement('span');h.textContent=s.headline;words.append(h)}
 box.append(icon,words);bubble.before(box);
};

// "Check a message for scams" in the blue + menu (controls.js builds the menu).
function addMenuItem(){
 const menu=document.querySelector('.bluey-plus-menu');if(!menu||menu.querySelector('.bluey-scam-item'))return;
 const b=document.createElement('button');b.type='button';b.className='bluey-plus-item bluey-scam-item';
 const i=document.createElement('span');i.className='bluey-plus-icon';i.setAttribute('aria-hidden','true');i.textContent='🛡️';
 const t=document.createElement('span');t.className='bluey-plus-text';t.textContent='Check a message for scams';
 const h=document.createElement('small');h.textContent='Paste a text or email, or add a screenshot';t.append(h);
 b.append(i,t);
 b.addEventListener('click',()=>{
  menu.hidden=true;document.querySelector('.bluey-plus-toggle')?.setAttribute('aria-expanded','false');
  input.value='Is this a scam? ';input.dispatchEvent(new Event('input'));
  input.focus();try{input.setSelectionRange(input.value.length,input.value.length)}catch(_){}
  if(typeof tempStatus==='function')tempStatus('Paste the message after the question, or add a screenshot with the + button. Then press Send.',9000);
 });
 // After Add photos & files and Take a photo, before the home-screen item and Sound.
 const adds=[...menu.querySelectorAll('.bluey-plus-item:not(.bluey-install)')],after=adds[adds.length-1];
 after?after.after(b):menu.prepend(b);
}
addMenuItem();
document.addEventListener('DOMContentLoaded',addMenuItem);
})();
