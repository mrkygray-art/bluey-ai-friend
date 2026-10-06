// On computers, keep the greeting/status column centered just under Bluey as he moves
// around the stage (see desktop-copy.css). Phones use the CSS-only stack in index.html.
(function(){
'use strict';
const wide=window.matchMedia('(min-width:701px)');
const stage=document.querySelector('.stage'),copy=document.querySelector('.stage-copy'),orb=document.getElementById('orb');
if(!stage||!copy||!orb)return;
function place(){
 if(!wide.matches){copy.classList.remove('bluey-copy-placed');return}
 const s=stage.getBoundingClientRect(),o=orb.getBoundingClientRect();
 if(!o.width||!s.width)return;
 const w=copy.offsetWidth,h=copy.offsetHeight;
 const x=Math.max(12,Math.min(s.width-w-12,o.left-s.left+o.width/2-w/2));
 let y=o.bottom-s.top+26;
 if(y+h>s.height-8)y=Math.max(8,o.top-s.top-h-16); // no room below: sit above Bluey
 copy.style.setProperty('--bluey-copy-x',Math.round(x)+'px');
 copy.style.setProperty('--bluey-copy-y',Math.round(y)+'px');
 copy.classList.add('bluey-copy-placed');
}
place();
setInterval(place,150);
window.addEventListener('resize',place);
wide.addEventListener?.('change',place);
})();
