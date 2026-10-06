// Steer buttons: under Bluey's latest draft (an email, text, post, plan...), offer
// Shorter / Warmer / More specific / Different angle, plus a "More ▾" dropdown with
// extra options. Tapping one sends an ordinary message ("Make it shorter."), so people
// see in their own chat that a few plain words steer the result. Teach without teaching.
// When the draft rests on a guess, brain.assumption is shown above the buttons
// ("💭 I aimed this at a coworker...") with a "Fix that" button that starts a correction.
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
// [label, message to send] or [label, text to start typing, true]
const MORE=[
 ['More formal','Make it more formal.'],
 ['More casual','Make it more casual.'],
 ['Simpler words','Use simpler words.'],
 ['Bullet points','Turn it into bullet points.'],
 ['For someone else…','Rewrite it for ',true],
 ['Something else…','Change it so ',true]
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

function clearSteers(){document.querySelectorAll('.bluey-steer,.bluey-assumption').forEach(el=>el.remove())}
function pill(label,onClick){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',onClick);return b}
function steerTo(message){clearSteers();if(typeof blueyUnlockPhoneAudio==='function')blueyUnlockPhoneAudio();send(message)}
function startTyping(text){
 input.value=text;input.focus();
 try{input.setSelectionRange(text.length,text.length)}catch(_){}
 input.dispatchEvent(new Event('input',{bubbles:true}));
}

function moreMenu(){
 const wrap=document.createElement('div');wrap.className='bluey-more';
 const toggle=pill('More ▾',()=>{const open=menu.hidden;closeMenus();if(open){menu.hidden=false;toggle.setAttribute('aria-expanded','true');menu.scrollIntoView({block:'nearest',behavior:'smooth'});(menu.querySelector('button')||toggle).focus({preventScroll:true})}});
 toggle.setAttribute('aria-haspopup','true');toggle.setAttribute('aria-expanded','false');
 const menu=document.createElement('div');menu.className='bluey-more-menu';menu.hidden=true;menu.setAttribute('role','group');menu.setAttribute('aria-label','More ways to change this draft');
 for(const [label,text,typeIt] of MORE)menu.appendChild(pill(label,()=>{closeMenus();if(typeIt)startTyping(text);else steerTo(text)}));
 wrap.append(toggle,menu);
 return wrap;
}
function closeMenus(){document.querySelectorAll('.bluey-more-menu').forEach(m=>{m.hidden=true;m.previousElementSibling?.setAttribute('aria-expanded','false')})}
document.addEventListener('click',e=>{if(!e.target.closest('.bluey-more'))closeMenus()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus()});

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
 for(const [label,message] of STEERS)row.appendChild(pill(label,()=>steerTo(message)));
 row.appendChild(moreMenu());
 anchor.after(row);
 const guess=typeof chat.brain.assumption==='string'?chat.brain.assumption.trim():'';
 if(guess){
  const note=document.createElement('div');note.className='bluey-assumption';
  const say=document.createElement('span');say.textContent='💭 '+guess;
  note.append(say,pill('Fix that',()=>startTyping('Actually, ')));
  anchor.after(note);
 }
};
})();
