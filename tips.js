// The light bulb and tap-to-answer card: prompting taught by example, never by lecture.
// When the brain sees that a clearer ask would give a much better result, it returns
// brain.betterPrompt (the user's own request, rewritten stronger), brain.betterPromptWhy, and
// brain.tipSlots: one item per [blank] with a short label and 2-3 likely answers (or none, for
// details only the person knows). The card shows the sentence and, under it, each blank's
// answers as chips plus "Other…" (or a text box). The sentence fills in as you tap, so people
// see what a good request looks like. "Write it" turns on once every blank is filled.
//   - When Bluey is asking for details (no draft yet), the card opens right under his reply,
//     so he never asks twice (his question and a separate light bulb).
//   - Otherwise a 💡 appears under the user's message and opens the card when tapped.
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
const BLANK=/(\[[^\]]+\])/;

// Text from the better prompt with the words the user didn't say highlighted.
function addText(target,text,said){
 let mark=null;
 for(const part of text.split(/(\s+)/).filter(Boolean)){
  if(/^\s+$/.test(part)){(mark||target).appendChild(document.createTextNode(part));continue}
  const w=norm(part);
  if(w&&!said.has(w)&&!STOP.has(w)){if(!mark){mark=document.createElement('mark');target.appendChild(mark)}mark.appendChild(document.createTextNode(part))}
  else{mark=null;target.appendChild(document.createTextNode(part))}
 }
 target.querySelectorAll('mark').forEach(m=>{const t=m.lastChild;if(t?.nodeType===3&&/\s$/.test(t.textContent)){t.textContent=t.textContent.replace(/\s+$/,'');m.after(document.createTextNode(' '))}});
}

const example=blank=>{const m=blank.match(/e\.g\.\s*([^\]]+)\]$/i);return m?m[1].trim():''};

function buildCard(better,why,slots,original,asking){
 const said=new Set(original.split(/\s+/).map(norm).filter(Boolean));
 const card=document.createElement('div');card.className='bluey-tip-card';card.setAttribute('role','group');
 const head=document.createElement('p');head.className='bluey-tip-head';
 head.textContent=asking?'Tap your answers':'💡 A stronger way to ask';
 card.setAttribute('aria-label',head.textContent);
 const sentence=document.createElement('p');sentence.className='bluey-tip-prompt';
 const values=slots.map(()=>'');
 const fills=[];
 for(const part of better.split(BLANK).filter(Boolean)){
  const i=slots.findIndex(s=>s.blank===part);
  if(i>=0){const f=document.createElement('span');f.className='bluey-fill';fills[i]=f;sentence.appendChild(f)}
  else addText(sentence,part,said);
 }
 card.append(head,sentence);
 if(why&&!asking){const w=document.createElement('p');w.className='bluey-tip-why';w.textContent=why;card.appendChild(w)}

 const go=document.createElement('button');go.type='button';go.className='bluey-tip-go';
 go.textContent=slots.length?'Write it':'Try it';
 function refresh(){
  slots.forEach((s,i)=>{const f=fills[i];if(!f)return;f.textContent=values[i]||s.label;f.classList.toggle('filled',!!values[i])});
  go.disabled=slots.some((_,i)=>!values[i]);
 }

 slots.forEach((s,i)=>{
  const box=document.createElement('div');box.className='bluey-slot';
  const label=document.createElement('p');label.className='bluey-slot-label';label.textContent=s.label;box.appendChild(label);
  const field=document.createElement('input');field.type='text';field.className='bluey-slot-input';field.enterKeyHint='done';
  field.placeholder=example(s.blank)?'e.g. '+example(s.blank):'Type it here';
  field.setAttribute('aria-label',s.label);
  field.addEventListener('input',()=>{values[i]=field.value.trim();chips.forEach(c=>c.setAttribute('aria-pressed','false'));refresh()});
  field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(!go.disabled)go.click();else field.blur()}});
  const chips=[];
  if(s.options.length){
   const row=document.createElement('div');row.className='bluey-chips';
   const pick=(chip,value)=>{chips.forEach(c=>c.setAttribute('aria-pressed',String(c===chip)));values[i]=value;field.hidden=true;refresh()};
   for(const o of s.options){const c=document.createElement('button');c.type='button';c.className='bluey-chip';c.textContent=o;c.setAttribute('aria-pressed','false');c.addEventListener('click',()=>pick(c,o));chips.push(c);row.appendChild(c)}
   const other=document.createElement('button');other.type='button';other.className='bluey-chip';other.textContent='Other…';other.setAttribute('aria-pressed','false');
   other.addEventListener('click',()=>{chips.forEach(c=>c.setAttribute('aria-pressed',String(c===other)));field.hidden=false;values[i]=field.value.trim();refresh();field.focus()});
   chips.push(other);row.appendChild(other);box.appendChild(row);
   field.hidden=true;
  }
  box.appendChild(field);card.appendChild(box);
 });

 go.addEventListener('click',()=>{
  if(go.disabled)return;
  let filled=better;slots.forEach((s,i)=>{filled=filled.split(s.blank).join(values[i])});
  card.replaceChildren(Object.assign(document.createElement('p'),{className:'bluey-tip-sent',textContent:'✓ Sent'}));
  card.closest('.bluey-tip')?.querySelector('.bluey-bulb')?.remove();
  if(typeof blueyUnlockPhoneAudio==='function')blueyUnlockPhoneAudio();
  send(filled);
 });
 card.appendChild(go);
 refresh();
 return card;
}

function closeCards(){document.querySelectorAll('.bluey-tip .bluey-tip-card').forEach(c=>{c.hidden=true;c.parentElement?.querySelector('.bluey-bulb')?.setAttribute('aria-expanded','false')})}
document.addEventListener('click',e=>{if(!e.target.closest('.bluey-tip'))closeCards()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCards()});

function addBulb(userNode,card){
 const wrap=document.createElement('div');wrap.className='bluey-tip';
 const bulb=document.createElement('button');bulb.type='button';bulb.className='bluey-bulb';bulb.textContent='💡';
 bulb.setAttribute('aria-label','See a stronger way to ask this');bulb.setAttribute('aria-expanded','false');bulb.title='A stronger way to ask';
 card.hidden=true;
 bulb.addEventListener('click',()=>{const open=card.hidden;closeCards();if(open){card.hidden=false;bulb.setAttribute('aria-expanded','true');card.scrollIntoView({block:'nearest',behavior:'smooth'})}});
 wrap.append(bulb,card);
 userNode.after(wrap);
}

const blueyAddBeforeTips=add;
add=function(role,text){
 blueyAddBeforeTips(role,text);
 if(role!=='assistant')return;
 const chat=lastChat;lastChat=null;
 const brain=chat?.brain||{};
 const better=typeof brain.betterPrompt==='string'?brain.betterPrompt.trim():'';
 if(!better||chat.reply!==text)return;
 const users=[...messages.querySelectorAll('.msg.user')];
 const userNode=users[users.length-1];
 const original=userNode?.textContent||'';
 if(norm(original)===norm(better))return;
 const slots=(Array.isArray(brain.tipSlots)?brain.tipSlots:[]).filter(s=>s&&typeof s.blank==='string'&&better.includes(s.blank)).map(s=>({blank:s.blank,label:String(s.label||'Your answer'),options:Array.isArray(s.options)?s.options.filter(o=>typeof o==='string'&&o.trim()):[]}));
 const why=typeof brain.betterPromptWhy==='string'?brain.betterPromptWhy.trim():'';
 const asking=!brain.isDraft&&slots.length>0&&(brain.needsQuestion||brain.mode==='DISCOVER');
 if(asking){
  // Bluey is asking for details: answer right here, under his question.
  const wrap=document.createElement('div');wrap.className='bluey-tip bluey-tip-inline';
  wrap.appendChild(buildCard(better,why,slots,original,true));
  messages.lastElementChild.after(wrap);
  wrap.scrollIntoView({block:'nearest',behavior:'smooth'});
  return;
 }
 if(!userNode||userNode.nextElementSibling?.classList.contains('bluey-tip'))return;
 addBulb(userNode,buildCard(better,why,slots,original,false));
};
})();
