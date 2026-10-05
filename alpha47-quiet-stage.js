// Bluey Alpha 47.7.1 — Clean Baseline / Quiet Home
// Default: Bluey on white, then greeting/status directly beneath him. Easter eggs stay hidden until explicitly requested.
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
.stage{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;box-sizing:border-box!important;padding-top:clamp(18px,4vh,44px)!important;overflow:visible!important}
.stage .bluey-depth-room{position:relative!important;inset:auto!important;width:100%!important;height:clamp(205px,29vh,260px)!important;min-height:205px!important;flex:0 0 auto!important;overflow:visible!important}
.stage .greeting{position:relative!important;inset:auto!important;transform:none!important;margin:10px auto 0!important;width:min(92vw,760px)!important;min-height:1.35em!important;height:auto!important;overflow:visible!important;text-align:center!important;font-size:clamp(20px,2vw,30px)!important;line-height:1.35!important;z-index:20!important}
.stage .status{position:relative!important;inset:auto!important;transform:none!important;margin:8px auto 0!important;width:min(92vw,760px)!important;min-height:1.5em!important;height:auto!important;overflow:visible!important;text-align:center!important;line-height:1.45!important;z-index:20!important}
.stage .nudge{position:relative!important;inset:auto!important;transform:none!important;margin:6px auto 0!important;width:min(92vw,760px)!important;min-height:1.5em!important;height:auto!important;overflow:visible!important;text-align:center!important;line-height:1.4!important;z-index:20!important}
@media(max-width:700px){.stage{padding-top:14px!important}.stage .bluey-depth-room{height:190px!important;min-height:190px!important}.stage .greeting{margin-top:8px!important;font-size:22px!important;line-height:1.35!important}.stage .status{font-size:17px!important;line-height:1.4!important}}
`;
document.head.appendChild(css);
setTimeout(()=>{removePromptBuilder();if(room()===HOME)quietHome({clearHoliday:false});bindTapToTalk();stopAutonomousWorld();startHomeGuard()},100);
setTimeout(()=>{removePromptBuilder();bindTapToTalk();if(room()===HOME)enforceHome()},700);
setTimeout(()=>{removePromptBuilder();if(room()===HOME)enforceHome()},1800);
window.BlueyQuietStage={version:'1.7.1',clearObjects,revealObjects,quietHome,forceHome,asksToSeeObjects,asksWorldTravel,removePromptBuilder,bindTapToTalk,scheduleHolidayReturn};
console.info('[Bluey] Alpha 47.7.1 quiet stage text spacing ready');
})();