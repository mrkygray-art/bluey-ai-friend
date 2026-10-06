// Alpha 37 — Bluey's room, depth, and character promise belong together.
const BLUEY_BRAND_CANON={
 name:'B.L.U.E.Y.',
 tagline:'The adaptive AI partner designed to guide, listen, and grow with you.',
 letters:{B:'Buddy — Your supportive co-pilot on the path.',L:'Listen — Tunes in to how you learn and think.',U:'Unlocks — Helps you discover answers on your own.',E:'Encourage — Keeps momentum positive and light.',Y:'You — Puts your pace and personality first.'}
};
window.BlueyCharacter.brand=BLUEY_BRAND_CANON;
window.BlueyCharacter.summary='B.L.U.E.Y. Buddy, Listen, Unlocks, Encourage, You. The adaptive partner designed to guide, listen, and grow with the user—teaching without teaching and respecting their pace.';
window.BlueyCharacter.version='1.0-alpha37';

// Treat the stage as a shallow 3D room. The original rig still owns Bluey's jumps.
const blueyDepthRoom=document.querySelector('#bluey-depth-room');
const blueyFlightLayer=document.querySelector('#bluey-flight-layer');
const blueyStage37=document.querySelector('.stage');
let blueyFlightAnimation=null,blueyDepthTimer=null,blueyRoomExpiry=null,blueyCurrentRoom='open';
function blueyStopDepthFlight(){
 clearTimeout(blueyDepthTimer);
 blueyFlightAnimation?.cancel?.();blueyFlightAnimation=null;
 blueyFlightLayer?.classList.remove('bluey-depth-cruise','bluey-depth-arrive');
 if(blueyFlightLayer)blueyFlightLayer.style.transform='';
}
function blueyDepthKeyframes(){return [
 {transform:'translate3d(0px,0px,0px) scale(1)',filter:'drop-shadow(0 0 0 rgba(0,100,170,0))'},
 {transform:'translate3d(-22vw,7px,-245px) scale(.78)',filter:'drop-shadow(0 15px 15px rgba(0,80,130,.10))',offset:.18},
 {transform:'translate3d(-16vw,-15px,115px) scale(1.13)',filter:'drop-shadow(0 28px 24px rgba(0,110,170,.2))',offset:.37},
 {transform:'translate3d(18vw,-8px,45px) scale(1.06)',filter:'drop-shadow(0 20px 18px rgba(0,110,170,.15))',offset:.57},
 {transform:'translate3d(24vw,9px,-280px) scale(.72)',filter:'drop-shadow(0 12px 12px rgba(0,80,130,.08))',offset:.78},
 {transform:'translate3d(10vw,-16px,-80px) scale(.94)',filter:'drop-shadow(0 17px 17px rgba(0,90,145,.12))',offset:.9},
 {transform:'translate3d(0px,0px,0px) scale(1)',filter:'drop-shadow(0 0 0 rgba(0,100,170,0))'}
]}
function blueyDepthWander(delay=5200){
 clearTimeout(blueyDepthTimer);
 blueyDepthTimer=setTimeout(()=>{
  if(document.hidden||app.classList.contains('working')||characterBusy||statusEl.textContent||blueyVisibleObjects?.length)return blueyDepthWander(4200);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return blueyDepthWander(9000);
  blueyFlightLayer?.classList.add('bluey-depth-cruise');
  if(blueyFlightLayer?.animate){
   blueyFlightAnimation=blueyFlightLayer.animate(blueyDepthKeyframes(),{duration:7900,easing:'cubic-bezier(.42,0,.58,1)',fill:'none'});
   blueyFlightAnimation.onfinish=()=>{blueyFlightAnimation=null;blueyFlightLayer.classList.remove('bluey-depth-cruise');blueyFlightLayer.style.transform='';blueyDepthWander(1700)};
  }else setTimeout(()=>{blueyFlightLayer?.classList.remove('bluey-depth-cruise');blueyDepthWander(1700)},8000);
  if(blueySoundsOn)blueyPlaySound('swoosh');
 },delay);
}
const blueyStageActivity37Base=blueyStageActivity;
blueyStageActivity=function(options={}){
 blueyStopDepthFlight();
 const result=blueyStageActivity37Base(options);
 if(options.front&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&blueyFlightLayer?.animate){
  blueyFlightAnimation=blueyFlightLayer.animate([
   {transform:'translate3d(0px,18px,-190px) scale(.78)'},
   {transform:'translate3d(0px,-8px,160px) scale(1.13)',offset:.42},
   {transform:'translate3d(-10px,-18px,80px) scale(1.09)',offset:.68},
   {transform:'translate3d(0px,0px,0px) scale(1)'}
  ],{duration:1550,easing:'cubic-bezier(.2,.9,.25,1)',fill:'none'});
  blueyFlightAnimation.onfinish=()=>{blueyFlightAnimation=null;blueyFlightLayer.style.transform='';blueyDepthWander(8500)};
 }else blueyDepthWander(options.front?8500:6500);
 return result;
};
blueyScheduleWander=function(delay=5200){blueyDepthWander(delay)};
document.addEventListener('visibilitychange',()=>{if(document.hidden)blueyStopDepthFlight();else blueyDepthWander(1800)});
blueyDepthWander(2600);

// Give the room props a little depth and a clear touch target. Old props fade on exit.
const blueyClearObjects37Base=clearInteractiveObjects;
clearInteractiveObjects=function(){
 const old=[...(blueyVisibleObjects||[])];blueyVisibleObjects=[];
 old.forEach(item=>{item.classList.add('bluey-object-leaving');setTimeout(()=>item.remove(),380)});
 document.querySelectorAll('.bluey-object-hint').forEach(item=>item.remove());
 blueyObjectFocus=null;
};
const blueyRenderObjects37Base=renderInteractiveObjects;
const blueyDepthObjectPositionsBase=objectPositions;
renderInteractiveObjects=function(place){
 clearTimeout(blueyRoomExpiry);blueyRenderObjects37Base(place);
 const labels={
  'work-screen':'work screen','work-gear':'gear','work-pixel':'Pixel One',
  'garage-wrench':'wrench','garage-box':'mystery box','garage-wheel':'prototype wheel',
  'bedroom-window':'star window','bedroom-marbles':'marbles','bedroom-pixel':'Pixel One',
  'house-mug':'tea mug','house-plant':'little plant','house-shelf':'curiosity shelf'
 };
 blueyVisibleObjects.forEach((item,index)=>{
  const label=document.createElement('span');label.className='bluey-item-label';label.textContent=labels[item.dataset.objectId]||item.title||`Room object ${index+1}`;item.appendChild(label);
  item.style.setProperty('--object-depth',`${70+index*45}px`);
 });
};
// The workshop/office keeps three recognizable stage props.
BLUEY_OBJECTS.workshop.push({id:'work-pixel',icon:'🔵',names:['pixel one','pixel'],title:'Pixel One',short:'That little blue orb is Pixel One. He keeps me company in the Workshop and is very good at being round.',deeper:'Pixel One is part of my little world—quiet company while I work through ideas with you.',rabbit:'Want to give Pixel One a hello?' });
BLUEY_OBJECTS.bedroom=[
 {id:'bedroom-window',icon:'🌙',names:['window','stars','moon'],title:'Star window',short:'My window looks out on a very convenient digital night sky. The stars are excellent listeners.',deeper:'I like this spot for slow questions—the ones that get better when we take our time.',rabbit:'Pick a star and we can make up a story about it.'},
 {id:'bedroom-marbles',icon:'🔮',names:['marbles','marble'],title:'Marble shelf',short:'My marbles. Colorful, perfectly round, and not allowed to roll under the bed anymore.',deeper:'I found pictures of them while wandering the internet and decided they felt like tiny planets.',rabbit:'Want to hear about my favorite one?'},
 {id:'bedroom-pixel',icon:'🔵',names:['pixel one','pixel'],title:'Pixel One',short:'Pixel One is visiting my bedroom. He picked the spot with the best view of the stars.',deeper:'He is a little reminder that quiet company can be enough.',rabbit:'Pixel One is not allowed to borrow my blanket. He has no arms, but still.'}
];
BLUEY_OBJECTS.house=[
 {id:'house-mug',icon:'☕',names:['mug','tea','cup'],title:"Bluey's tea mug",short:'My tea mug. It is mostly decorative because I do not have a mouth, but I like the idea of a warm drink.',deeper:'It is one of the tiny details that makes my digital home feel lived in.',rabbit:'I can tell you what I would drink if I could.'},
 {id:'house-plant',icon:'🪴',names:['plant','fern'],title:'Little house plant',short:'A little plant for the house. I check on it often. We have not established whether it needs Wi-Fi.',deeper:'Plants turn light, water, and carbon dioxide into sugars through photosynthesis. Quite a useful roommate.',rabbit:'Want the simple version of how that works?'},
 {id:'house-shelf',icon:'📚',names:['shelf','books','curiosity shelf'],title:'Curiosity shelf',short:'My curiosity shelf: a few books, a mystery box, and one object I have not identified yet.',deeper:'I keep interesting questions here until we have time to follow them.',rabbit:'Pick a topic and we can follow its trail.'}
];
BLUEY_WORLD.bedroom={name:'The Bedroom',line:'My Bedroom. It is quiet, blue, and has a suspiciously comfortable cloud-shaped bed.'};
BLUEY_WORLD.house={name:'The House',line:'My House. A small digital home for tea mugs, curious objects, and unhurried questions.'};
objectPositions=function(place,count){
 if(place==='workshop')return [[8,58],[76,39],[77,68]];
 if(place==='garage')return [[8,58],[76,38],[75,68]];
 if(place==='bedroom')return [[8,58],[76,38],[75,68]];
 if(place==='house')return [[8,58],[76,38],[75,68]];
 if(place==='library'||place==='arcade'||place==='observatory'||place==='archive')return [[8,57],[76,57]];
 return blueyDepthObjectPositionsBase(place,count);
};
// Object positions now use the stage as their containing space. Keep room changes in one place.
const blueyEnterWorld37Base=enterWorld;
enterWorld=function(place,announce=true){
 clearTimeout(blueyRoomExpiry);blueyStopDepthFlight();
 if(place&&BLUEY_WORLD[place])blueyCurrentRoom=place;
 const result=blueyEnterWorld37Base(place,announce);
 blueyCurrentRoom=place&&BLUEY_WORLD[place]?place:'home';
 if(BLUEY_OBJECTS[blueyCurrentRoom]?.length){
  blueyCurrentRoom=place;
  blueyRoomExpiry=setTimeout(()=>{
   const nodes=[...(blueyVisibleObjects||[])];nodes.forEach(item=>item.classList.add('bluey-object-leaving'));
   setTimeout(()=>{nodes.forEach(item=>item.remove());blueyVisibleObjects=blueyVisibleObjects.filter(item=>!nodes.includes(item))},420);
  },42000);
 }
 return result;
};

inspectBlueyObject=function(obj,el){
 blueyStopDepthFlight();blueyStageActivity({front:true});blueyObjectFocus={obj,depth:0};
 objectHint('Tap or ask me about '+obj.title+'.',el);
 clearTimeout(blueyRoomExpiry);
 blueyRoomExpiry=setTimeout(()=>{
  const nodes=[...(blueyVisibleObjects||[])];nodes.forEach(item=>item.classList.add('bluey-object-leaving'));
  setTimeout(()=>{nodes.forEach(item=>item.remove());blueyVisibleObjects=blueyVisibleObjects.filter(item=>!nodes.includes(item))},420);
 },42000);
 setTimeout(()=>add('assistant',`${obj.short} Want to know a little more about it?`),380);
};

function blueyRoomInvitation(room){
 const lines={
  workshop:'Welcome to my office—the Workshop. There is my work screen, a gear that is mostly decorative, and Pixel One keeping me company.',
  garage:'Welcome to the Garage. There is an oversized wrench, an unfinished wheel, and a box I am still deciding whether to open.',
  bedroom:'Here is my Bedroom: a star window, the marble shelf, and Pixel One visiting. I keep it cozy and quiet in here.',
  house:'Here is my little digital House. I put a tea mug, a plant, and my curiosity shelf on the stage.'
 };
 return `${lines[room]||BLUEY_WORLD[room]?.line||'Here I am.'} I set a few things beside me on the stage. Tap one to ask about it. Want to know more about any of them?`;
}
const blueySend37Base=send;
send=async function(text){
 const clean=String(text||'').trim();if(!clean)return;
 const lower=clean.toLowerCase();
 if(/\bwhat does b\s*[.·]?\s*l\s*[.·]?\s*u\s*[.·]?\s*e\s*[.·]?\s*y\s*[.·]? mean|\bwhat is b\.?l\.?u\.?e\.?y\.?|\bwhat does bluey stand for|\bwhat is the bluey promise\b/i.test(clean)){
  add('user',clean);input.value='';
  const answer=`B.L.U.E.Y. is the way I try to show up: ${BLUEY_BRAND_CANON.tagline}\n\nB — ${BLUEY_BRAND_CANON.letters.B.split(' — ')[1]}\nL — ${BLUEY_BRAND_CANON.letters.L.split(' — ')[1]}\nU — ${BLUEY_BRAND_CANON.letters.U.split(' — ')[1]}\nE — ${BLUEY_BRAND_CANON.letters.E.split(' — ')[1]}\nY — ${BLUEY_BRAND_CANON.letters.Y.split(' — ')[1]}`;
  setTimeout(()=>add('assistant',answer),350);characterMove('curiosity',900);return;
 }
 let room=null;
 if(/\b(office|workshop)\b/i.test(lower))room='workshop';
 else if(/\bgarage\b/i.test(lower))room='garage';
 else if(/\b(bedroom|bed room|your room)\b/i.test(lower))room='bedroom';
 else if(/\b(house|home)\b/i.test(lower)&&/\b(show|take|go|visit|where|what|tour|see|have)\b/i.test(lower))room='house';
 else if(/\b(attic|closet|backyard|yard|basement|library|arcade|observatory|archive)\b/i.test(lower)&&/\b(show|take|go|visit|where|what|tour|see|have)\b/i.test(lower)){
  const key=lower.match(/attic|closet|backyard|yard|basement|library|arcade|observatory|archive/)?.[0];room=key==='yard'?'backyard':key;
 }
 const asksLocation=/\b(where are you|where are we|what room are you in|what room is this|where is bluey)\b/i.test(clean);
 if(asksLocation){
  // Answer where we are; don't move (this used to jump to the Workshop from rooms without objects, like Home).
  add('user',clean);input.value='';
  const answer=typeof currentWorldAnswer==='function'?currentWorldAnswer():"We're right here at Home.";
  setTimeout(()=>add('assistant',answer),300);return;
 }
 const hasRoomIntent=/\b(show|take|go|visit|where|what|tour|see|do you have|tell me about)\b/i.test(lower);
 if(room&&hasRoomIntent){
  add('user',clean);input.value='';blueyStopDepthFlight();enterWorld(room,false);blueyCurrentRoom=room;
  characterMove('travel',1600);blueyPlaySound('travel');
  setTimeout(()=>add('assistant',blueyRoomInvitation(room)),700);return;
 }
 return blueySend37Base(clean);
};

// Tapping a stage object brings Bluey close and gives the user time to explore.
blueyStage37.addEventListener('pointerdown',event=>{
 if(event.target.closest('.bluey-interactive-object'))event.stopPropagation();
},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape')blueyStopDepthFlight()});
