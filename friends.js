// Photos for Ky's friends and family (api/_friends.js): when someone asks about one of them, the
// /api/chat response carries friend {id, photos:[{src, alt, caption}], more} and this shows one of
// those photos under Bluey's reply. The server decides when, so photos only appear for those
// questions. Each ask shows the next photo in the set (remembered per friend in localStorage), and
// when there's more than one, an "Another photo" button flips through them right there. Only files
// from this site's /friends/ folder are shown. Loaded after pictures.js, before offers.js.
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
const KEY='bluey-friend-photo-';
function nextIndex(id,n){
 let i=-1;try{i=parseInt(localStorage.getItem(KEY+id),10)}catch(_){}
 i=Number.isInteger(i)?(i+1)%n:0;
 try{localStorage.setItem(KEY+id,String(i))}catch(_){}
 return i;
}

const previousAdd=add;
add=function(role,text){
 previousAdd(role,text);
 if(role!=='assistant')return;
 const chat=lastChat;lastChat=null;
 const f=chat?.friend;
 const photos=(Array.isArray(f?.photos)?f.photos:[f?.photo]).filter(p=>p&&safeSrc(p.src));
 if(!photos.length||chat.reply!==text)return;
 const id=String(f.id||'friend').replace(/[^a-z0-9-]/gi,'');
 let at=nextIndex(id,photos.length);
 const fig=document.createElement('figure');fig.className='bluey-friend-photo';
 const img=document.createElement('img');img.decoding='async';
 const cap=document.createElement('figcaption');
 const show=()=>{const p=photos[at];img.src=safeSrc(p.src);img.alt=String(p.alt||'');cap.firstChild.textContent=String(p.caption||'')};
 cap.append(document.createElement('span'));
 img.addEventListener('error',()=>{if(photos.length<2)fig.remove()});
 img.addEventListener('load',()=>{messages.scrollTop=messages.scrollHeight});
 if(photos.length>1){
  const btn=document.createElement('button');btn.type='button';btn.className='bluey-friend-next';btn.textContent='Another photo ↻';
  btn.addEventListener('click',()=>{at=(at+1)%photos.length;try{localStorage.setItem(KEY+id,String(at))}catch(_){}show()});
  cap.append(btn);
 }
 show();
 fig.append(img,cap);
 // Under this reply's Copy / Play again row, like the Wikipedia pictures.
 let anchor=null;
 for(let el=messages.lastElementChild;el;el=el.previousElementSibling){if(el.classList.contains('msg'))break;if(el.classList.contains('bluey-pictures')||el.classList.contains('bluey-sources')||el.classList.contains('bluey-reply-actions')){anchor=el;break}}
 (anchor||messages.lastElementChild).after(fig);
 messages.scrollTop=messages.scrollHeight;
};
})();
