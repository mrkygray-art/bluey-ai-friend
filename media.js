// Making pictures: when api/chat.js returns `media` ({action:"image", prompt, why, shape, request}),
// this shows a "making your picture" card under Bluey's reply, asks api/media/image/generate to
// make it (with the person's sign-in token), then shows the picture with why the prompt works,
// "Show the prompt Bluey wrote", Copy prompt, and Download. Every /api/chat body gets
// media.ok = signed in, so the brain knows whether it can make pictures for this person.
// Loaded after friends.js, before offers.js, so the card sits above any offer buttons.
(function(){
'use strict';
let lastChat=null;
const previousFetch=window.fetch;
const signedIn=()=>!!(window.blueyAccount?.user&&window.blueyAccount?.token);
window.fetch=async function(resource,init){
 const url=typeof resource==='string'?resource:resource?.url||'';
 const isChat=/\/api\/chat(\?|$)/.test(url);
 if(isChat&&typeof init?.body==='string'){try{const body=JSON.parse(init.body);body.media={ok:signedIn()};init={...init,body:JSON.stringify(body)}}catch(_){}}
 const response=await previousFetch.call(this,resource,init);
 if(isChat&&response.ok){try{lastChat=await response.clone().json()}catch(_){lastChat=null}}
 return response;
};

const SHAPES={square:'1 / 1',wide:'3 / 2',tall:'2 / 3'};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
// Only links to Bluey's own private storage are shown.
const safeLink=u=>/^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/sign\/creations\//i.test(String(u||''))?String(u):'';

function place(box){
 let anchor=null;
 for(let n=messages.lastElementChild;n;n=n.previousElementSibling){if(n.classList.contains('msg'))break;if(/bluey-(sources|reply-actions|pictures|friend)/.test(n.className)){anchor=n;break}}
 (anchor||messages.lastElementChild).after(box);
 messages.scrollTop=messages.scrollHeight;
}

function waiting(box,media){
 box.replaceChildren();
 const frame=el('div','bluey-creation-frame is-making');frame.style.aspectRatio=SHAPES[media.shape]||SHAPES.square;
 frame.append(el('span','bluey-creation-dot'));
 box.append(frame,el('p','bluey-creation-note','Making your picture… this can take up to a minute.'));
}

function failed(box,media,text,canRetry){
 box.replaceChildren();
 const p=el('p','bluey-creation-error',text||'Something went wrong while I was making that. Please try again in a moment.');
 box.append(p);
 if(canRetry){const again=el('button','bluey-creation-btn','Try again');again.type='button';again.onclick=()=>make(box,media);box.append(again)}
}

function show(box,c,media){
 box.replaceChildren();
 const link=safeLink(c.url);
 if(!link)return failed(box,media,'Your picture is ready, but I couldn’t load it just now. Find it again in a moment.',false);
 const frame=el('div','bluey-creation-frame');frame.style.aspectRatio=SHAPES[media.shape]||SHAPES.square;
 const img=el('img');img.src=link;img.alt='Picture Bluey made: '+(c.prompt||media.request||'').slice(0,140);img.decoding='async';
 img.addEventListener('error',()=>{frame.classList.add('is-broken');frame.replaceChildren(el('p','bluey-creation-note','This picture’s link has expired. Ask me to show it again.'))},{once:true});
 frame.append(img);box.append(frame);
 if(c.why)box.append(el('p','bluey-creation-why','💡 '+c.why));
 const details=el('details','bluey-creation-prompt');
 details.append(el('summary',null,'Show the prompt Bluey wrote'),el('p',null,c.expandedPrompt||media.prompt));
 const actions=el('div','bluey-creation-actions');
 const copy=el('button','bluey-creation-btn','Copy prompt');copy.type='button';
 copy.onclick=async()=>{try{await navigator.clipboard.writeText(c.expandedPrompt||media.prompt);copy.textContent='Copied ✓';setTimeout(()=>copy.textContent='Copy prompt',1800)}catch(_){copy.textContent='Couldn’t copy'}};
 actions.append(copy);
 const dl=safeLink(c.downloadUrl);
 if(dl){const a=el('a','bluey-creation-btn','Download');a.href=dl;a.rel='noopener';a.setAttribute('download','');actions.append(a)}
 const del=el('button','bluey-creation-btn is-quiet','Delete');del.type='button';
 let armed=false;
 del.onclick=async()=>{
  if(!armed){armed=true;del.textContent='Tap again to delete';setTimeout(()=>{if(armed&&del.isConnected){armed=false;del.textContent='Delete'}},4000);return}
  del.disabled=true;
  try{const r=await fetch('/api/media/library?id='+encodeURIComponent(c.id),{method:'DELETE',headers:{Authorization:'Bearer '+(window.blueyAccount?.token||'')}});if(!r.ok&&r.status!==404)throw 0;box.replaceChildren(el('p','bluey-creation-note','🧹 Picture deleted.'))}
  catch(_){del.disabled=false;armed=false;del.textContent='Couldn’t delete. Try again'}
 };
 actions.append(del);
 box.append(details,actions);
 box.dataset.creationId=c.id;
 messages.scrollTop=messages.scrollHeight;
}

async function make(box,media){
 waiting(box,media);
 const token=window.blueyAccount?.token;
 if(!token)return failed(box,media,'I make pictures for people who are signed in. Tap the blue + and choose Sign in, then ask me again.',false);
 try{
  const r=await fetch('/api/media/image/generate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({prompt:media.request,expandedPrompt:media.prompt,why:media.why,shape:media.shape})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok||!data.creation)return failed(box,media,data.error,r.status>=500&&r.status!==501);
  show(box,data.creation,media);
 }catch(_){failed(box,media,'I lost the connection while making that. Please try again.',true)}
}

const previousAdd=add;
add=function(role,text){
 previousAdd(role,text);
 if(role!=='assistant')return;
 const chat=lastChat;lastChat=null;
 const media=chat?.media;
 if(!media||media.action!=='image'||chat.reply!==text)return;
 const box=el('div','bluey-creation');
 place(box);
 make(box,media);
};
})();
