// Keep the greeting/status column centered just under Bluey on every screen, following him
// as he drifts left/right and forward/back (see follow-copy.css). If there's no room below,
// it sits above him; near an edge it stays fully on screen.
(function(){
'use strict';
const stage=document.querySelector('.stage'),copy=document.querySelector('.stage-copy'),orb=document.getElementById('orb');
if(!stage||!copy||!orb)return;
function place(){
 const s=stage.getBoundingClientRect(),o=orb.getBoundingClientRect();
 if(!o.width||!s.width)return;
 const w=copy.offsetWidth,h=copy.offsetHeight,gap=s.width<=700?18:26;
 const x=Math.max(12,Math.min(s.width-w-12,o.left-s.left+o.width/2-w/2));
 let y=o.bottom-s.top+gap;
 if(y+h>s.height-8)y=Math.max(8,o.top-s.top-h-gap);
 copy.style.setProperty('--bluey-copy-x',Math.round(x)+'px');
 copy.style.setProperty('--bluey-copy-y',Math.round(y)+'px');
 copy.classList.add('bluey-copy-placed');
}
place();
setInterval(place,150);
window.addEventListener('resize',place);
})();
