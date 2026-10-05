// Alpha 39 — compatibility fallbacks and a dependable answer about Bluey's reach.
if(window.BlueyCharacter)window.BlueyCharacter.version='1.0-alpha39';
if(window.blueyAbout)window.blueyAbout.version='1.0-alpha39';

// requestSubmit is missing in a few older embedded WebViews. Keep keyboard send usable.
if(typeof form.requestSubmit!=='function'){
 form.requestSubmit=function(){
  const event=document.createEvent('Event');
  event.initEvent('submit',true,true);
  const notCancelled=form.dispatchEvent(event);
  if(notCancelled)form.submit();
 };
}

const blueySendBeforeCompatibilityKnowledge=send;
const blueyCompatibilityQuestion=/\b(browser|browsers|iphone|ipad|android|safari|chrome|firefox|duckduckgo|device|devices|what can you do|what do you work with|what can you help with)\b/i;
send=async function(text){
 const question=String(text||'').trim();
 if(blueyCompatibilityQuestion.test(question)&&/\b(work|works|use|support|compatible|run|platform|device|browser|do|help|capable|features)\b/i.test(question)){
  detectQuietIntent(question);touchActivity();add('user',question);history.push({role:'user',content:question});input.value='';
  const answer="I’m designed for recent browsers on iPhone, Android, Windows, and Mac—including Safari, Chrome, Firefox, and DuckDuckGo Browser. I can chat, help shape prompts, look at uploaded or pasted pictures, and create Excel, Word, or PDF files. I can speak or listen when voice services are available and your browser grants audio or microphone permission. On a phone, Add photos is the dependable way to attach a picture if clipboard paste isn’t available. My chat history currently stays in this browser; account sign-in and cross-device memory aren’t connected yet.";
  add('assistant',answer);history.push({role:'assistant',content:answer});behavior('explaining');
  if(typeof blueyVoiceOn==='undefined'||blueyVoiceOn)speak(answer,'explaining');
  if(typeof blueyPlaySound==='function')blueyPlaySound('reply');
  return;
 }
 return blueySendBeforeCompatibilityKnowledge(question);
};
