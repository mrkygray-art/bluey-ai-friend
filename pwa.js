// Add Bluey to the home screen (like NightAgent and PicTalk).
// - Registers sw.js (manifest.webmanifest + icons/ make the app installable).
// - Adds "Add Bluey to your home screen" to the blue + menu (controls.js), only when Bluey isn't
//   already installed and the browser can install it (Chrome's own offer) or it's a phone.
//   Chrome gets its real install dialog; Firefox, DuckDuckGo, Samsung Internet, and Safari
//   don't offer one, so the item shows that browser's steps instead.
// - With no signal, the status line says so instead of a confusing error.
(function(){
'use strict';
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))
 addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(e=>console.warn('Bluey offline support is unavailable.',e)));

const installed=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const phone=matchMedia('(pointer: coarse)').matches,ua=navigator.userAgent;
const steps=/DuckDuckGo/.test(ua)?'Tap the ⋮ menu, then “Add to Home Screen.”':
 /iPhone|iPad/.test(ua)?'Tap the Share button (the square with an arrow), then “Add to Home Screen.”':
 /Firefox|FxiOS/.test(ua)?'Tap the ⋮ menu, then “Add app to Home screen” (it may say “Install”).':
 /SamsungBrowser/.test(ua)?'Tap the ☰ menu, then “Add page to” and “Home screen.”':
 'Tap the ⋮ menu, then “Add to Home screen” or “Install app.”';

let offer=null,item=null,help=null;
function build(){
 const menu=document.querySelector('.bluey-plus-menu');if(!menu||item)return;
 item=document.createElement('button');item.type='button';item.className='bluey-plus-item bluey-install';item.setAttribute('aria-expanded','false');
 const i=document.createElement('span');i.className='bluey-plus-icon';i.setAttribute('aria-hidden','true');i.textContent='📲';
 const t=document.createElement('span');t.className='bluey-plus-text';t.textContent='Add Bluey to your home screen';
 const s=document.createElement('small');s.textContent='Opens like an app, from his own icon';t.append(s);
 item.append(i,t);
 help=document.createElement('p');help.className='bluey-install-help';help.hidden=true;
 const first=menu.querySelector('.bluey-plus-head');menu.insertBefore(item,first);menu.insertBefore(help,first);
 item.addEventListener('click',async()=>{
  if(offer){const e=offer;offer=null;e.prompt();await e.userChoice.catch(()=>null);show();return}
  help.textContent=steps+' Then Bluey opens from his own blue icon, like an app.';
  help.hidden=!help.hidden;item.setAttribute('aria-expanded',String(!help.hidden));
 });
 show();
}
function show(){if(!item)return;const hide=installed||!(offer||phone);item.hidden=hide;if(hide)help.hidden=true}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();offer=e;show()});
addEventListener('appinstalled',()=>{offer=null;if(item){item.hidden=true;help.hidden=true}});
build();
document.addEventListener('DOMContentLoaded',build);

const note=(text,ms)=>{if(typeof tempStatus==='function')tempStatus(text,ms)};
addEventListener('offline',()=>note('No signal right now. I’ll be ready as soon as you’re back online.',6000));
addEventListener('online',()=>note('Back online. What should we do?',3000));
if(!navigator.onLine)addEventListener('load',()=>setTimeout(()=>note('No signal right now. I’ll be ready as soon as you’re back online.',6000),1200));
})();
