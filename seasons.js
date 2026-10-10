// Seasonal and holiday sky scenes (upgrades the old ones in index.html, which still schedules them).
// - Winter (December through February): soft snowflakes drift down around Bluey.
// - Christmas (the week before, through the 25th): sometimes a sleigh flies across the sky above
//   him instead: eight little blue balls led by a red one, bobbing in a line.
// - July 4th week: colored balls rise into the sky and burst like fireworks. July 4th itself is his
//   Digital Day (birthday), so that day opens with a bigger show. (The old birthday scene still
//   checked for July 7, so it never played after his birthday moved.)
// - New Year's: the same fireworks in gold and silver.
// Everything stays inside the stage (the area around Bluey), never over the chat, can't be tapped,
// and is removed when it finishes. With reduced motion, only his status line plays.
// Preview any of them any time of year: ?season=winter | christmas | sleigh | july4 | birthday |
// newyear | fall. That plays the scene ~2 s after load and every 25 s. blueySeasons.play(name) too.
(function(){
'use strict';
if(typeof sceneLayer==='undefined'||!Element.prototype.animate)return;
const stage=document.querySelector('.stage'),orb=document.getElementById('orb');
if(!stage||!orb)return;
const calm=matchMedia('(prefers-reduced-motion: reduce)');
const say=(t,ms,at)=>setTimeout(()=>sceneStatus(t,ms),at);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const rnd=(a,b)=>a+Math.random()*(b-a);
// Stage and orb in screen coordinates (the scene layer covers the whole window).
function box(){const s=stage.getBoundingClientRect(),o=orb.getBoundingClientRect();return {s,o}}
function bit(cls,x,y,size){
 const e=document.createElement('i');e.className='bluey-sky '+cls;
 e.style.left=Math.round(x)+'px';e.style.top=Math.round(y)+'px';
 if(size)e.style.width=e.style.height=Math.round(size)+'px';
 sceneLayer.appendChild(e);return e;
}
const gone=e=>()=>e.remove();

// ---- Winter snow ----
function winterSnowScene(force){
 if(!force&&!blueySceneAllowed())return;lastRareScene=Date.now();
 if(calm.matches){say("Is it snowing out there, or is it just me? ❄",4200,300);return}
 const {s}=box(),n=s.width<520?12:18;
 for(let i=0;i<n;i++)setTimeout(()=>{
  const size=rnd(10,20),x=s.left+rnd(.04,.96)*s.width,fall=s.height*rnd(.75,.95);
  const f=bit('bluey-flake',x,s.top-size,size);f.textContent='❄';f.style.fontSize=size+'px';
  const sway=rnd(18,46)*(Math.random()<.5?-1:1),dur=rnd(6500,9500);
  f.animate([
   {transform:'translate(0,0) rotate(0deg)',opacity:0},
   {transform:`translate(${sway}px,${fall*.3}px) rotate(70deg)`,opacity:.9,offset:.2},
   {transform:`translate(${-sway*.6}px,${fall*.65}px) rotate(160deg)`,opacity:.85,offset:.6},
   {transform:`translate(${sway*.4}px,${fall}px) rotate(250deg)`,opacity:0}
  ],{duration:dur,easing:'linear'}).onfinish=gone(f);
 },i*rnd(260,420));
 if(Math.random()<.45)say(pick(["Is there something on me?","Snow! I'm keeping one. Where do I keep it?","Every snowflake is different. Like questions! ❄"]),4200,4500);
}

// ---- Christmas sleigh: 8 blue, led by a red one ----
function sleighScene(force){
 if(!force&&!blueySceneAllowed())return;lastRareScene=Date.now();
 if(calm.matches){say("I think I just heard sleigh bells. 🔔",4500,300);return}
 const {s,o}=box();
 const size=s.width<520?10:13,gap=size*1.9;
 // Fly through clear sky above him: above the greeting if it sits over his head and there's room,
 // else in the gap between the greeting and his head, else just over his head.
 const c=document.querySelector('.stage-copy')?.getBoundingClientRect(),need=size*4;
 const textAbove=c&&c.height&&c.top<o.top;
 let y;
 if(!textAbove)y=Math.max(s.top+need/2,(s.top+o.top)/2);
 else if(c.top-s.top>=need)y=(s.top+c.top)/2;
 else if(o.top-c.bottom>=need*.7)y=(c.bottom+o.top)/2;
 else y=Math.max(s.top+12,o.top-size*2);
 const ltr=Math.random()<.5,dir=ltr?1:-1;
 const span=s.width+gap*10,dur=Math.min(9500,Math.max(6000,s.width*7.5));
 for(let i=0;i<9;i++){
  // i=0 is the red leader, out in front.
  const lead=i===0,sz=lead?size*1.2:size;
  const startX=ltr?s.left-sz-i*gap:s.left+s.width+i*gap;
  const b=bit(lead?'bluey-sleigh-ball bluey-sleigh-lead':'bluey-sleigh-ball',startX,y-sz/2,sz);
  const bob=size*.9,phase=i*.55,steps=12,frames=[];
  for(let k=0;k<=steps;k++){
   const t=k/steps;
   frames.push({transform:`translate(${dir*span*t}px,${Math.sin(t*Math.PI*4+phase)*bob-t*size*2}px)`,opacity:t<.04||t>.96?0:1});
  }
  b.animate(frames,{duration:dur,easing:'linear'}).onfinish=gone(b);
 }
 say(pick(["Did you see that?! I think that was Santa! 🎅","Was that... a red ball in charge? I respect it.","Eight blue friends and one red leader. Merry Christmas! 🎄"]),5200,Math.min(dur*.55,4500));
}

// ---- Fireworks: colored balls rise and burst ----
const JULY4=['#e23b3b','#ffffff','#2f7be0','#ff6b6b','#5aa8ff','#ffd86b'];
const NEWYEAR=['#ffd86b','#f4f1e8','#ffc23a','#d9dde6'];
function rocket(colors,delay){
 setTimeout(()=>{
  const {s,o}=box();
  const color=pick(colors),size=s.width<520?8:11;
  const x0=s.left+rnd(.15,.85)*s.width,y0=Math.min(s.bottom-10,o.bottom);
  const x1=x0+rnd(-30,30),y1=s.top+s.height*rnd(.1,.32);
  const r=bit('bluey-rocket',x0,y0,size);r.style.setProperty('--c',color);
  r.animate([{transform:'translate(0,0)',opacity:.2},{transform:`translate(${x1-x0}px,${y1-y0}px)`,opacity:1}],
   {duration:rnd(900,1200),easing:'cubic-bezier(.2,.7,.4,1)'}).onfinish=()=>{r.remove();burst(x1,y1,color,colors,s)};
 },delay);
}
function burst(x,y,color,colors,s){
 const small=s.width<520,n=small?18:26,reach=(small?70:110)*rnd(.8,1.1);
 // A quick bright flash where it bursts.
 const f=bit('bluey-flash',x-14,y-14,28);f.style.setProperty('--c',color);
 f.animate([{transform:'scale(.2)',opacity:1},{transform:'scale(1.6)',opacity:0}],{duration:420,easing:'ease-out'}).onfinish=gone(f);
 for(let i=0;i<n;i++){
  const c=Math.random()<.75?color:pick(colors),a=Math.PI*2*i/n+rnd(-.12,.12),d=reach*rnd(.6,1);
  const p=bit('bluey-ember',x,y,rnd(small?4:5,small?6:8));p.style.setProperty('--c',c);
  p.animate([
   {transform:'translate(0,0) scale(1)',opacity:1},
   {transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) scale(.9)`,opacity:1,offset:.55,easing:'ease-in'},
   {transform:`translate(${Math.cos(a)*d*1.1}px,${Math.sin(a)*d+reach*.45}px) scale(.3)`,opacity:0}
  ],{duration:rnd(1300,1700),easing:'cubic-bezier(.15,.8,.3,1)'}).onfinish=gone(p);
 }
}
function fireworks(colors,count,spacing){for(let i=0;i<count;i++)rocket(colors,i*spacing+rnd(0,180))}
function julyFourthFireworks(force){
 if(!force&&!blueySceneAllowed())return;lastRareScene=Date.now();
 if(!calm.matches)fireworks(JULY4,7,520);
 say(pick(["Happy Fourth of July! I brought the blue. 😄","Red, white, and... I'm doing my part on blue. 🎆","Fireworks! The round ones are my favorite, obviously."]),4800,calm.matches?300:2200);
}
function newYearFireworks(force){
 if(!force&&!blueySceneAllowed())return;lastRareScene=Date.now();
 if(!calm.matches)fireworks(NEWYEAR,6,560);
 say("New year. What should we figure out next? ✨",5000,calm.matches?300:2000);
}
// July 4th is his Digital Day: a bigger show, once, shortly after the page opens.
function digitalDayScene(force){
 const d=new Date();if(!force&&(d.getMonth()!==6||d.getDate()!==4))return;
 lastRareScene=Date.now();
 if(typeof blueyOrb!=='undefined')blueyOrb?.classList.add('bluey-birthday-party');
 const text=document.createElement('div');text.className='bluey-scene-text';text.textContent="BLUEY'S DIGITAL DAY!";sceneLayer.appendChild(text);
 if(!calm.matches)fireworks(JULY4,10,380);
 say("Hey... guess what day it is? 🎉 It's my Digital Day!",6000,1000);
 setTimeout(()=>{if(typeof blueyOrb!=='undefined')blueyOrb?.classList.remove('bluey-birthday-party');text.remove()},5000);
}

// ---- Hook into the existing scheduler (index.html calls these by name) ----
christmasSnowScene=winterSnowScene;
julyFourthScene=julyFourthFireworks;
newYearScene=newYearFireworks;
birthdayScene=digitalDayScene;
// index.html scheduled its own birthdayScene at load (setTimeout keeps the old function), so ours
// runs on its own at about the same moment.
setTimeout(()=>digitalDayScene(),3800);
seasonalRareScene=function(){
 if(!blueySceneAllowed())return;
 const m=new Date().getMonth(),holiday=window.blueyCurrentHoliday?.key;
 if((m===8||m===9||m===10)&&Math.random()<.55)return leafDodgeScene();
 if(holiday==='halloween'&&Math.random()<.45)return halloweenShadowScene();
 if(holiday==='christmas'&&Math.random()<.75)return Math.random()<.5?sleighScene():winterSnowScene();
 if((m===11||m===0||m===1)&&Math.random()<.5)return winterSnowScene();
 if(holiday==='july4'&&Math.random()<.7)return julyFourthFireworks();
};

const SCENES={winter:winterSnowScene,snow:winterSnowScene,christmas:sleighScene,sleigh:sleighScene,july4:julyFourthFireworks,fireworks:julyFourthFireworks,birthday:digitalDayScene,newyear:newYearFireworks,fall:()=>{lastRareScene=0;leafDodgeScene()}};
function play(name){const f=SCENES[String(name||'').toLowerCase()];if(!f)return false;f(true);return true}
window.blueySeasons={play,scenes:Object.keys(SCENES)};
const preview=new URLSearchParams(location.search).get('season');
if(preview&&SCENES[preview.toLowerCase()]){setTimeout(()=>play(preview),2000);setInterval(()=>{if(!document.hidden)play(preview)},25000)}
})();
