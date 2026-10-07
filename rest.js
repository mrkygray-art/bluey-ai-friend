// Bluey rests when nobody is using him: after a minute with no typing, tapping, talking, scrolling,
// or mouse movement, his endless gentle bob pauses (body.bluey-resting), and it picks up exactly
// where it stopped the moment anyone does anything. He never rests while he is listening,
// thinking, or speaking. The bob was redrawn at the screen's refresh rate all the time, which
// kept a phone's processor busy and drained its battery while Bluey sat on screen unattended.
// One-off moves (a happy bounce, flying to a room) still play while he rests.
(function(){
'use strict';
const AFTER=Number(window.BLUEY_REST_AFTER)||60000;
const style=document.createElement('style');
style.textContent='body.bluey-resting .mover,body.bluey-resting #orb.bluey-idle{animation-play-state:paused!important}';
document.head.appendChild(style);
let last=Date.now();
const busy=()=>{const app=document.querySelector('.app'),orb=document.getElementById('orb');return !!(app?.classList.contains('working')||orb?.matches('.bluey-listening,.bluey-thinking,.bluey-speaking')||window.speechSynthesis?.speaking)};
function wake(){last=Date.now();if(document.body.classList.contains('bluey-resting'))document.body.classList.remove('bluey-resting')}
let moveSeen=0;
const onMove=()=>{const now=Date.now();if(now-moveSeen>500){moveSeen=now;wake()}};
for(const ev of ['pointerdown','keydown','input','wheel','touchstart','focusin'])addEventListener(ev,wake,{capture:true,passive:true});
addEventListener('pointermove',onMove,{capture:true,passive:true});
addEventListener('scroll',wake,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake()});
// A new message (his reply, a greeting update) counts as activity too.
const watch=()=>{const m=document.getElementById('messages');if(m)new MutationObserver(wake).observe(m,{childList:true})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
setInterval(()=>{
 if(busy()){wake();return}
 if(Date.now()-last>=AFTER&&!document.body.classList.contains('bluey-resting'))document.body.classList.add('bluey-resting');
},1000);
window.blueyRest={wake,get resting(){return document.body.classList.contains('bluey-resting')}};
})();
