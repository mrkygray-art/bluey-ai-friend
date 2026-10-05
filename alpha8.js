// Alpha 8: the stage is Bluey's world, and his movement helps the conversation.
const blueyStage=document.querySelector('.stage');
const blueyRig=document.querySelector('.rig');
let blueyStageLastActivity=Date.now(),blueyParkedUntil=0,blueyWanderTimer=null,blueyWanderEnd=null;
const blueySceneSelector='.bluey-prop,.bluey-interactive-object,.bluey-work-chip,.bluey-world-object,.bluey-world-bit,.bluey-marble,.bluey-pixel-one,.bluey-starfield,.bluey-edge-mark';
function blueyMoveSceneNode(node){
 if(!(node instanceof Element))return;
 if(node.matches(blueySceneSelector)&&node.parentElement!==blueyStage)blueyStage.appendChild(node);
 node.querySelectorAll?.(blueySceneSelector).forEach(child=>{if(child.parentElement!==blueyStage)blueyStage.appendChild(child)});
}
document.querySelectorAll(blueySceneSelector).forEach(blueyMoveSceneNode);
const blueyStageObserver=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(blueyMoveSceneNode)));
blueyStageObserver.observe(document.body,{childList:true,subtree:true});

function blueyStageActivity({front=false}={}){
 blueyStageLastActivity=Date.now();clearTimeout(blueyWanderTimer);clearTimeout(blueyWanderEnd);
 blueyStage.classList.remove('bluey-stage-wandering');blueyStage.classList.add('bluey-stage-active');
 if(front){
  blueyParkedUntil=Date.now()+8500;blueyRig.classList.remove('bluey-stage-front');void blueyRig.offsetWidth;blueyRig.classList.add('bluey-stage-front');
  if(blueySoundsOn)blueyPlaySound('swoosh');
  statusEl.textContent='Right here! Ready when you are.';setTimeout(()=>{if(statusEl.textContent==='Right here! Ready when you are.')statusEl.textContent=''},2600);
  setTimeout(()=>blueyRig.classList.remove('bluey-stage-front'),2450);
 }else blueyParkedUntil=Math.max(blueyParkedUntil,Date.now()+1800);
 blueyScheduleWander(9000);
}
blueyStage.addEventListener('pointerdown',e=>{
 if(e.target.closest('#bluey-voice,#bluey-sounds,#bluey-attach'))return;
 blueyStageActivity({front:true});
},{passive:true});
blueyStage.addEventListener('pointermove',()=>{blueyStage.classList.add('bluey-stage-active')},{passive:true,once:true});
document.addEventListener('keydown',()=>blueyStageActivity(),{passive:true});
input.addEventListener('input',()=>blueyStageActivity(),{passive:true});

const blueyCharacterMoveAlpha8=characterMove;
characterMove=function(name,ms=1400){
 const moved=blueyCharacterMoveAlpha8(name,ms);
 if(moved){
  blueyStageActivity();
  const kind=/travel|think-trip|overshoot|peek/i.test(name)?'travel':/unsure|uncertain|concern|recovery/i.test(name)?'unsure':/laugh|happy|victory|dance|celebrat|proud/i.test(name)?'happy':/listen|curios|surprise|attention/i.test(name)?'hello':null;
  if(kind)blueyPlaySound(kind);
 }
 return moved;
};
if(window.BlueyCharacter)window.BlueyCharacter.move=characterMove;

function blueyScheduleWander(delay=12000){
 clearTimeout(blueyWanderTimer);
 blueyWanderTimer=setTimeout(()=>{
  if(document.hidden||Date.now()<blueyParkedUntil||characterBusy||statusEl.textContent||('speechSynthesis'in window&&speechSynthesis.speaking))return blueyScheduleWander(4500);
  blueyStage.classList.add('bluey-stage-active','bluey-stage-wandering');
  if(blueySoundsOn)blueyPlaySound('swoosh');
  blueyWanderEnd=setTimeout(()=>{blueyStage.classList.remove('bluey-stage-wandering');blueyScheduleWander(11500)},5300);
 },delay);
}
blueyScheduleWander(9000);
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(blueyWanderTimer);clearTimeout(blueyWanderEnd);blueyStage.classList.remove('bluey-stage-wandering')}else blueyScheduleWander(4000)});

const blueyEnterWorldAlpha8=enterWorld;
enterWorld=function(place,announce=true){
 blueyStageActivity();blueyEnterWorldAlpha8(place,announce);
 requestAnimationFrame(()=>document.querySelectorAll(blueySceneSelector).forEach(blueyMoveSceneNode));
};
