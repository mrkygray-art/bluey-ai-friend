// Add Bluey to the home screen (like NightAgent and PicTalk).
// - Registers sw.js (manifest.webmanifest + icons/ make the app installable).
// - Adds "Add Bluey to your home screen" to the blue + menu (controls.js), only when Bluey isn't
//   already installed and the browser can install it (Chrome's own offer), it's a phone, or it's
//   an iPhone/iPad. Chrome gets its real install dialog; everything else (every iPhone browser,
//   Firefox, DuckDuckGo, Samsung Internet) opens install-help.js: numbered steps with pictures of
//   the real buttons, matched to the browser (Safari's ⋯ menu, then Share, Add to Home Screen).
// - iPhones never offer to install on their own, so from the second visit Bluey shows a small,
//   one-time "Make Bluey an app" card; "Not now" or "Show me" means it never appears again.
// - With no signal, the status line says so instead of a confusing error.
(function(){
'use strict';
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))
 addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(e=>console.warn('Bluey offline support is unavailable.',e)));

const help=window.installHelp;
const installed=help?help.isInstalled():matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=!!help?.isIOS;
const phone=matchMedia('(pointer: coarse)').matches;
const ACCENT='#0a78c2';

let offer=null,item=null;
function guide(){if(help)help.open('Bluey',{accent:ACCENT})}
function build(){
 const menu=document.querySelector('.bluey-plus-menu');if(!menu||item)return;
 item=document.createElement('button');item.type='button';item.className='bluey-plus-item bluey-install';
 const i=document.createElement('span');i.className='bluey-plus-icon';i.setAttribute('aria-hidden','true');i.textContent='📲';
 const t=document.createElement('span');t.className='bluey-plus-text';t.textContent='Add Bluey to your home screen';
 const s=document.createElement('small');s.textContent='Opens like an app, from his own icon';t.append(s);
 item.append(i,t);
 const first=menu.querySelector('.bluey-plus-head');menu.insertBefore(item,first);
 item.addEventListener('click',async()=>{
  menu.hidden=true;document.querySelector('.bluey-plus-toggle')?.setAttribute('aria-expanded','false');
  if(offer){const e=offer;offer=null;e.prompt();await e.userChoice.catch(()=>null);show();return}
  guide();
 });
 show();
}
function show(){if(item)item.hidden=installed||!(offer||phone||ios)}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();offer=e;show()});
addEventListener('appinstalled',()=>{offer=null;if(item)item.hidden=true;document.querySelector('.bluey-install-nudge')?.remove()});
build();
document.addEventListener('DOMContentLoaded',build);

// One-time nudge on iPhone/iPad, from the second visit.
const NUDGE='bluey-install-nudge',VISITS='bluey-visits';
function nudge(){
 if(!ios||installed||!help)return;
 let visits=0;try{visits=Number(localStorage.getItem(VISITS)||0)+1;localStorage.setItem(VISITS,String(visits));if(localStorage.getItem(NUDGE)||visits<2)return}catch(_){return}
 const done=()=>{try{localStorage.setItem(NUDGE,'done')}catch(_){}card.remove()};
 const card=document.createElement('div');card.className='bluey-install-nudge';card.setAttribute('role','status');
 const text=document.createElement('span');text.className='bluey-install-nudge-text';
 const strong=document.createElement('strong');strong.textContent='Make Bluey an app on your iPhone';
 text.append(strong,document.createTextNode(' Open him from his own icon, full screen.'));
 const yes=document.createElement('button');yes.type='button';yes.className='is-yes';yes.textContent='Show me';
 const no=document.createElement('button');no.type='button';no.textContent='Not now';
 yes.addEventListener('click',()=>{done();guide()});no.addEventListener('click',done);
 card.append(text,yes,no);
 (document.getElementById('bluey-practice-bar')||document.getElementById('bluey-doc-tray')||form).before(card);
}
addEventListener('load',()=>setTimeout(nudge,2500));

const note=(text,ms)=>{if(typeof tempStatus==='function')tempStatus(text,ms)};
addEventListener('offline',()=>note('No signal right now. I’ll be ready as soon as you’re back online.',6000));
addEventListener('online',()=>note('Back online. What should we do?',3000));
if(!navigator.onLine)addEventListener('load',()=>setTimeout(()=>note('No signal right now. I’ll be ready as soon as you’re back online.',6000),1200));
})();
