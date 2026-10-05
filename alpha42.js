// Bluey Alpha 42 — Object Continuity V1
// Objects remain part of Bluey's world even after their stage UI has been tucked away.
(function(){
'use strict';
if(window.BlueyCharacter)window.BlueyCharacter.version='1.0-alpha42';
if(window.blueyAbout)window.blueyAbout.version='1.0-alpha42';

let recentObject=null;
let recentObjectAt=0;
const aliases={
 'home-mat':['welcome mat','doormat','door mat','mat'],
 'home-lamp':['idea lamp','lamp','light'],
 'home-marbles':['marble jar','marbles','marble'],
 'quiet-leaf':['leaf','quiet leaf'],
 'quiet-hourglass':['hourglass','sand timer','timer'],
 'edge-light':['edge light','little light'],
 'edge-marker':['edge marker','marker']
};

function allObjects(){
 const roomObjects=Object.values(window.BLUEY_OBJECTS||{}).flat();
 const travel=(typeof BLUEY_TRAVEL_OBJECTS_40!=='undefined'?Object.values(BLUEY_TRAVEL_OBJECTS_40).flat():[]);
 return [...roomObjects,...travel];
}
function findObject(id){return allObjects().find(o=>o&&o.id===id)||null}
function resolveObject(text){
 const q=String(text||'').toLowerCase();
 for(const [id,names] of Object.entries(aliases))if(names.some(n=>q.includes(n)))return findObject(id)||{id,title:names[0]};
 const direct=allObjects().find(o=>[o.title,...(o.names||[])].filter(Boolean).some(n=>q.includes(String(n).toLowerCase())));
 if(direct)return direct;
 if(/\b(it|that|this|thing|object|favorite)\b/i.test(q)&&recentObject&&Date.now()-recentObjectAt<30*60*1000)return recentObject;
 const favorite=window.BlueyRelationshipMemory?.favoriteObject?.();
 if(/\b(favorite|favourite)\b/i.test(q)&&favorite)return findObject(favorite.key)||{id:favorite.key,title:favorite.name};
 return null;
}
function rememberRecent(obj){if(!obj)return;recentObject=obj;recentObjectAt=Date.now();try{sessionStorage.setItem('bluey.recentObject.v1',JSON.stringify({id:obj.id,at:recentObjectAt}))}catch(_){}}
try{const saved=JSON.parse(sessionStorage.getItem('bluey.recentObject.v1')||'null');if(saved&&saved.id){recentObject=findObject(saved.id)||{id:saved.id,title:saved.id};recentObjectAt=saved.at||Date.now()}}catch(_){}

function displayName(obj){return obj?.title||aliases[obj?.id]?.[0]||'that object'}
function tuckedReply(obj){
 const name=displayName(obj);
 const memory=window.BlueyRelationshipMemory?.summary?.();
 const achieved=(memory?.achievements||[]).some(a=>/welcome mat/i.test(a))&&obj.id==='home-mat';
 if(achieved)return `Oh, the welcome mat? I tucked it away so it wouldn’t sit on top of our conversation. Don’t worry — my Welcome Mat Enthusiast hasn’t lost it. 😄`;
 const options=[
  `Oh, ${name}? I tucked it away so the stage wouldn’t get in the way of our conversation. It’s still here.`,
  `${name} is still part of the room. I just cleared the stage after we finished poking at it.`,
  `I didn’t lose ${name}. 😄 I tucked it away to give our conversation some room.`
 ];
 return options[Math.floor(Math.random()*options.length)];
}
function restoreObject(obj){
 const roomMap={'home-mat':'home','home-lamp':'home','home-marbles':'home','quiet-leaf':'quiet','quiet-hourglass':'quiet','edge-light':'edge','edge-marker':'edge'};
 const room=roomMap[obj.id];
 if(room&&typeof enterWorld==='function'){
   if(window.blueyWorld!==room)enterWorld(room,false);
   if(typeof renderInteractiveObjects==='function')renderInteractiveObjects(room);
   if(window.BlueyMobileStage?.explore)window.BlueyMobileStage.explore();
   return true;
 }
 return false;
}
function isWhere(q){return /\b(where|what happened|what'd happen|where'd|where did)\b/i.test(q)&&/\b(go|gone|happen|is|are|did)\b/i.test(q)}
function isRestore(q){return /\b(bring|show|put|restore|get)\b/i.test(q)&&/\b(back|again|stage|here|it|that|mat|lamp|marble|leaf|hourglass|marker|light)\b/i.test(q)}
function say(answer){add('assistant',answer);history.push({role:'assistant',content:answer});behavior('curious');if(typeof blueyVoiceOn==='undefined'||blueyVoiceOn)speak(answer,'curious')}

// Observe object inspections from Alpha 40 without replacing its personality logic.
const inspectBefore42=window.inspectBlueyObject;
if(typeof inspectBefore42==='function')window.inspectBlueyObject=function(obj,el){rememberRecent(obj);return inspectBefore42(obj,el)};

const sendBefore42=window.send;
window.send=async function(text){
 const q=String(text||'').trim();
 const obj=resolveObject(q);
 if(obj&&(isWhere(q)||isRestore(q))){
   add('user',q);history.push({role:'user',content:q});if(window.input)input.value='';rememberRecent(obj);
   if(isRestore(q)){
     const restored=restoreObject(obj);
     const answer=restored?`There you go — ${displayName(obj)} is back. I had a feeling you weren’t finished with it. 😄`:`I remember ${displayName(obj)}. It isn’t on this stage right now, but it’s still part of my world.`;
     setTimeout(()=>say(answer),180);return;
   }
   setTimeout(()=>say(tuckedReply(obj)),180);return;
 }
 return sendBefore42(q);
};

window.BlueyObjectContinuity={version:'1.0',recent:()=>recentObject,resolve:resolveObject,restore:id=>{const obj=findObject(id)||{id,title:id};rememberRecent(obj);return restoreObject(obj)}};
console.info('[Bluey] Alpha 42 Object Continuity ready');
})();