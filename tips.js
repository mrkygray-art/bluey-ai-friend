// The light bulb: prompting taught by example, never by lecture.
// When the brain sees that a clearer ask would give a much better result, it returns
// brain.betterPrompt (the user's own request, rewritten stronger) and brain.betterPromptWhy.
// A small 💡 appears under the user's message. Tapping it shows the stronger version, with the
// added parts highlighted, one line on why it helps, and "Try it":
//   - no blanks: sends it right away;
//   - with [blanks]: puts it in the chat box and selects the first blank to fill in.
// Whether the 💡 really gives much better results is checked by scripts/tip-eval.mjs.
(function(){
'use strict';
let lastChat=null;
const blueyFetchBeforeTips=window.fetch;
window.fetch=async function(resource,options){
 const response=await blueyFetchBeforeTips.apply(this,arguments);
 const url=typeof resource==='string'?resource:resource?.url||'';
 if(/\/api\/chat(\?|$)/.test(url)&&response.ok){try{lastChat=await response.clone().json()}catch(_){lastChat=null}}
 return response;
};

const STOP=new Set('a an the and or but to of for in on at by with my me i it is be this that so as from about please can you your'.split(' '));
const norm=w=>w.toLowerCase().replace(/[^a-z0-9']/g,'');

// Build the prompt with the parts the user didn't say highlighted, and blanks marked.
function highlighted(better,original){
 const said=new Set(original.split(/\s+/).map(norm).filter(Boolean));
 const out=document.createDocumentFragment();
 let mark=null;
 for(const part of better.split(/(\[[^\]]+\]|\s+)/).filter(Boolean)){
  if(/^\[[^\]]+\]$/.test(part)){mark=null;const b=document.createElement('span');b.className='bluey-blank';b.textContent=part;out.appendChild(b);continue}
  if(/^\s+$/.test(part)){(mark||out).appendChild(document.createTextNode(part));continue}
  const w=norm(part);
  if(w&&!said.has(w)&&!STOP.has(w)){if(!mark){mark=document.createElement('mark');out.appendChild(mark)}mark.appendChild(document.createTextNode(part))}
  else{mark=null;out.appendChild(document.createTextNode(part))}
 }
 // A trailing space inside a highlight looks odd; move it out.
 out.querySelectorAll?.('mark').forEach(m=>{const t=m.lastChild;if(t?.nodeType===3&&/\s$/.test(t.textContent)){t.textContent=t.textContent.replace(/\s+$/,'');m.after(document.createTextNode(' '))}});
 return out;
}

function closeCards(){document.querySelectorAll('.bluey-tip-card').forEach(c=>{c.hidden=true;c.previousElementSibling?.setAttribute('aria-expanded','false')})}
document.addEventListener('click',e=>{if(!e.target.closest('.bluey-tip'))closeCards()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCards()});

// Blanks from the prompt the user chose to use. Send waits until they're filled in.
let pendingBlanks=[];
function selectBlank(blank){
 const i=input.value.indexOf(blank);if(i<0)return;
 input.focus();try{input.setSelectionRange(i,i+blank.length)}catch(_){}
}
form.addEventListener('submit',e=>{
 const left=pendingBlanks.filter(b=>input.value.includes(b));
 if(!left.length){pendingBlanks=[];return}
 e.preventDefault();e.stopImmediatePropagation();
 selectBlank(left[0]);
 if(typeof tempStatus==='function')tempStatus('Fill in '+left[0]+' first, or delete it.',4500);
},{capture:true});

function tryIt(prompt){
 closeCards();
 const blank=prompt.match(/\[[^\]]+\]/);
 if(!blank){if(typeof blueyUnlockPhoneAudio==='function')blueyUnlockPhoneAudio();send(prompt);return}
 pendingBlanks=prompt.match(/\[[^\]]+\]/g)||[];
 input.value=prompt;input.focus();
 try{input.setSelectionRange(blank.index,blank.index+blank[0].length)}catch(_){}
 input.dispatchEvent(new Event('input',{bubbles:true}));
 if(typeof tempStatus==='function')tempStatus('Fill in the highlighted part, then press Send.',4500);
}

function addBulb(userNode,original,better,why){
 const wrap=document.createElement('div');wrap.className='bluey-tip';
 const bulb=document.createElement('button');bulb.type='button';bulb.className='bluey-bulb';bulb.textContent='💡';
 bulb.setAttribute('aria-label','See a stronger way to ask this');bulb.setAttribute('aria-expanded','false');bulb.title='A stronger way to ask';
 const card=document.createElement('div');card.className='bluey-tip-card';card.hidden=true;card.setAttribute('role','group');card.setAttribute('aria-label','A stronger way to ask');
 const head=document.createElement('p');head.className='bluey-tip-head';head.textContent='💡 A stronger way to ask';
 const text=document.createElement('p');text.className='bluey-tip-prompt';text.appendChild(highlighted(better,original));
 card.append(head,text);
 if(why){const w=document.createElement('p');w.className='bluey-tip-why';w.textContent=why;card.appendChild(w)}
 const go=document.createElement('button');go.type='button';go.className='bluey-tip-try';go.textContent=/\[[^\]]+\]/.test(better)?'Use it':'Try it';
 go.addEventListener('click',()=>tryIt(better));card.appendChild(go);
 bulb.addEventListener('click',()=>{const open=card.hidden;closeCards();if(open){card.hidden=false;bulb.setAttribute('aria-expanded','true');card.scrollIntoView({block:'nearest',behavior:'smooth'})}});
 wrap.append(bulb,card);
 userNode.after(wrap);
}

const blueyAddBeforeTips=add;
add=function(role,text){
 blueyAddBeforeTips(role,text);
 if(role!=='assistant')return;
 const chat=lastChat;lastChat=null;
 const better=typeof chat?.brain?.betterPrompt==='string'?chat.brain.betterPrompt.trim():'';
 if(!better||chat.reply!==text)return;
 // The message this reply answers: the last user message before it.
 const users=[...messages.querySelectorAll('.msg.user')];
 const userNode=users[users.length-1];
 if(!userNode||userNode.nextElementSibling?.classList.contains('bluey-tip'))return;
 const original=userNode.textContent||'';
 if(norm(original)===norm(better))return;
 addBulb(userNode,original,better,typeof chat.brain.betterPromptWhy==='string'?chat.brain.betterPromptWhy.trim():'');
};
})();
