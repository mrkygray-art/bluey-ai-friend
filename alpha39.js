// Alpha 39 — compatibility fallback: keyboard send works where form.requestSubmit is missing.
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

// The canned "what browsers and devices do you work on" answer that was here is gone: it was out
// of date (no files, no scam check) and the brain answers it from current product facts.
