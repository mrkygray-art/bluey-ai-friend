// Bluey Alpha 47.5 — Quiet Stage enforcement
// Home is always white + Bluey. Objects are temporary and only appear after an explicit conversational request.
(function(){
'use strict';
const HOME='home';
let revealTimer=null,homeGuard=null,stageObserver=null,dedupeQueued=false,objectsVisibleUntil=0,revealedNodes=[];
const stage=()=>window.blueyStage37||document.querySelector('.stage');
const orb=()=>document.querySelector('#orb');
const room=()=>window.BlueyWorldStandard?.current?.()||window.BlueyWorldState?.room||document.body.dataset.blueyWorld||window.blueyWorld||HOME;
function objectNodes(){const S=stage();return S?[...S.querySelectorAll('.bluey-interactive-object,.bluey-trip-object,.bluey-object,.bluey-memory-artifact')]:[]}
function deduplicateObjects(){const seen=new Set();objectNodes().forEach(n=>{const key=n.title||n.getAttribute('aria-label')||n.dataset?.objectId||n.dataset?.id||n.getAttribute('data-bluey-object-id')||n.id;if(key&&seen.has(key)){n.remove();return}if(key)seen.add(key)});if(Array.isArray(window.blueyVisibleObjects))window.blueyVisibleObjects=window.blueyVisibleObjects.filter(n=>n?.isConnected)}
function restoreRevealedObjects(){if(room()!==HOME||Date.now()>=objectsVisibleUntil)return;const S=stage();if(!S)return;revealedNodes.forEach(n=>{if(n&&!n.isConnected)S.appendChild(n)})}
function watchStageObjects(){const S=stage();if(!S||stageObserver)return;stageObserver=new MutationObserver(()=>{if(dedupeQueued)return;dedupeQueued=true;requestAnimationFrame(()=>{dedupeQueued=false;deduplicateObjects();restoreRevealedObjects()})});stageObserver.observe(S,{childList:true,subtree:true})}
function clearObjects(){clearTimeout(revealTimer);objectsVisibleUntil=0;revealedNodes=[];stage()?.classList.remove('bluey-home-props-visible');document.body.classList.remove('bluey-home-props-visible');objectNodes().forEach(n=>n.remove());if(Array.isArray(window.blueyVisibleObjects))window.blueyVisibleObjects=window.blueyVisibleObjects.filter(n=>n?.isConnected)}
function clearScenery(){const S=stage();if(!S)return;S.querySelectorAll('.bluey-scenery-43,.roomLabel43,.stars43').forEach(n=>n.remove())}
function quietHome(){const S=stage();if(!S)return;document.body.dataset.blueyWorld=HOME;S.dataset.blueyWorld=HOME;S.style.setProperty('background','#fff','important');clearScenery();if(Date.now()>=objectsVisibleUntil)clearObjects();else{restoreRevealedObjects();deduplicateObjects()}}
function revealObjects(which=room(),ttl=42000){clearObjects();objectsVisibleUntil=ttl>0?Date.now()+ttl:Number.POSITIVE_INFINITY;const S=stage();if(which===HOME){S?.classList.add('bluey-home-props-visible');document.body.classList.add('bluey-home-props-visible')}window.renderInteractiveObjects?.(which);if(Array.isArray(window.blueyVisibleObjects)&&S)window.blueyVisibleObjects.forEach(n=>{if(n&&!n.isConnected)S.appendChild(n)});window.BlueyWorldStandard?.layoutObjects?.(which);deduplicateObjects();revealedNodes=objectNodes();if(ttl>0)revealTimer=setTimeout(clearObjects,ttl);return objectNodes().length}
function asksToSeeObjects(text){const q=String(text||'').toLowerCase();return /\b(what(?:'s| is) (?:in|inside)|what do you have|show me (?:what|your|the)|what(?:'s| is) here|look around|explore|objects?|things? (?:are|do you have)|what is in your|show (?:me )?(?:around|your room|your home|the room))\b/.test(q)}
function asksHome(text){const q=String(text||'').toLowerCase();return /\b(go|take me|come|return|back|visit|show me)\b.*\b(home|house)\b|\b(go|come|head) home\b/.test(q)}
function revealAfterReply(text){const M=document.querySelector('#messages');if(!M){setTimeout(()=>revealObjects(room()),1500);return}const start=M.children.length;let done=false;const finish=()=>{if(done)return;done=true;observer.disconnect();clearTimeout(fallback);setTimeout(()=>revealObjects(room()),250)};const observer=new MutationObserver(()=>{if([...M.children].slice(start).some(n=>n.matches?.('.msg.assistant')))finish()});observer.observe(M,{childList:true,subtree:true});const fallback=setTimeout(()=>{if(done)return;done=true;observer.disconnect();revealObjects(room())},6500)}
function captureObjectReveal(e){const text=document.querySelector('#input')?.value?.trim();if(!asksToSeeObjects(text))return;if(e.type==='keydown'&&(e.key!=='Enter'||e.shiftKey))return;if(e.type==='click'){const button=e.target.closest?.('button');if(!button||!button.closest('form')||!/\bsend\b/i.test(button.textContent||''))return}revealAfterReply(text)}
document.addEventListener('click',captureObjectReveal,true);document.addEventListener('keydown',captureObjectReveal,true)
function topicMovedOn(text){const q=String(text||'').toLowerCase();if(!q||asksToSeeObjects(q))return false;return /\b(help me|write|email|question|explain|plan|solve|troubleshoot|picture|photo|new topic|something else|resume|code|calculate|research)\b/.test(q)}
function forceHome(){try{window.enterWorld?.(HOME,false)}catch(_){};setTimeout(quietHome,20);setTimeout(quietHome,100);setTimeout(quietHome,350)}
const previousSend=window.send;
window.send=async function(t){const text=String(t||'').trim();if(text&&asksHome(text)&&!asksToSeeObjects(text)){clearObjects();forceHome()}else if(text&&topicMovedOn(text)){clearObjects()}return previousSend.apply(this,arguments)};
window.addEventListener('bluey:world',e=>{const r=e.detail?.room||room();if(r!==HOME||Date.now()>=objectsVisibleUntil)clearObjects();if(r===HOME){setTimeout(quietHome,20);setTimeout(quietHome,160)}});
window.addEventListener('bluey:alpha47-ready',()=>{if(room()===HOME)quietHome()});

function enforceHome(){if(room()!==HOME)return;const S=stage();if(!S)return;S.style.setProperty('background','#fff','important');clearScenery();if(Date.now()>=objectsVisibleUntil)clearObjects();else deduplicateObjects()}
function startHomeGuard(){clearInterval(homeGuard);watchStageObjects();homeGuard=setInterval(()=>{enforceHome();deduplicateObjects()},500)}

let tapBusy=false;
async function tapToTalk(e){if(e){e.preventDefault();e.stopPropagation()}if(tapBusy)return;tapBusy=true;const O=orb();try{if(typeof window.listen!=='function')throw new Error('listen-unavailable');O?.classList.add('bluey-listening');await window.listen()}catch(err){console.warn('[Bluey] tap-to-talk failed',err);O?.classList.remove('bluey-listening');if(typeof window.tempStatus==='function')window.tempStatus('I can’t start the microphone here yet. Check this site’s microphone permission, then tap me again.',8500)}finally{setTimeout(()=>{tapBusy=false},220)}}
function bindTapToTalk(){const O=orb();if(!O)return false;O.setAttribute('role','button');O.setAttribute('tabindex','0');O.setAttribute('aria-label','Talk to Bluey');O.style.touchAction='manipulation';O.onclick=tapToTalk;O.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')tapToTalk(e)};return true}
const css=document.createElement('style');css.textContent=`body.bluey-world43-home .stage,.stage[data-bluey-world="home"]{background:#fff!important}.bluey-explore-room{display:none!important}#orb{touch-action:manipulation;-webkit-tap-highlight-color:transparent}`;document.head.appendChild(css);
setTimeout(()=>{if(room()===HOME)quietHome();bindTapToTalk();startHomeGuard()},450);
setTimeout(()=>{bindTapToTalk();enforceHome()},1500);
window.BlueyQuietStage={version:'1.4',clearObjects,revealObjects,quietHome,forceHome,asksToSeeObjects,bindTapToTalk};
console.info('[Bluey] Alpha 47.5 blank Home enforcement ready');
})();