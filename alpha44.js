// Bluey Alpha 44 — Release Candidate QA Guardrails V1
// Feature freeze layer: diagnostics, world integrity checks, and regression visibility.
(function(){
'use strict';
if(window.BlueyCharacter)window.BlueyCharacter.version='1.0-alpha44-rc1';
if(window.blueyAbout)window.blueyAbout.version='1.0-alpha44-rc1';
const EXPECTED=['home','observatory','garage','arcade','workshop','beach','forest','museum','aquarium','quiet','edge'];
function report(){
 const world=window.BlueyWorldStandard;
 const rooms=world?.rooms||{};
 const checks={
  worldEngine:!!world,
  relationshipMemory:!!window.BlueyRelationshipMemory,
  objectContinuity:!!window.BlueyObjectContinuity,
  mobileStage:!!window.BlueyMobileStage,
  sendFunction:typeof window.send==='function',
  enterWorldFunction:typeof window.enterWorld==='function',
  renderObjectsFunction:typeof window.renderInteractiveObjects==='function',
  stage:!!window.blueyStage37,
  missingRooms:EXPECTED.filter(r=>!rooms[r]),
  emptyPrimaryRooms:['observatory','garage','arcade','workshop','beach','forest','museum','aquarium'].filter(r=>!(rooms[r]?.objects?.length)),
  currentWorld:window.blueyWorld||null,
  currentObjectCount:Array.isArray(window.blueyVisibleObjects)?window.blueyVisibleObjects.length:0
 };
 checks.pass=checks.worldEngine&&checks.relationshipMemory&&checks.objectContinuity&&checks.sendFunction&&checks.enterWorldFunction&&checks.renderObjectsFunction&&checks.stage&&!checks.missingRooms.length&&!checks.emptyPrimaryRooms.length;
 return checks;
}
function smoke(){
 const r=report();
 console.group('[Bluey Alpha 44 RC] smoke test');
 Object.entries(r).forEach(([k,v])=>console.log(k,v));
 console.groupEnd();
 return r;
}
function worldAudit(){
 const rooms=window.BlueyWorldStandard?.rooms||{};
 return Object.fromEntries(Object.entries(rooms).map(([name,cfg])=>[name,{objects:(cfg.objects||[]).map(o=>({id:o.id,title:o.title,names:o.names||[]})),objectCount:(cfg.objects||[]).length}]));
}
window.BlueyReleaseCandidate={version:'44-RC1',report,smoke,worldAudit,featureFreeze:true};
setTimeout(()=>{const r=smoke();if(!r.pass)console.warn('[Bluey Alpha 44 RC] Release blocker detected',r);else console.info('[Bluey Alpha 44 RC] Core integrity PASS');},1200);
})();