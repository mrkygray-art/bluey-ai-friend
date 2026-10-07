// Hand-off kit: when a job belongs on another AI platform (build an app or dashboard, make an
// image or video, run something on a schedule, study your own documents...), api/chat.js
// returns `handoff`: the best platform and feature, why, a second option, and a complete
// "super prompt" written as the person. This card shows it under Bluey's reply with
// Copy prompt, Open in <platform> (copies, then opens; ChatGPT and Claude get it pre-filled
// when it's short enough), and Download PDF (exact text, rendered by api/document.js).
(function(){
'use strict';
let lastChat=null;
const blueyFetchBeforeHandoff=window.fetch;
window.fetch=async function(resource,options){
 const response=await blueyFetchBeforeHandoff.apply(this,arguments);
 const url=typeof resource==='string'?resource:resource?.url||'';
 if(/\/api\/chat(\?|$)/.test(url)&&response.ok){try{lastChat=await response.clone().json()}catch(_){lastChat=null}}
 return response;
};

const SITES={
 Claude:p=>p.length<1800?'https://claude.ai/new?q='+encodeURIComponent(p):'https://claude.ai/new',
 ChatGPT:p=>p.length<1800?'https://chatgpt.com/?q='+encodeURIComponent(p):'https://chatgpt.com/',
 Gemini:()=>'https://gemini.google.com/app',
 NotebookLM:()=>'https://notebooklm.google.com/'
};
const FEATURE_SITES={'Claude Code':'https://claude.ai/code','Codex':'https://chatgpt.com/codex'};
const HELP_HOMES={Claude:'https://support.claude.com',ChatGPT:'https://help.openai.com',Gemini:'https://support.google.com/gemini',NotebookLM:'https://support.google.com/notebooklm'};
const site=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(_){return ''}};
const label=(p,f)=>f&&f!=='Chat'?`${p} · ${f}`:p;

async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch(_){return false}}
function say(msg){if(typeof tempStatus==='function')tempStatus(msg,4500)}

function steps(h){
 if(Array.isArray(h.steps)&&h.steps.length)return h.steps;
 const where=h.feature&&h.feature!=='Chat'?`${h.platform} and choose ${h.feature}`:h.platform;
 return [`Open ${where}.`,'Paste the prompt below (it’s already copied if you used Copy prompt or Open).','Fill in any [blanks] with your own details.','Read the result, then ask for changes in plain words, like “make it simpler” or “add a monthly total.”'];
}

async function downloadPdf(h,help,button){
 button.disabled=true;const was=button.textContent;button.textContent='Making PDF…';
 try{
  const paragraphs=[`Best place for this: ${label(h.platform,h.feature)}. ${h.why}`];
  if(h.alsoPlatform)paragraphs.push(`Also good: ${label(h.alsoPlatform,h.alsoFeature)}${h.alsoWhy?'. '+h.alsoWhy:''}`);
  paragraphs.push('How to set it up:',...steps(h).map((s,i)=>`${i+1}. ${s}`),'Official help:',...help.map(x=>`${x.title}: ${x.url}`),'Your prompt:',h.prompt,'Made with Bluey. Product features and menus change often; check the platform’s own help pages if a step looks different.');
  const r=await fetch('/api/document',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({format:'pdf',filename:h.title,content:{title:h.title,paragraphs,bullets:[]}})});
  if(!r.ok){let d={};try{d=await r.json()}catch(_){}throw new Error(d.error||'Bluey couldn’t make the PDF.')}
  const blob=await r.blob(),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=(h.title||'bluey-prompt').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()+'.pdf';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);
  say('PDF downloaded.');
 }catch(e){say(e.message||'Bluey couldn’t make the PDF.')}
 finally{button.disabled=false;button.textContent=was}
}

function buildCard(h,sources){
 const help=(Array.isArray(sources)&&sources.length?sources:[{title:h.platform+' Help Center',url:HELP_HOMES[h.platform]||HELP_HOMES.ChatGPT}]).slice(0,4);
 const card=document.createElement('div');card.className='bluey-handoff';card.setAttribute('role','group');card.setAttribute('aria-label','Where to do this, and your prompt');
 const head=document.createElement('p');head.className='bluey-handoff-head';head.textContent='🚀 Best place for this: '+label(h.platform,h.feature);
 card.appendChild(head);
 if(h.why){const w=document.createElement('p');w.className='bluey-handoff-why';w.textContent=h.why;card.appendChild(w)}
 if(h.alsoPlatform){const a=document.createElement('p');a.className='bluey-handoff-also';a.textContent='Also good: '+label(h.alsoPlatform,h.alsoFeature)+(h.alsoWhy?' — '+h.alsoWhy:'');card.appendChild(a)}
 const sh=document.createElement('p');sh.className='bluey-handoff-title';sh.textContent='🧭 How to set it up';card.appendChild(sh);
 const ol=document.createElement('ol');ol.className='bluey-handoff-steps';for(const st of steps(h)){const li=document.createElement('li');li.textContent=st;ol.appendChild(li)}card.appendChild(ol);
 const hl=document.createElement('p');hl.className='bluey-handoff-help';hl.append('Official help: ');help.forEach((x,i)=>{if(i)hl.append(' · ');const a=document.createElement('a');a.href=x.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=x.title||site(x.url);a.title=site(x.url);hl.appendChild(a)});card.appendChild(hl);
 const t=document.createElement('p');t.className='bluey-handoff-title';t.textContent='📋 '+(h.title||'Your prompt');card.appendChild(t);
 const box=document.createElement('div');box.className='bluey-handoff-prompt';box.tabIndex=0;box.setAttribute('aria-label','Your prompt');box.textContent=h.prompt;card.appendChild(box);
 const row=document.createElement('div');row.className='bluey-handoff-actions';
 const btn=(text,fn,primary)=>{const b=document.createElement('button');b.type='button';b.textContent=text;if(primary)b.className='primary';b.addEventListener('click',()=>fn(b));row.appendChild(b);return b};
 btn('Copy prompt',async()=>say(await copy(h.prompt)?'Prompt copied. Paste it into '+h.platform+'.':'Copy didn’t work here. Press and hold the prompt to select it.'),true);
 btn('Open '+h.platform,async()=>{
  const copied=await copy(h.prompt);
  const url=FEATURE_SITES[h.feature]||(SITES[h.platform]||SITES.ChatGPT)(h.prompt);
  window.open(url,'_blank','noopener');
  say(copied?'Prompt copied. Paste it into '+h.platform+' if it isn’t there already.':'Opened '+h.platform+'. Copy the prompt from Bluey to paste it.');
 });
 btn('Download PDF',b=>downloadPdf(h,help,b));
 card.appendChild(row);
 return card;
}

const blueyAddBeforeHandoff=add;
add=function(role,text){
 blueyAddBeforeHandoff(role,text);
 if(role!=='assistant')return;
 const chat=lastChat;lastChat=null;
 const h=chat?.handoff;
 if(!h||typeof h.prompt!=='string'||!h.prompt.trim()||chat.reply!==text)return;
 let anchor=null;
 for(let el=messages.lastElementChild;el;el=el.previousElementSibling){if(el.classList.contains('msg'))break;if(el.classList.contains('bluey-reply-actions')){anchor=el;break}}
 (anchor||messages.lastElementChild).after(buildCard(h,chat.sources));
};
})();
