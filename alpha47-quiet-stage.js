// Bluey Alpha 47.1 — Quiet Stage
// Default Bluey is simple: white space + Bluey. Worlds and objects are discoveries, not permanent UI.
(function(){
'use strict';
const HOME='home';
let revealTimer=null;
const stage=()=>window.blueyStage37||document.querySelector('.stage');
const room=()=>window.BlueyWorldStandard?.current?.()||window.BlueyWorldState?.room||document.body.dataset.blueyWorld||window.blueyWorld||HOME;
function objectNodes(){const S=stage();return S?[...S.querySelectorAll('.bluey-interactive-object,.bluey-trip-object,.bluey-object,.bluey-memory-artifact')]:[]}
function clearObjects(){clearTimeout(revealTimer);objectNodes().forEach(n=>n.remove());if(Array.isArray(window.blueyVisibleObjects))window.blueyVisibleObjects=window.blueyVisibleObjects.filter(n=>n?.isConnected)}
function quietHome(){const S=stage();if(!S)return;document.body.dataset.blueyWorld=HOME;S.dataset.blueyWorld=HOME;S.style.setProperty('background','#fff','important');S.querySelectorAll('.bluey-scenery-43,.roomLabel43,.stars43').forEach(n=>n.remove());clearObjects()}
function revealObjects(which=room(),ttl=45000){clearObjects();window.renderInteractiveObjects?.(which);const S=stage();if(Array.isArray(window.blueyVisibleObjects)&&S)window.blueyVisibleObjects.forEach(n=>{if(n&&!n.isConnected)S.appendChild(n)});window.BlueyWorldStandard?.layoutObjects?.(which);if(ttl>0)revealTimer=setTimeout(clearObjects,ttl);return objectNodes().length}
function asksToSeeObjects(text){const q=String(text||'').toLowerCase();return /\b(what(?:'s| is) (?:in|inside)|what do you have|show me (?:what|your|the)|what(?:'s| is) here|look around|explore|objects?|things? (?:are|do you have)|what is in your)\b/.test(q)}
function topicMovedOn(text){const q=String(text||'').toLowerCase();if(!q)return false;if(asksToSeeObjects(q))return false;return /\b(help me|write|email|question|explain|plan|solve|troubleshoot|picture|photo|new topic|something else)\b/.test(q)}
const previousSend=window.send;
window.send=async function(t){const text=String(t||'').trim();if(text&&asksToSeeObjects(text)){setTimeout(()=>revealObjects(room()),180)}else if(text&&topicMovedOn(text)){clearObjects()}return previousSend.apply(this,arguments)};
window.addEventListener('bluey:world',e=>{const r=e.detail?.room||room();clearObjects();if(r===HOME)setTimeout(quietHome,30)});
window.addEventListener('bluey:alpha47-ready',()=>{if(room()===HOME)quietHome()});
const css=document.createElement('style');css.textContent=`body.bluey-world43-home .stage,.stage[data-bluey-world="home"]{background:#fff!important}.bluey-explore-room{display:none!important}`;document.head.appendChild(css);
setTimeout(()=>{if(room()===HOME)quietHome()},700);
window.BlueyQuietStage={version:'1.0',clearObjects,revealObjects,quietHome,asksToSeeObjects};
console.info('[Bluey] Alpha 47.1 Quiet Stage ready');
})();