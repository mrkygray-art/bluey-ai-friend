// Brain first: real requests always reach Bluey's brain (/api/chat).
//
// The older layers (alpha9…alpha45 and index.html) wrap send() with ~50 keyword checks that
// answer locally with canned lines: favorite color, room travel, lore, "thanks", printer jokes…
// They're fun for short playful messages, but their unanchored keyword matches also caught
// real requests: a long message mentioning "browser/device" got the canned compatibility
// speech, "my printer says offline" got a printer joke, "please verify this" was dropped
// without ever being sent, and a long request ending in "thanks!" got "Anytime."
//
// This layer must run first. alpha40.js loads alpha41-46 (and alpha47) after the page starts,
// and they wrap send() again, so the guard re-checks every 300 ms and puts a fresh guard on
// the outside whenever another layer has wrapped it. A message that looks like a real request goes
// straight to the brain (keeping the file and photo routes from alpha7.js); short playful
// messages still go through the old chain, so "what's your favorite color?", "take me to the
// library", and "thanks!" keep their fun answers.
(function(){
'use strict';
const TASK=/\b(my|our|help|write|draft|make|create|fix|plan|explain|summari[sz]e|compare|verify|double-check|check|translate|calculate|list|need|want|please|can you|could you|would you|how (do|can|should|would) (i|we)|email|text|letter|report|code|error|actually|instead|change|rewrite|rephrase|shorter|warmer|formal|casual|simpler|bullet)\b/i;

// Short messages where a canned line would lose what the person meant. Lore questions aimed
// at Bluey himself ("do you like printers?", "are you afraid of anything?") stay playful.
const ALWAYS=[
 /\b(verify|double-check|fact-check|check (this|that|it)|is (this|that|it) (right|correct|true)|try again|that'?s (wrong|not it|not right|incorrect)|not what i (wanted|meant)|missed the point|i don'?t like (it|that|this)|compare|versus|vs\.?|resume|cover letter)\b/i,
 /\bwhere am i (going|getting) wrong\b/i
];
const ALWAYS_UNLESS_ABOUT_BLUEY=[
 [/\bprinters?\b/i,/\b(offline|jam|jammed|error|won'?t|not working|broken|connect|ink|paper)\b/i],
 [/\bspace\b/i,null],
 [/\b(fear|scared|afraid)\b/i,null],
 [/\bfor fun\b/i,null]
];
function isRealRequest(t){
 const words=t.split(/\s+/).filter(Boolean).length;
 const sentences=(t.match(/[.!?](\s|$)/g)||[]).length;
 if(words>10||sentences>1||/\n/.test(t)||TASK.test(t)||ALWAYS.some(r=>r.test(t)))return true;
 const aboutBluey=/\b(you|your|bluey)\b/i.test(t)||/\b(outer space|in space|space travel|favorite planet)\b/i.test(t);
 return ALWAYS_UNLESS_ABOUT_BLUEY.some(([topic,problem])=>topic.test(t)&&(problem?problem.test(t):!aboutBluey));
}

// Same steps as the original send in index.html, but a friendly server message (hourly
// limit, answer too long) is shown instead of the generic "having trouble" line.
async function askBrain(text){
 detectQuietIntent(text);touchActivity();add('user',text);history.push({role:'user',content:text});input.value='';behavior('thinking');statusEl.textContent='Thinking…';
 try{
  const r=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:history.slice(-20)})});
  let d={};try{d=await r.json()}catch(_){}
  if(!r.ok){const e=new Error(d.error||'Request failed');e.friendly=r.status===429||/^That answer got too long/.test(d.error||'');throw e}
  statusEl.textContent='';add('assistant',d.reply);history.push({role:'assistant',content:d.reply});behavior(d.behavior);speak(d.reply,d.behavior);
  if(d.spellingSuggestion&&window.blueyShowSuggestion)window.blueyShowSuggestion(d.spellingSuggestion);
 }catch(e){
  console.error('Bluey chat error:',e);
  statusEl.textContent=e.friendly?e.message:"I'm having trouble answering right now. Let's try again in a moment.";
  behavior('unsure');
 }
}

function install(){
 const sendThroughOldLayers=send;
 const guard=async function(text){
  const clean=String(text||'').trim();
  if(!clean||(typeof blueyWorkshopActive!=='undefined'&&blueyWorkshopActive)||!isRealRequest(clean))return sendThroughOldLayers(text);
  // A real request also ends any little local game, story, or object chat.
  blueyStory=null;blueyGame=null;blueyObjectFocus=null;
  const format=blueyDocumentFormat(clean);
  if(format)return blueyCreateDocument(clean,format,blueyPhotos.length?blueyPhotos:blueyRecentPhotos);
  const mentionsPhoto=/\b(photo|picture|image|attached|these|this|those)\b/i.test(clean);
  const photos=blueyPhotos.length?blueyPhotos:(mentionsPhoto?blueyRecentPhotos:[]);
  if(photos.length)return blueyChatWithPhotos(clean,photos);
  return askBrain(clean);
 };
 guard.blueyBrainFirst=true;
 send=guard;
}
install();
setInterval(()=>{if(!send.blueyBrainFirst)install()},300);
})();
