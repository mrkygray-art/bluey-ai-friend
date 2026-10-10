// Whenever Bluey mentions marbles (in a reply or a greeting), a few glass marbles from his
// collection drop down beside him, sit for a moment, then slowly roll away off the stage.
// It's only decoration: the marbles can't be tapped and never cover the text. Once per
// message, and never while a batch is still rolling. With reduced motion they fade in and out.
(function(){
'use strict';
const stage=document.querySelector('.stage'),orb=document.getElementById('orb');
if(!stage||!orb||!Element.prototype.animate)return;
const MARBLE=/\bmarbles?\b/i;
const calm=matchMedia('(prefers-reduced-motion: reduce)');
// Glass colors; the dark blue one has the storm cloud from his lore.
const LOOKS=['m-blue','m-storm','m-teal','m-amber','m-red','m-green','m-violet'];
let rolling=false;

function drop(){
 if(rolling||document.hidden)return false;
 const s=stage.getBoundingClientRect(),o=orb.getBoundingClientRect();
 if(!o.width||!s.width)return false;
 rolling=true;
 const size=Math.round(Math.max(12,Math.min(22,o.width*.13)));
 // Level with the bottom of the orb, so they sit beside him and never land on the greeting
 // or status text below him.
 const floor=Math.min(s.height-size-4,o.bottom-s.top-size);
 const mid=o.left-s.left+o.width/2;
 const looks=LOOKS.filter(l=>l!=='m-storm').sort(()=>Math.random()-.5);
 const count=3+Math.floor(Math.random()*2);
 let left=count;
 for(let i=0;i<count;i++){
  const m=document.createElement('div');
  m.className='bluey-marble-drop '+(i===0?'m-storm':looks[i]);
  m.setAttribute('aria-hidden','true');
  m.style.width=m.style.height=size+'px';
  // Just outside him, a little to each side.
  const side=i%2?1:-1;
  const x=mid-size/2+side*(o.width/2+size*.6+(i>>1)*size*1.4+Math.random()*size*.8);
  m.style.left=Math.round(x)+'px';
  m.style.top=Math.round(floor)+'px';
  stage.appendChild(m);
  const done=()=>{m.remove();if(--left===0)rolling=false};
  if(calm.matches){
   m.animate([{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.85},{opacity:0}],{duration:3500,delay:i*120}).onfinish=done;
   continue;
  }
  // Fall in with a small bounce, rest, then roll off whichever side is nearer, spinning as it goes.
  const startDelay=i*140+Math.random()*80;
  const away=side>0?s.width-x+size:-(x+size);
  const turns=away/(Math.PI*size)*360;
  const rest=1200+Math.random()*900;
  const roll=Math.min(9000,Math.max(4500,Math.abs(away)*12));
  m.animate([
   {transform:'translate(0,-70px) rotate(0deg)',opacity:0},
   {transform:'translate(0,0) rotate(0deg)',opacity:1,offset:.55,easing:'ease-out'},
   {transform:'translate(0,-9px) rotate(0deg)',offset:.78,easing:'ease-in'},
   {transform:'translate(0,0) rotate(0deg)',opacity:1}
  ],{duration:650,delay:startDelay,fill:'both'}).onfinish=()=>{
   m.animate([
    {transform:'translate(0,0) rotate(0deg)'},
    {transform:`translate(${away}px,0) rotate(${turns}deg)`}
   ],{duration:roll,delay:rest,easing:'cubic-bezier(.45,0,.7,1)',fill:'both'}).onfinish=done;
  };
 }
 return true;
}

function check(text){if(text&&MARBLE.test(text))drop()}
// His replies.
const messages=document.getElementById('messages');
if(messages)new MutationObserver(list=>{
 for(const r of list)for(const n of r.addedNodes){
  if(n.nodeType===1&&(n.matches('.msg.assistant')||n.querySelector?.('.msg.assistant'))){check(n.textContent);return}
 }
}).observe(messages,{childList:true});
// His greetings (several are about reorganizing or counting marbles).
const greeting=document.querySelector('.stage-copy .greeting');
if(greeting){
 let last=greeting.textContent;
 new MutationObserver(()=>{const t=greeting.textContent;if(t!==last){last=t;check(t)}}).observe(greeting,{childList:true,characterData:true,subtree:true});
 setTimeout(()=>check(greeting.textContent),900);
}
window.blueyMarbles={drop};
})();
