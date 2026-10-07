// Pictures from Wikipedia: when someone asks what something looks like, api/chat.js returns
// `pictures` ({query, source, items:[{thumb, title, page, file, credit, license}]}) and this shows
// them as a small grid under Bluey's reply, with each photographer's credit and license. Tapping a
// photo opens its Wikimedia page (full size, full credit). Loaded after sources.js, before offers.js,
// so pictures sit under the Sources list and above any offer buttons.
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
const safeUrl=u=>/^https:\/\/([a-z0-9-]+\.)*(wikipedia|wikimedia)\.org\//i.test(String(u||''))?String(u):'';

const previousAdd=add;
add=function(role,text){
 previousAdd(role,text);
 if(role!=='assistant')return;
 const chat=lastChat;lastChat=null;
 const items=(chat?.pictures?.items||[]).filter(x=>safeUrl(x.thumb)).slice(0,4);
 if(!items.length||chat.reply!==text)return;
 const box=document.createElement('div');box.className='bluey-pictures';
 const head=document.createElement('p');head.className='bluey-pictures-head';
 const article=safeUrl(items[0].page);
 head.append('Pictures of ');
 const name=document.createElement(article?'a':'span');name.textContent=items[0].title;
 if(article){name.href=article;name.target='_blank';name.rel='noopener noreferrer'}
 head.append(name,', from Wikipedia');
 const grid=document.createElement('div');grid.className='bluey-pictures-grid';
 for(const it of items){
  const fig=document.createElement('figure');
  const link=document.createElement('a');link.href=safeUrl(it.file)||article||safeUrl(it.thumb);link.target='_blank';link.rel='noopener noreferrer';
  const img=document.createElement('img');img.src=it.thumb;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
  img.alt=`${it.title}${it.credit?', photo by '+it.credit:''}`;
  img.addEventListener('error',()=>fig.remove());
  link.append(img);
  const cap=document.createElement('figcaption');cap.textContent=[it.credit?'Photo: '+it.credit:'',it.license].filter(Boolean).join(' · ')||'Wikimedia Commons';
  fig.append(link,cap);grid.append(fig);
 }
 box.append(head,grid);
 // Under this reply's Copy / Play again row and its Sources, if any.
 let anchor=null;
 for(let el=messages.lastElementChild;el;el=el.previousElementSibling){if(el.classList.contains('msg'))break;if(el.classList.contains('bluey-sources')||el.classList.contains('bluey-reply-actions')){anchor=el;break}}
 (anchor||messages.lastElementChild).after(box);
 messages.scrollTop=messages.scrollHeight;
};
})();
