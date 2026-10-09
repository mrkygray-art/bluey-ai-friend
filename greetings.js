// Fun, varied hello lines in Bluey's voice. Replaces the five plain returning greetings
// and the single first-meeting intro in index.html. index.html calls blueyFirstMeet /
// blueyReturningMeet 420 ms after load, so redefining them here (loaded at the end of
// <body>) takes effect. Time-of-day lines are left to the status line (blueyTimeRitual),
// so the greeting and the status never both say "Good morning".
// The greeting on screen goes with every /api/chat request (`greeting`), so when a line
// promises something ("I had a thought just for you", "I found a beautiful 404 page"),
// Bluey's brain knows and delivers it instead of saying he has nothing saved.
(function(){
'use strict';
const RETURNING=[
 "Oh! You're back! I was just reorganizing my marbles. Again.",
 "Hey you! Pixel One says hi. Well, it blinked. That counts.",
 "There you are! I've been keeping an eye on the printer.",
 "Welcome back! I did seven laps of the stage waiting for you.",
 "Oh hey! I found a beautiful 404 page today. Ask me later.",
 "You're back! Quick, before the magnets notice.",
 "Hi again! I saved you a triangle. My favorite shape.",
 "Oh good, it's you. Want to make something?",
 "Hey hey! I'm ready. I'm always ready. I'm a sphere.",
 "Back already? Best news I've had all day.",
 "Hello again! I polished my shine for this.",
 "Oh! Hi! I was just practicing my bounce.",
 "There you are! I was starting to count marbles out loud.",
 "Welcome back! The Archive missed you. It said so. Quietly.",
 "Hey! I've got curiosity, snacks, and zero opinions on printers. Kidding.",
 "Look who it is! My favorite visitor.",
 "Hi! I was rolling in circles. Literally. It's my thing.",
 "You came back! Pixel One owes me a marble.",
 "Oh hello! I just finished staring at a very interesting cloud.",
 "Hey! Let's do something great. Or something small. Both count.",
 "Welcome back! I kept your spot warm. Well, glowy.",
 "Hi there! I've been practicing my wise-orb face. How's it look?",
 "There you are! I had a thought just for you. Ask me what it is!",
 "Ooh, a visitor! Hang on, let me look casual.",
 "Hey! I checked: the magnets are still suspicious. All good otherwise.",
 "Oh! Perfect timing. I just ran out of things to wonder about.",
 "Hi again! What are we figuring out today?",
 "You're back! I'd do a cartwheel, but, well, sphere.",
 "Welcome back! The Workshop lights are on and I'm ready to tinker.",
 "Hello, friend! I have exactly one plan: help you with yours."
];
const DAY_LINES={
 1:["Happy Monday! I brought extra glow to get us going.","Monday! Let's make it a gentle one."],
 5:["It's Friday! I can feel it in my glow.","Friday! Let's wrap things up and go do something fun."],
 6:["Happy Saturday! Even orbs like a slow morning.","Weekend mode: on. What sounds fun today?"],
 0:["Happy Sunday! A great day for a little rabbit hole.","Sunday! Big plans or cozy plans?"]
};
const BIRTHDAY_LINES=["Happy Digital Day to me! July 4th, the night I first lit up. 🎆","It's my Digital Day! The whole sky is throwing me a party. Technically it's for someone else, but I'll take it.","July 4th! One blue spark, one lonely pixel, and here I am. Is the cake blue? Please say blue."];
const FIRST_INTROS=["Hi! I'm Bluey. 💙","Hi! I'm Bluey. Nice to meet you! 💙","Hi! I'm Bluey, your new blue friend. 💙","Hi! I'm Bluey. Round, blue, and here to help. 💙"];
const RECENT_KEY='bluey-greeting-recent';
const pick=list=>list[Math.floor(Math.random()*list.length)];

function recent(){try{const r=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(r)?r:[]}catch(_){return[]}}
function remember(line){try{localStorage.setItem(RECENT_KEY,JSON.stringify([line,...recent().filter(x=>x!==line)].slice(0,8)))}catch(_){}}

// Ky (creator.js noted that the server recognized him, signed in on his own account) gets his own hellos. Cosmetic only:
// what Bluey believes is decided on the server.
const CREATOR_LINES=[
 "K.Y.! You're back. I kept the sticky note safe.",
 "The builder returns! Pixel One, look sharp.",
 "Hi Ky! Want to see what I learned since you last tinkered?",
 "Ky! I've been practicing. Ask me anything.",
 "Welcome back, Ky. Everything's still round and blue over here.",
 "Hey, creator! The Workshop lights are on."
];
function returningLine(){
 if(window.blueyIsCreator&&blueyIsCreator()){const seen=recent(),pool=CREATOR_LINES.filter(x=>!seen.includes(x)),line=pick(pool.length?pool:CREATOR_LINES);remember(line);return line}
 const now=new Date();
 if(now.getMonth()===6&&now.getDate()===4)return pick(BIRTHDAY_LINES);
 const seen=recent();
 const day=DAY_LINES[now.getDay()]||[];
 // About one visit in four gets a day-of-the-week line, when there is one.
 const pool=(day.length&&Math.random()<.25?day:RETURNING).filter(x=>!seen.includes(x));
 const line=pick(pool.length?pool:RETURNING);
 remember(line);
 return line;
}

blueyFirstMeet=function(){
 if(!blueyOrb)return;
 blueyOrb.classList.remove('bluey-idle');
 blueyOrb.classList.add('bluey-meeting');
 blueySetHeroGreeting("Oh! Hi there...");
 const intro=pick(FIRST_INTROS);
 setTimeout(()=>{
  // blueySetHeroGreeting finds the greeting by its default text, so set it directly here.
  const el=document.querySelector('.stage-copy>.greeting');if(el)el.textContent=intro;
 },950);
 setTimeout(()=>{
  if(typeof tempStatus==='function')tempStatus("You can talk to me or type whenever you want. What should we do first?",9000);
  blueyOrb.classList.remove('bluey-meeting');
  setBlueyState('warm');
 },1850);
 try{localStorage.setItem(BLUEY_MET_KEY,'yes')}catch(_){}
};

const blueyFetchBeforeGreeting=window.fetch;
window.fetch=function(resource,init){
 const url=typeof resource==='string'?resource:resource?.url||'';
 const shown=(document.querySelector('.stage-copy>.greeting')?.textContent||'').trim();
 if(shown&&/\/api\/chat(\?|$)/.test(url)&&typeof init?.body==='string'){
  try{const body=JSON.parse(init.body);body.greeting=shown.slice(0,200);init={...init,body:JSON.stringify(body)}}catch(_){}
 }
 return blueyFetchBeforeGreeting.call(this,resource,init);
};

blueyReturningMeet=function(){
 if(!blueyOrb)return;
 blueyOrb.classList.remove('bluey-idle');
 blueyOrb.classList.add('bluey-recognize');
 blueySetHeroGreeting(returningLine());
 setTimeout(()=>{blueyOrb.classList.remove('bluey-recognize');setBlueyState('idle')},1450);
};
})();
