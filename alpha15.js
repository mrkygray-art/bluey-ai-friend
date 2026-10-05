// Alpha 15: conversational prompt workshop with editable drafts and try/refine loop.
let blueyWorkshopActive=false;
let blueyWorkshopMessages=[];
let blueyWorkshopTurn=0;
let blueyWorkshopQuestionsAsked=0;
let blueyWorkshopLastOutput='';
let blueyWorkshopDrafts=null;
let blueyWorkshopBanner=null;
const blueyWorkshopOriginalPlaceholder=input.placeholder;

function blueyWorkshopEnsureBanner(){
 if(blueyWorkshopBanner?.isConnected)return;
 blueyWorkshopBanner=document.createElement('div');
 blueyWorkshopBanner.className='bluey-workshop-banner';
 const label=document.createElement('span');label.textContent='Prompt Workshop · finding a helpful approach';
 const exit=document.createElement('button');exit.type='button';exit.textContent='Finish';exit.setAttribute('aria-label','Finish prompt workshop');
 exit.addEventListener('click',()=>blueyWorkshopFinish());
 blueyWorkshopBanner.append(label,exit);messages.prepend(blueyWorkshopBanner);
}

function blueyWorkshopStart(initialText=''){
 blueyWorkshopActive=true;blueyWorkshopTurn=0;blueyWorkshopQuestionsAsked=0;blueyWorkshopMessages=[];blueyWorkshopLastOutput='';blueyWorkshopDrafts=null;
 input.placeholder='Tell Bluey what you want to accomplish…';
 touchActivity();working();blueyWorkshopEnsureBanner();
 const opening=initialText
  ?'I can suggest a practical way to approach that, then ask a few details so the prompt fits what you need.'
  :'What would you like me to help you accomplish? I’ll suggest an approach, then ask a few details to shape the prompt with you.';
 add('assistant',opening);blueyWorkshopMessages.push({role:'assistant',content:opening});history.push({role:'assistant',content:opening});input.focus();
 if(initialText)blueyWorkshopSend(initialText);
}

function blueyWorkshopFinish(){
 blueyWorkshopActive=false;blueyWorkshopBanner?.remove();blueyWorkshopBanner=null;
 input.placeholder=blueyWorkshopOriginalPlaceholder;
 tempStatus('Prompt Workshop saved in this conversation. You can keep chatting with Bluey.',3500);input.focus();
}

function blueyWorkshopRenderCard(data){
 blueyWorkshopDrafts={quick:data.quickPrompt||'',balanced:data.prompt||'',detailed:data.detailedPrompt||''};
 const card=document.createElement('section');card.className='bluey-prompt-card';card.setAttribute('aria-label','Editable prompt draft');
 const heading=document.createElement('div');heading.className='bluey-prompt-heading';
 const title=document.createElement('strong');title.textContent='Your prompt, ready to shape';
 const sub=document.createElement('span');sub.textContent='Edit anything here before you copy or try it.';heading.append(title,sub);card.appendChild(heading);
 const tabs=document.createElement('div');tabs.className='bluey-prompt-tabs';
 const area=document.createElement('textarea');area.className='bluey-prompt-text';area.setAttribute('aria-label','Edit your prompt');area.value=blueyWorkshopDrafts.balanced;area.rows=9;
 let selected='balanced';
 const pick=(key,button)=>{blueyWorkshopDrafts[selected]=area.value;selected=key;for(const b of tabs.querySelectorAll('button'))b.setAttribute('aria-pressed','false');button.setAttribute('aria-pressed','true');area.value=blueyWorkshopDrafts[key];area.focus()};
 [['quick','Quick'],['balanced','Balanced'],['detailed','Detailed']].forEach(([key,label],index)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-pressed',String(index===1));button.addEventListener('click',()=>pick(key,button));tabs.appendChild(button)});
 area.addEventListener('input',()=>{blueyWorkshopDrafts[selected]=area.value});card.append(tabs,area);
 if(data.microTip){const tip=document.createElement('p');tip.className='bluey-prompt-tip';tip.textContent=data.microTip;card.appendChild(tip)}
 const actions=document.createElement('div');actions.className='bluey-prompt-actions';
 const copy=document.createElement('button');copy.type='button';copy.textContent='Copy prompt';copy.addEventListener('click',async()=>{
  const value=area.value.trim();if(!value)return;
  try{await navigator.clipboard.writeText(value);tempStatus('Copied. Your prompt is ready to paste.',2800)}
  catch{area.focus();area.select();try{document.execCommand('copy');tempStatus('Copied. Your prompt is ready to paste.',2800)}catch{tempStatus('Select the prompt text and copy it from your device.',3500)}}
 });
 const run=document.createElement('button');run.type='button';run.className='primary';run.textContent='Try this prompt';run.addEventListener('click',()=>blueyWorkshopRun(area.value));
 actions.append(copy,run);card.appendChild(actions);messages.appendChild(card);messages.scrollTop=messages.scrollHeight;
}

async function blueyWorkshopSend(text){
 const clean=String(text||'').trim();if(!clean)return;
 touchActivity();add('user',clean);blueyWorkshopMessages.push({role:'user',content:clean});history.push({role:'user',content:clean});input.value='';blueyWorkshopTurn++;
 behavior('thinking');blueyPlaySound('think');statusEl.textContent='Thinking this through…';
 try{
  const r=await fetch('/api/prompt-workshop',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:blueyWorkshopMessages,turnCount:blueyWorkshopTurn,questionsAsked:blueyWorkshopQuestionsAsked,currentPrompt:blueyWorkshopDrafts?.balanced||'',lastOutput:blueyWorkshopLastOutput})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'Bluey could not finish shaping the prompt.');
  statusEl.textContent='';
  const questions=d.phase==='ready'?[]:(Array.isArray(d.questions)?d.questions.slice(0,Math.max(0,3-blueyWorkshopQuestionsAsked)):[]);
  blueyWorkshopQuestionsAsked+=questions.length;
  const responseText=[d.reply,...questions.map((q,i)=>`${blueyWorkshopQuestionsAsked-questions.length+i+1}. ${q}`)].filter(Boolean).join('\n\n');
  add('assistant',responseText);blueyWorkshopMessages.push({role:'assistant',content:responseText});history.push({role:'assistant',content:responseText});behavior(d.phase==='ready'?'happy':'curious');blueyPlaySound(d.phase==='ready'?'happy':'reply');
  if(d.phase==='ready'&&d.prompt){input.placeholder='Tell Bluey what you want to change…';blueyWorkshopRenderCard(d)}
 }catch(e){console.error('Bluey prompt workshop error',e);statusEl.textContent=e.message||'I hit a snag shaping that prompt. Try again in a moment.';behavior('unsure')}
}

async function blueyWorkshopRun(prompt){
 const clean=String(prompt||'').trim();if(!clean){tempStatus('Add a little detail to the prompt first.',2500);return}
 if(blueyWorkshopDrafts)blueyWorkshopDrafts.balanced=clean;
 blueyWorkshopMessages.push({role:'user',content:'We tried the current draft prompt.'});input.value='';
 try{
  const before=history.length;await blueySendBeforeAlpha14(clean);
  const result=history.slice(before).filter(m=>m.role==='assistant').at(-1);
  blueyWorkshopLastOutput=result?.content||'';
  if(!blueyWorkshopLastOutput)throw new Error('Bluey did not return a result for that try.');
  tempStatus('Want to tune the prompt? Tell me what to change, or edit the draft above.',4500);
 }catch(e){console.error('Bluey prompt run error',e);statusEl.textContent=e.message||'I could not try that prompt just now.';behavior('unsure')}
}

document.querySelector('#bluey-prompt-start').addEventListener('click',()=>blueyWorkshopStart());

const blueySendBeforeAlpha14=send;
send=function(text){
 const clean=String(text||'').trim();if(!clean)return;
 if(blueyWorkshopActive)return blueyWorkshopSend(clean);
 if(/\b(?:prompt workshop|(?:help me|can you help me|could you help me) (?:write|build|make|create|improve|refine) (?:a |this |my )?prompt|(?:write|build|create|make|draft|improve|refine) (?:a |this |my )?prompt|(?:need|want) (?:a )?prompt|best use of ai|best results from ai|use ai for me|teach me how to (?:use|prompt)|get better results from ai|better answers from ai|prompt engineering)\b/i.test(clean)||(/\b(?:prompt|prompting)\b/i.test(clean)&&/\b(?:write|build|create|make|draft|improve|refine|need|want)\b/i.test(clean)&&/\b(?:for|about|to|this|my)\b/i.test(clean))){
  blueyWorkshopStart(clean);return;
 }
 return blueySendBeforeAlpha14(clean);
};
