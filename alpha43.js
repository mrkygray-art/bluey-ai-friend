// Bluey Alpha 43 — Shared World Scene Standard V2
// Every Bluey location uses the same world contract: atmosphere + visible truth + interactive objects + continuity.
(function(){
'use strict';
if(window.BlueyCharacter)window.BlueyCharacter.version='1.0-alpha43.2';
if(window.blueyAbout)window.blueyAbout.version='1.0-alpha43.2';
if(!window.BLUEY_OBJECTS)return;

const WORLD_STANDARD={
 home:{theme:'home',truth:'home base',objects:[]},
 observatory:{theme:'observatory',truth:'stars, telescope, star map and Earth window',objects:[
  {id:'observatory-telescope',icon:'🔭',names:['telescope','scope'],title:'Bluey’s telescope',short:'My telescope. I point it at things that are very far away and then act like I meant to find them.',deeper:'A telescope gathers more light than our eyes can, which lets us see dimmer and more distant objects.',rabbit:'We could point it somewhere interesting next.'},
  {id:'observatory-starmap',icon:'✨',names:['star map','stars','constellation','map'],title:'The glowing star map',short:'My star map. Basically connect-the-dots with several billion possible dots.',deeper:'Star maps help identify constellations and locate objects by their position in the sky.',rabbit:'Somewhere on this map is a star with an unnecessarily dramatic name. Probably.'},
  {id:'observatory-earth',icon:'🌎',names:['earth','earth window','window','blue marble'],title:'Earth in the big window',short:'There she is — the original blue marble. I admit I may be biased.',deeper:'From far enough away, weather, borders and streets disappear and Earth becomes one bright little world.',rabbit:'It is hard to look at Earth from here and not get at least a little philosophical.'},
  {id:'observatory-planet',icon:'🪐',names:['planet','saturn','planet model'],title:'Little planet model',short:'I keep a tiny planet around for perspective. Also because rings are excellent accessories.',deeper:'The planets orbit the Sun at different distances and speeds, so their positions in our sky change over time.',rabbit:'Saturn is absolutely showing off, by the way.'}
 ]},
 garage:{theme:'garage',truth:'garage objects',objects:[]}, arcade:{theme:'arcade',truth:'arcade objects',objects:[]}, workshop:{theme:'workshop',truth:'workshop objects',objects:[]},
 beach:{theme:'beach',truth:'beach objects',objects:[]}, forest:{theme:'forest',truth:'forest objects',objects:[]}, museum:{theme:'museum',truth:'museum objects',objects:[]}, aquarium:{theme:'aquarium',truth:'aquarium objects',objects:[]},
 quiet:{theme:'quiet',truth:'quiet-space objects',objects:[]}, edge:{theme:'edge',truth:'edge-space objects',objects:[]}
};

// Preserve existing room objects. Observatory is our reference implementation; other rooms automatically inherit the same renderer/contract.
WORLD_STANDARD.observatory.objects.forEach(()=>{});
BLUEY_OBJECTS.observatory=WORLD_STANDARD.observatory.objects;
Object.keys(WORLD_STANDARD).forEach(room=>{if(room!=='observatory'&&Array.isArray(BLUEY_OBJECTS[room]))WORLD_STANDARD[room].objects=BLUEY_OBJECTS[room]});

function removeScenery(){document.querySelectorAll('.bluey-scenery-43').forEach(n=>n.remove());document.body.className=document.body.className.replace(/\bbluey-world43-[\w-]+\b/g,'').trim()}
function sceneryNode(cls,html,label){const n=document.createElement('div');n.className='bluey-scenery-43 '+cls;n.innerHTML=html;if(label)n.setAttribute('aria-label',label);return n}
function renderScenery(room){removeScenery();if(!window.blueyStage37)return;document.body.classList.add('bluey-world43-'+room);
 if(room==='observatory'){
  const stars=sceneryNode('stars43','',null);for(let i=0;i<38;i++){const s=document.createElement('i');s.style.left=(3+Math.random()*94)+'%';s.style.top=(5+Math.random()*78)+'%';s.style.animationDelay=(Math.random()*3)+'s';stars.appendChild(s)}blueyStage37.prepend(stars);
  const map=sceneryNode('constellation43','<span>✦</span><i></i><span>✧</span><i></i><span>✦</span>','Glowing constellation map');blueyStage37.appendChild(map);
  const earth=sceneryNode('earthWindow43','<div class="earth43">🌎</div><small>Earth window</small>','Earth in the observatory window');blueyStage37.appendChild(earth);
 }
}

const baseRender43=window.renderInteractiveObjects;
window.renderInteractiveObjects=function(place){const result=baseRender43(place);if(Array.isArray(window.blueyVisibleObjects))blueyVisibleObjects.forEach(n=>{if(n&&!n.isConnected&&window.blueyStage37)blueyStage37.appendChild(n)});return result};
const baseEnter43=window.enterWorld;
window.enterWorld=function(place,announce=true){const result=baseEnter43(place,announce);renderScenery(place);if(typeof window.renderInteractiveObjects==='function')window.renderInteractiveObjects(place);return result};

const style=document.createElement('style');style.textContent=`
.bluey-world43-observatory .stage{background:radial-gradient(circle at 50% 38%,rgba(48,117,179,.30),transparent 31%),linear-gradient(180deg,#071426,#102944 68%,#15283a)!important;color:#d9efff}
.bluey-world43-observatory .greeting,.bluey-world43-observatory .status,.bluey-world43-observatory .nudge{color:#d9efff!important}
.bluey-scenery-43{position:absolute;pointer-events:none}.stars43{inset:0;z-index:0;overflow:hidden}.stars43 i{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 8px #c8e9ff;animation:twinkle43 2.8s ease-in-out infinite alternate}.stars43 i:nth-child(4n){width:5px;height:5px}
.constellation43{left:20%;top:27%;z-index:1;display:flex;align-items:center;gap:5px;opacity:.75}.constellation43 span{font-size:18px;text-shadow:0 0 12px #bde7ff}.constellation43 i{display:block;width:42px;height:1px;background:rgba(190,230,255,.55);transform:rotate(-18deg)}
.earthWindow43{right:12%;top:18%;width:112px;height:112px;border:2px solid rgba(185,225,250,.45);border-radius:50%;background:radial-gradient(circle,#193956,#07121f 70%);box-shadow:0 0 28px rgba(91,175,232,.22);display:grid;place-items:center;z-index:1}.earth43{font-size:48px;filter:drop-shadow(0 0 10px rgba(75,181,255,.55))}.earthWindow43 small{position:absolute;bottom:-24px;color:#cceaff;white-space:nowrap}
.bluey-world43-observatory .rig,.bluey-world43-observatory .bluey-object{z-index:3}@keyframes twinkle43{from{opacity:.25;transform:scale(.7)}to{opacity:1;transform:scale(1.3)}}
@media(max-width:520px){.earthWindow43{width:72px;height:72px;right:5%;top:16%}.earth43{font-size:32px}.earthWindow43 small{display:none}.constellation43{left:8%;top:34%;transform:scale(.75)}.stars43 i:nth-child(n+25){display:none}}
`;document.head.appendChild(style);

function cleanRoomReply(room){if(room==='observatory'){const lines=['Observatory it is. The telescope is out, the star map is glowing, and Earth is showing off in the window again.','Welcome to the Observatory. Telescope on one side, Earth in the window, and entirely too many stars to count.','Up we go. The Observatory is awake — telescope, star map, Earth window and all.'];return lines[Math.floor(Math.random()*lines.length)]}return null}
const baseSend43=window.send;
window.send=async function(text){const clean=String(text||'').trim();if(!clean)return;
 if(/\b(observatory)\b/i.test(clean)&&/\b(show|take|bring|go|visit|see|room|observatory)\b/i.test(clean)){add('user',clean);history.push({role:'user',content:clean});if(window.input)input.value='';enterWorld('observatory',false);const answer=cleanRoomReply('observatory');setTimeout(()=>{add('assistant',answer);history.push({role:'assistant',content:answer});if(typeof speak==='function'&&(typeof blueyVoiceOn==='undefined'||blueyVoiceOn))speak(answer,'curious')},350);return}
 return baseSend43(clean)};

// Shared API: every future room registers here and automatically gets the same behavior contract.
window.BlueyWorldStandard={version:'2.0',rooms:WORLD_STANDARD,register(room,config){WORLD_STANDARD[room]=Object.assign({theme:room,truth:'',objects:[]},config||{});if(Array.isArray(WORLD_STANDARD[room].objects))BLUEY_OBJECTS[room]=WORLD_STANDARD[room].objects},enter(room){if(typeof window.enterWorld==='function')window.enterWorld(room,false)},describe(room){return WORLD_STANDARD[room]||null}};
if(window.blueyWorld)renderScenery(window.blueyWorld);if(window.blueyWorld==='observatory')renderInteractiveObjects('observatory');
console.info('[Bluey] Alpha 43 Shared World Scene Standard V2 ready');
})();