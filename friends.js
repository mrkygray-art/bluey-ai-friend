// Photos for Ky's friends (api/_friends.js): when someone asks about one of them by name, the
// /api/chat response carries friend.photo ({src, alt, caption}) and this shows that photo under
// Bluey's reply. The server decides when, so it only appears for that question. Only files from
// this site's /friends/ folder are shown. Loaded after pictures.js, before offers.js.
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
const safeSrc=s=>/^\/friends\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/i.test(String(s||''))?String(s):'';

const previousAdd=add;
add=function(role,text){
 previousAdd(role,text);
 if(role!=='assistant')return;
 const chat=lastChat;lastChat=null;
 const photo=chat?.friend?.photo,src=safeSrc(photo?.src);
 if(!src||chat.reply!==text)return;
 const fig=document.createElement('figure');fig.className='bluey-friend-photo';
 const img=document.createElement('img');img.src=src;img.alt=String(photo.alt||'');img.decoding='async';
 img.addEventListener('error',()=>fig.remove());
 img.addEventListener('load',()=>{messages.scrollTop=messages.scrollHeight});
 const cap=document.createElement('figcaption');cap.textContent=String(photo.caption||'');
 fig.append(img,cap);
 // Under this reply's Copy / Play again row, like the Wikipedia pictures.
 let anchor=null;
 for(let el=messages.lastElementChild;el;el=el.previousElementSibling){if(el.classList.contains('msg'))break;if(el.classList.contains('bluey-pictures')||el.classList.contains('bluey-sources')||el.classList.contains('bluey-reply-actions')){anchor=el;break}}
 (anchor||messages.lastElementChild).after(fig);
 messages.scrollTop=messages.scrollHeight;
};
})();
