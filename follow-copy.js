// Keep the greeting/status column centered just under Bluey on every screen, following him
// as he drifts left/right and forward/back (see follow-copy.css). If there's no room below,
// it sits above him; near an edge it stays fully on screen.
// Speed matters here because this runs all the time:
// - While Bluey is really moving (any animation or transition with an end, like flying to a room,
//   shrinking while he thinks, or a happy bounce), it follows every frame.
// - Otherwise only his endless gentle bob is running, so 15 checks a second are plenty.
// - It only touches the page when the position actually changes.
// Following every frame, all the time, kept a slow phone's processor about a fifth busy while
// Bluey sat still (each check makes the browser work out where he is mid-animation).
(function(){
'use strict';
const stage=document.querySelector('.stage'),copy=document.querySelector('.stage-copy'),orb=document.getElementById('orb');
if(!stage||!copy||!orb)return;
let lastX=null,lastY=null;
function place(){
 const s=stage.getBoundingClientRect(),o=orb.getBoundingClientRect();
 if(!o.width||!s.width)return;
 const w=copy.offsetWidth,h=copy.offsetHeight,gap=s.width<=700?18:26;
 const x=Math.round(Math.max(12,Math.min(s.width-w-12,o.left-s.left+o.width/2-w/2)));
 let y=o.bottom-s.top+gap;
 if(y+h>s.height-8)y=Math.max(8,o.top-s.top-h-gap);
 y=Math.round(y);
 if(x===lastX&&y===lastY)return;
 lastX=x;lastY=y;
 copy.style.setProperty('--bluey-copy-x',x+'px');
 copy.style.setProperty('--bluey-copy-y',y+'px');
 if(!copy.classList.contains('bluey-copy-placed'))copy.classList.add('bluey-copy-placed');
}
// Is anything on the stage moving that will stop (travel, a transition, a one-off bounce)? The
// greeting's own short glide doesn't count, or it would keep itself at full speed.
const moving=()=>{try{return stage.getAnimations({subtree:true}).some(a=>a.playState==='running'&&!copy.contains(a.effect?.target)&&(typeof CSSTransition!=='undefined'&&a instanceof CSSTransition||a.effect?.getTiming?.().iterations!==Infinity))}catch(_){return true}};
function loop(){
 place();
 if(moving())requestAnimationFrame(loop);
 else setTimeout(loop,66);
}
loop();
addEventListener('resize',place);
})();
