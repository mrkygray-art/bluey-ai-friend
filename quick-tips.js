// Quick tips: a small "? Tips" pill next to New chat opens a short card of how-to tips in
// Bluey's voice (talk by tapping him, type, the blue + menu, the 💡, steering a draft).
// Not a tour: nothing dims the screen or points at buttons, and it only opens when tapped.
// The first-visit line in greetings.js says how to talk ("Tap me to talk…"), so most people
// never need the card. Keep the tips true to the app: if a button or menu item is renamed,
// update the text here too.
(function(){
'use strict';
const tools=document.querySelector('.bluey-session-tools');
if(!tools)return;

const TIPS=[
 ['🔵','Talk to me','Tap me (the blue ball) and start talking. Tap me again when you’re done, and I’ll send it.'],
 ['⌨️','Or type','Write in the box at the bottom and tap Send. Long text and pasted documents are fine.'],
 ['+','The blue + menu','Add photos and files, or take a photo. It also has: Check a message for scams, Practice a tough talk, Easier to use (bigger text, a slower voice, simpler words), What Bluey remembers, and my Voice and Sound switches.'],
 ['💡','The light bulb','When a 💡 shows up under your message, tap it. I’ll show you a way to ask that gets an even better answer.'],
 ['✨','After I answer','Under something I wrote for you, tap Shorter, Warmer, or More specific to change it. New chat starts fresh.'],
];

const pill=document.createElement('button');
pill.type='button';pill.className='bluey-tips-pill';
pill.setAttribute('aria-haspopup','dialog');pill.setAttribute('aria-label','Quick tips: how to use Bluey');
pill.innerHTML='<span aria-hidden="true">?</span> Tips';
tools.prepend(pill);
// A soft yellow glow until the first tap, so new visitors notice it; then it's a plain pill
const SEEN='bluey-tips-seen';
let seen=false;try{seen=localStorage.getItem(SEEN)==='yes'}catch(_){}
if(!seen)pill.classList.add('is-new');

const shade=document.createElement('div');shade.className='bluey-tips-shade';shade.hidden=true;
const card=document.createElement('section');card.className='bluey-tips-card';
card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-labelledby','bluey-tips-title');
const head=document.createElement('div');head.className='bluey-tips-head';
const title=document.createElement('h2');title.id='bluey-tips-title';title.textContent='Quick tips';
const x=document.createElement('button');x.type='button';x.className='bluey-tips-x';x.setAttribute('aria-label','Close tips');x.textContent='×';
head.append(title,x);
const list=document.createElement('ul');list.className='bluey-tips-list';
for(const [icon,name,text] of TIPS){
 const li=document.createElement('li');
 const i=document.createElement('span');i.className='bluey-tips-icon'+(icon==='+'?' is-plus':'');i.setAttribute('aria-hidden','true');i.textContent=icon; // the + looks like the real button
 const t=document.createElement('div');
 const b=document.createElement('strong');b.textContent=name;
 const p=document.createElement('p');p.textContent=text;
 t.append(b,p);li.append(i,t);list.append(li);
}
const done=document.createElement('button');done.type='button';done.className='bluey-tips-done';done.textContent='Got it';
card.append(head,list,done);shade.append(card);document.body.append(shade);

function open(){if(pill.classList.contains('is-new')){pill.classList.remove('is-new');try{localStorage.setItem(SEEN,'yes')}catch(_){}}shade.hidden=false;document.body.classList.add('bluey-tips-open');done.focus({preventScroll:true})}
function close(){if(shade.hidden)return;shade.hidden=true;document.body.classList.remove('bluey-tips-open');pill.focus({preventScroll:true})}
pill.addEventListener('click',open);
x.addEventListener('click',close);
done.addEventListener('click',close);
shade.addEventListener('click',e=>{if(e.target===shade)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
window.blueyTips={open,close};
})();
