// Brain first: every message reaches Bluey's brain (/api/chat), except the few things only
// the app itself can do.
//
// The older layers (alpha9…alpha45 and index.html) wrap send() with ~50 keyword checks that
// answer locally with canned lines: favorite color, lore, "thanks", printer jokes, coaching…
// Their keyword matches also caught real requests (a message mentioning "browser/device" got
// a canned speech, "please verify this" was never sent). The brain already knows Bluey's lore
// and product facts (api/chat.js), so canned text isn't needed. Messages stay with the old
// layers only for app actions the brain can't perform:
//   - moving between rooms ("take me to the library", "go home", "can we go to the arcade?")
//   - stage objects ("tell me about the lamp", "where did the welcome mat go?")
//   - the built-in story and guessing games, and replies while one is running
//   - dancing, and "where are we?" (only the app knows the current room)
//   - photo-only messages
// A message sent with a newly added file (files.js) always goes to the brain, and Send with
// only a file sends "Please take a look at this." so Bluey sums it up and asks what you need.
// During a practice talk (practice.js) every line goes to the brain, so "can we meet at the office?"
// stays part of the role-play instead of becoming room travel.
// Anything with task words (my, help, write, please…) goes to the brain even if it names a room
// ("go home and finish my lab report").
//
// alpha40.js loads alpha41-47 after the page starts and they wrap send() again, so the guard
// re-checks every 300 ms and puts a fresh guard on the outside whenever another layer has
// wrapped it. Document and photo routes from alpha7.js are kept.
(function(){
'use strict';
const TASK=/\b(my|our|help|write|draft|make|create|fix|plan|explain|summari[sz]e|compare|verify|double-check|check|translate|calculate|list|need|want|please|can you|could you|would you|how (do|can|should|would) (i|we)|email|text|letter|report|code|error|actually|instead|change|rewrite|rephrase|shorter|warmer|formal|casual|simpler|bullet|scam|scams|fraud|phishing|legit|suspicious)\b/i;
const ROOMS=String.raw`home|house|library|workshop|office|lab|observatory|telescope|arcade|archive|garage|attic|closet|bedroom|your room|backyard|yard|basement|quiet place|the edge|edge|beach|ocean|sea|forest|woods|museum|gallery|aquarium|city|space|the moon|moon|stars`;
const TRAVEL=new RegExp(String.raw`\b(take me|take us|bring me|go|go back|let'?s go|can we go|could we go|head|zip|visit|travel|show me|back)\b.*\b(${ROOMS})\b`,'i');
const GO_HOME=/^(go|come|back|take me|let'?s go|zip)( back)?( to)? home[.!?]*$/i;
const WHERE=/^(where are (we|you)|what room is this|what place is this)[?.!]*$/i;
const GAMES=/\b(tell me a story|tell us a story|story mode|mystery object|play mystery|guessing game)\b/i;
const DANCE=/\b(dance for me|do a dance|show me your moves)\b/i;
const OBJECT_ALIASES=['welcome mat','doormat','door mat','mat','idea lamp','lamp','marble jar','marbles','marble','leaf','quiet leaf','hourglass','sand timer','timer','edge light','little light','edge marker','marker'];
const hasWord=(text,word)=>new RegExp('(^|[^a-z0-9])'+String(word).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(s|es)?($|[^a-z0-9])','i').test(text);
function objectNames(){
 const names=[...OBJECT_ALIASES];
 try{for(const list of Object.values(BLUEY_OBJECTS))for(const o of list||[])names.push(...(o.names||[]))}catch(_){}
 document.querySelectorAll('.bluey-item-label').forEach(el=>{const t=(el.textContent||'').trim();if(t)names.push(t.replace(/^bluey'?s\s+/i,''))});
 return names.filter(n=>n&&n.length>2);
}
const wordCount=t=>t.split(/\s+/).filter(Boolean).length;

// True only for the app actions listed at the top; everything else goes to the brain.
function isLocalAction(t){
 if(WHERE.test(t)||GO_HOME.test(t))return true;
 const realRequest=TASK.test(t)||wordCount(t)>10;
 const playing=(typeof blueyStory!=='undefined'&&blueyStory)||(typeof blueyGame!=='undefined'&&blueyGame);
 if(playing)return !realRequest; // game replies stay local; a real request ends the game
 if(realRequest)return false;
 if(GAMES.test(t)&&!/\b(about|with|for)\b/i.test(t))return true; // "tell me a story about my dog" goes to the brain
 if(DANCE.test(t)||TRAVEL.test(t))return true;
 if(typeof blueyObjectFocus!=='undefined'&&blueyObjectFocus&&wordCount(t)<=6)return true; // follow-up on a tapped object
 return objectNames().some(n=>hasWord(t,n));
}

// Same steps as the original send in index.html, but a friendly server message (hourly
// limit, answer too long) is shown instead of the generic "having trouble" line.
async function askBrain(text){
 detectQuietIntent(text);touchActivity();add('user',text);history.push({role:'user',content:text});input.value='';behavior('thinking');statusEl.textContent='Thinking…';
 try{
  const r=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:history.slice(-20)})});
  let d={};try{d=await r.json()}catch(_){}
  if(!r.ok){const e=new Error(d.error||'Request failed');e.friendly=r.status===429||r.status===413||/^That answer got too long/.test(d.error||'');throw e}
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
  const newFile=!!(window.blueyDocsPending&&blueyDocsPending());
  const clean=String(text||'').trim()||(newFile?'Please take a look at this.':'');
  if(!clean||(!newFile&&!(window.blueyPracticeActive&&blueyPracticeActive())&&isLocalAction(clean)))return sendThroughOldLayers(text);
  // Going to the brain also ends any little local game, story, or object chat.
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
