// Bluey Alpha 47.7.2 — Clean Baseline / Quiet Home
(function(){
'use strict';
const HOME='home', HOLIDAY_CONVERSATION_MS=3*60*1000;
let revealTimer=null,homeGuard=null,holidayReturnTimer=null,conversationStarted=false;
const stage=()=>window.blueyStage37||document.querySelector('.stage');
const orb=()=>document.querySelector('#orb');
const room=()=>window.BlueyWorldStandard?.current?.()||window.BlueyWorldState?.room||document.body.dataset.blueyWorld||window.blueyWorld||HOME;
const holidayClasses=()=>[...document.body.classList].filter(c=>c.startsWith('holiday-'));
function allWorldObjects(){return [...document.querySelectorAll('.bluey-interactive-object,.bluey-trip-object,.bluey-object,.bluey-memory-artifact,.bluey-prop,.bluey-keepsake,.bluey-work-token,.bluey-work-chip,.bluey-world-object,.bluey-orbit,.bluey-edge-mark,.bluey-starfield,.bluey-object-hint')];}
function clearObjects(){clearTimeout(revealTimer);allWorldObjects().forEach(n=>n.remove());if(Array.isArray(window.blueyVisibleObjects))window.blueyVisibleObjects=[];}
function clearScenery(){document.querySelectorAll('.bluey-scenery-43,.roomLabel43,.stars43,#bluey-scene-layer').forEach(n=>n.remove())}
function quietHome(opts={}){const S=stage();if(!S)return;document.body.dataset.blueyWorld=HOME;S.dataset.blueyWorld=HOME;S.style.setProperty('background','#fff','important');clearScenery();clearObjects();if(opts.clearHoliday)holidayClasses().forEach(c=>document.body.classList.remove(c))}
function revealObjects(which=room(),ttl=42000){clearObjects();window.renderInteractiveObjects?.(which);const S=stage();if(Array.isArray(window.blueyVisibleObjects)&&S)window.blueyVisibleObjects.forEach(n=>{if(n&&!n.isConnected)S.appendChild(n)});window.BlueyWorldStandard?.layoutObjects?.(which);if(ttl>0)revealTimer=setTimeout(clearObjects,ttl);return allWorldObjects().length}
function asksToSeeObjects(text){const q=String(text||'').toLowerCase();return /\b(what(?:'s| is) (?:in|inside)|what do you have|show me (?:what|your|the)|what(?:'s| is) here|look around|explore|objects?|things? (?:are|do you have)|what is in your|show (?:me )?(?:around|your room|your home|the room))\b/.test(q)}
function asksHome(text){const q=String(text||'').toLowerCase();return /\b(go|take me|come|return|back|visit|show me)\b.*\b(home|house)\b|\b(go|come|head) home\b/.test(q)}
function asksWorldTravel(text){const q=String(text||'').toLowerCase();return /\b(go|take me|visit|show me|let'?s go|head|travel|come)\b.*\b(library|office|workshop|garage|arcade|observatory|archive|quiet place|edge|attic|closet|backyard|basement)\b|\b(show me your world|where can we go|places in your world)\b/.test(q)}
function topicMovedOn(text){const q=String(text||'').toLowerCase();if(!q||asksToSeeObjects(q)||asksWorldTravel(q))return false;return /\b(help me|write|email|question|explain|plan|solve|troubleshoot|picture|photo|new topic|something else|resume|code|calculate|research)\b/.test(q)}
function forceHome(clearHoliday=false){try{window.enterWorld?.(HOME,false)}catch(_){};setTimeout(()=>quietHome({clearHoliday}),20);setTimeout(()=>quietHome({clearHoliday}),100);setTimeout(()=>quietHome({clearHoliday}),350)}
function scheduleHolidayReturn(){if(conversationStarted||!holidayClasses().length)return;conversationStarted=true;clearTimeout(holidayReturnTimer);holidayReturnTimer=setTimeout(()=>{if(room()===HOME)forceHome(true)},HOLIDAY_CONVERSATION_MS)}
const previousSend=window.send;
window.send=async function(t){const text=String(t||'').trim();if(text)scheduleHolidayReturn();if(text&&asksHome(text)){clearObjects();forceHome(true)}else if(text&&asksToSeeObjects(text)){setTimeout(()=>revealObjects(room()),220)}else if(text&&topicMovedOn(text)){clearObjects()}return previousSend.apply(this,arguments)};
window.addEventListener('bluey:world',e=>{const r=e.detail?.room||room();clearObjects();if(r===HOME){setTimeout(()=>quietHome({clearHoliday:conversationStarted}),20);setTimeout(()=>quietHome({clearHoliday:conversationStarted}),160)}});
function removePromptBuilder(){const direct=document.querySelector('#bluey-prompt-start');if(direct)direct.remove();document.querySelectorAll('button,a,[role="button"],input[type="button"]').forEach(el=>{const s=[el.textContent,el.getAttribute?.('aria-label'),el.getAttribute?.('title'),el.id,el.className].filter(Boolean).join(' ').toLowerCase();if(/build\s*(?:a\s*)?prompt|prompt\s*builder|buildprompt|bluey-prompt/.test(s))el.remove()})}
function enforceHome(){if(room()!==HOME)return;const S=stage();if(!S)return;S.style.setProperty('background','#fff','important');clearScenery();clearObjects();if(conversationStarted)holidayClasses().forEach(c=>document.body.classList.remove(c))}
function stopAutonomousWorld(){if(window.blueyAdventure)window.blueyAdventure=()=>{};if(window.orbitVisit)window.orbitVisit=()=>{};if(window.livingWorldPulse)window.livingWorldPulse=()=>{}}
function startHomeGuard(){clearInterval(homeGuard);homeGuard=setInterval(()=>{removePromptBuilder();if(room()===HOME)enforceHome()},350)}
let tapBusy=false;
async function tapToTalk(e){if(e){e.preventDefault();e.stopPropagation()}if(tapBusy)return;tapBusy=true;try{if(typeof window.listen!=='function')throw new Error('listen-unavailable');await window.listen()}catch(err){console.warn('[Bluey] tap-to-talk failed',err);if(typeof window.tempStatus==='function')window.tempStatus('I can’t start the microphone here yet. Check this site’s microphone permission, then tap me again.',8500)}finally{setTimeout(()=>{tapBusy=false},220)}}
function bindTapToTalk(){const O=orb();if(!O)return false;O.setAttribute('role','button');O.setAttribute('tabindex','0');O.setAttribute('aria-label','Talk to Bluey');O.style.touchAction='manipulation';O.onclick=tapToTalk;O.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')tapToTalk(e)};return true}
const css=document.createElement('style');css.textContent=`
body.bluey-world43-home .stage,.stage[data-bluey-world="home"]{background:#fff!important}
#bluey-prompt-start,.bluey-prompt-tool,.bluey-explore-room{display:none!important}
#orb{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.stage{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;box-sizing:border-box!important;padding-top:clamp(16px,3vh,36px)!important;overflow:visible!important;min-height:430px!important;height:auto!important}
.stage .bluey-depth-room{position:relative!important;inset:auto!important;width:100%!important;height:clamp(190px,25vh,230px)!important;min-height:190px!important;flex:0 0 auto!important;overflow:visible!important}
.stage .greeting,.stage .status,.stage .nudge{position:relative!important;inset:auto!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;transform:none!important;display:block!important;box-sizing:border-box!important;height:auto!important;max-height:none!important;overflow:visible!important;white-space:normal!important;text-overflow:clip!important;clip:auto!important;clip-path:none!important;width:min(92vw,760px)!important;text-align:center!important;z-index:30!important}
.stage .greeting{margin:12px auto 0!important;min-height:44px!important;padding:0 4px 4px!important;font-size:clamp(20px,2vw,30px)!important;line-height:1.4!important}
.stage .status{margin:6px auto 0!important;min-height:34px!important;padding:2px 4px 5px!important;font-size:clamp(16px,1.55vw,21px)!important;line-height:1.45!important}
.stage .nudge{margin:4px auto 0!important;min-height:30px!important;padding:2px 4px 5px!important;line-height:1.4!important}
@media(max-width:700px){.stage{padding-top:12px!important;min-height:390px!important}.stage .bluey-depth-room{height:175px!important;min-height:175px!important}.stage .greeting{margin-top:10px!important;min-height:40px!important;font-size:22px!important;line-height:1.4!important}.stage .status{min-height:32px!important;font-size:17px!important;line-height:1.45!important}}
`;
document.head.appendChild(css);
setTimeout(()=>{removePromptBuilder();if(room()===HOME)quietHome({clearHoliday:false});bindTapToTalk();stopAutonomousWorld();startHomeGuard()},100);
setTimeout(()=>{removePromptBuilder();bindTapToTalk();if(room()===HOME)enforceHome()},700);
setTimeout(()=>{removePromptBuilder();if(room()===HOME)enforceHome()},1800);
window.BlueyQuietStage={version:'1.7.2',clearObjects,revealObjects,quietHome,forceHome,asksToSeeObjects,asksWorldTravel,removePromptBuilder,bindTapToTalk,scheduleHolidayReturn};
console.info('[Bluey] Alpha 47.7.2 text visibility fix ready');
})();