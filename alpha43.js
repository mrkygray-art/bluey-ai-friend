// Bluey Alpha 43 — World Truth + Observatory Scene V1
// If Bluey says he travels to a room, the stage must visually represent that room.
(function(){
'use strict';
if(window.BlueyCharacter)window.BlueyCharacter.version='1.0-alpha43';
if(window.blueyAbout)window.blueyAbout.version='1.0-alpha43';

if(!window.BLUEY_OBJECTS)return;

BLUEY_OBJECTS.observatory=[
 {id:'observatory-telescope',icon:'🔭',names:['telescope','scope'],title:'Bluey’s telescope',short:'My telescope. I point it at things that are very far away and then act like I meant to find them.',deeper:'A telescope gathers more light than our eyes can, which lets us see dimmer and more distant objects.',rabbit:'Want to point it at the Moon, a planet, or something much farther away?'},
 {id:'observatory-starmap',icon:'✨',names:['star map','stars','constellation','map'],title:'The glowing star map',short:'My star map. It is basically connect-the-dots with several billion possible dots.',deeper:'Star maps help us identify constellations and locate objects by their position in the sky.',rabbit:'Pick a part of the sky and we can wonder what is hiding there.'},
 {id:'observatory-planet',icon:'🪐',names:['planet','saturn','planet model'],title:'Little planet model',short:'A little planet model. I keep it here for perspective. Also because rings are objectively excellent accessories.',deeper:'The planets orbit the Sun at different distances and speeds, so their positions in our sky change over time.',rabbit:'Want to choose a planet for a tiny imaginary flyby?'}
];

const baseRender43=window.renderInteractiveObjects;
window.renderInteractiveObjects=function(place){
 const result=baseRender43(place);
 if(place==='observatory'&&Array.isArray(window.blueyVisibleObjects)){
   blueyVisibleObjects.forEach(node=>{ if(node && !node.isConnected && window.blueyStage37) blueyStage37.appendChild(node); });
 }
 return result;
};

function observatoryBackdrop(on){
 document.body.classList.toggle('bluey-observatory-43',!!on);
 let field=document.getElementById('bluey-stars-43');
 if(!on){if(field)field.remove();return;}
 if(field||!window.blueyStage37)return;
 field=document.createElement('div');field.id='bluey-stars-43';field.setAttribute('aria-hidden','true');
 for(let i=0;i<34;i++){
   const s=document.createElement('i');
   s.style.left=(4+Math.random()*92)+'%';s.style.top=(5+Math.random()*76)+'%';
   s.style.animationDelay=(Math.random()*2.8)+'s';s.style.opacity=(.35+Math.random()*.65).toFixed(2);
   field.appendChild(s);
 }
 blueyStage37.prepend(field);
}

const baseEnter43=window.enterWorld;
window.enterWorld=function(place,announce=true){
 const result=baseEnter43(place,announce);
 observatoryBackdrop(place==='observatory');
 if(place==='observatory'&&typeof window.renderInteractiveObjects==='function')window.renderInteractiveObjects('observatory');
 return result;
};

const style=document.createElement('style');
style.textContent=`
.bluey-observatory-43 .stage{background:radial-gradient(circle at 50% 42%,rgba(27,104,164,.28),transparent 30%),linear-gradient(180deg,#071526 0%,#102b48 66%,#172b3e 100%)!important}
.bluey-observatory-43 .greeting,.bluey-observatory-43 .status,.bluey-observatory-43 .nudge{color:#d9efff!important}
#bluey-stars-43{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
#bluey-stars-43 i{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 8px rgba(190,229,255,.9);animation:blueyTwinkle43 2.8s ease-in-out infinite alternate}
#bluey-stars-43 i:nth-child(3n){width:5px;height:5px}#bluey-stars-43 i:nth-child(5n){width:2px;height:2px}
.bluey-observatory-43 .rig,.bluey-observatory-43 .bluey-object{z-index:2}
@keyframes blueyTwinkle43{from{transform:scale(.7);opacity:.3}to{transform:scale(1.35);opacity:1}}
@media(max-width:520px){#bluey-stars-43 i:nth-child(n+23){display:none}}
`;
document.head.appendChild(style);

// Patch the conversational Observatory invitation: a named room must use the room engine,
// not a descriptive travel-only response.
const baseSend43=window.send;
window.send=async function(text){
 const clean=String(text||'').trim();
 if(!clean)return;
 if(/\b(show|take|bring|go|visit|see|another room).*(observatory)|\b(observatory)\b/i.test(clean)){
   add('user',clean);history.push({role:'user',content:clean});if(window.input)input.value='';
   enterWorld('observatory',false);
   const answer='Observatory it is. Now the room should look the part — stars, my telescope, a glowing star map, and a little planet model. Tap anything that catches your eye.';
   setTimeout(()=>{add('assistant',answer);history.push({role:'assistant',content:answer});if(typeof speak==='function'&&(typeof blueyVoiceOn==='undefined'||blueyVoiceOn))speak(answer,'curious')},420);
   return;
 }
 return baseSend43(clean);
};

// If this file loads while already in the Observatory, repair the scene immediately.
if(window.blueyWorld==='observatory'){observatoryBackdrop(true);renderInteractiveObjects('observatory');}
window.BlueyWorldTruth={version:'1.0',rooms:{observatory:{objects:BLUEY_OBJECTS.observatory.map(o=>o.id)}}};
console.info('[Bluey] Alpha 43 World Truth + Observatory ready');
})();