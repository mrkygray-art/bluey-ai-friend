// Things to do together: when Bluey offers choices (hello, "I'm bored", "surprise me", or
// what his greeting promised), api/chat.js returns `offers`: up to three short messages in the
// user's voice ("What's the weather this week?", "Read me a blue poem"). They show as tappable
// buttons under his reply; a tap sends that message, so trying Bluey is one tap away.
// The buttons go away as soon as anything new is sent. Loaded after sources.js.
(function(){
'use strict';
let lastChat=null;
const previousFetch=window.fetch;
window.fetch=async function(resource){
 const url=typeof resource==='string'?resource:resource?.url||'';
 const response=await previousFetch.apply(this,arguments);
 if(/\/api\/chat(\?|$)/.test(url)&&response.ok){try{lastChat=await response.clone().json()}catch(_){lastChat=null}}
 return response;
};
const clear=()=>document.querySelectorAll('.bluey-offers').forEach(el=>el.remove());

const previousAdd=add;
add=function(role,text){
 if(role==='user')clear();
 previousAdd(role,text);
 if(role!=='assistant')return;
 const chat=lastChat;lastChat=null;
 const offers=Array.isArray(chat?.offers)?chat.offers.filter(o=>typeof o==='string'&&o.trim()).slice(0,3):[];
 if(!offers.length||chat.reply!==text)return;
 clear();
 const row=document.createElement('div');row.className='bluey-offers';row.setAttribute('role','group');row.setAttribute('aria-label','Things to try');
 for(const offer of offers){
  const b=document.createElement('button');b.type='button';b.textContent=offer;
  b.addEventListener('click',()=>{clear();if(typeof blueyUnlockPhoneAudio==='function')blueyUnlockPhoneAudio();send(offer)});
  row.appendChild(b);
 }
 messages.appendChild(row);messages.scrollTop=messages.scrollHeight;
};
})();
