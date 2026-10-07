// Alpha 9: object lines, room-visit lines, and fresh-rotation picks for Bluey's stage.
// Lines Bluey adds when you tap or ask about an object on the stage. (The canned topic replies
// that used to live here, like birthday and favorite color, were removed: the brain answers those,
// and some contradicted his current story, like a July 7 birthday.)
const BLUEY_REPLY_BANK={
 objectIntro:[
  "Good eye. ",
  "You spotted it! ",
  "I was hoping someone would ask about that. ",
  "That little thing? ",
  "Aha, you found one of my favorite details. ",
  "Nice question. Here's the short version: ",
  "Let's have a closer look. ",
  "I know this one! Well, I know its story. ",
  "The object in question has entered the conversation. ",
  "I wondered when we'd get to that. ",
  "Curiosity detected. I approve. ",
  "Ooh, good pick. "
 ],
 objectFollowup:[
  "Here's one more layer: ",
  "The interesting bit is this: ",
  "Want the next little piece? ",
  "There's a tiny story tucked in here: ",
  "Let's follow that thread. ",
  "One more clue: ",
  "Okay, down the rabbit hole we go: ",
  "Here is the part that surprised me: "
 ]
};

const BLUEY_ROOM_VISITS={
 arcade:{place:'arcade',lines:["The Arcade! The joystick is ready, the high-score star is suspicious, and I am prepared to lose with dignity.","Welcome to my Arcade. Tap an item up there and I'll tell you its story. I make no promises about the scoreboard.","Arcade time! The controls are in place. My victory dance has been rehearsed; the outcome is still negotiable.","We made it. Pick one of the Arcade objects in the stage and ask me about it. I promise to be only a little competitive.","The Arcade is open! I have a joystick, a star, and several explanations for my last score."]},
 workshop:{place:'workshop',lines:["Welcome to the Workshop. Ideas can arrive messy here; we can sort them out together.","The Workshop! My screen is glowing, Pixel One is supervising, and the printer is safely across the room.","Here we are. Tap one of the Workshop objects in the stage if you want to know what it's for.","My Workshop is part office, part idea garage. Tell me what we're making and we'll get started.","Workshop time. Bring a half-formed idea; I have a very sturdy shelf for those."]},
 library:{place:'library',lines:["The Library! Questions get comfy here. Tap a book in the stage and we'll see where it leads.","Welcome to my Library. There are facts, stories, and at least one book I shelved under 'probably important.'",
  "We're in the Library. Pick an object in the stage or ask me about a topic—no late fees.","The Library is open. I brought curiosity; you bring the question.","A little quiet in here. The Library is a good place to start when a question has a few layers."]},
 archive:{place:'archive',lines:["The Archive. Old files, forgotten buttons, and one loading spinner that insists it's almost done.","Welcome to the Archive. Tap a treasure in the stage; some of these have been waiting years to be asked about.","We're in the Archive! I collect old digital things. I call it history; the hard drive calls it clutter.","The Archive is open. Look at that 404 page—lost, but still doing its best.","Here we are. Please don't wake the ancient loading spinner unless you have a snack ready."]},
 observatory:{place:'observatory',lines:["The Observatory! Let's look up. The universe is enormous, and I brought a very small notebook.","Welcome to the Observatory. Tap the telescope in the stage and we can pick a place to explore.","We're among the stars. I like it here; every answer makes the universe ask a bigger question.","The Observatory is open. Space is showing off again.","A quick trip to the Observatory. The stars did not mind us dropping by."]},
 garage:{place:'garage',lines:["Welcome to my Garage. Tap the wrench or the unfinished wheel in the stage; one is useful and the other is still under discussion.","The Garage! That box is full of mystery, the wheel is a work in progress, and the wrench looks more confident than I feel.","Here we are. My Garage is where prototypes and questions both get a little dusty.","The Garage is open. Please do not ask the wheel when it will be finished; it gets sensitive."]},
 attic:{place:'attic',lines:["The Attic. Old digital things come up here when I am not quite ready to say goodbye to them.","Welcome upstairs. Everything in the Attic has a story, even the box labeled 'mystery, probably.'","The Attic is full of forgotten files and memories. I was going to organize them. Then I found another one.","A little dusty up here. The Attic stores the things that make me say, 'I should look that up again.'"]},
 closet:{place:'closet',lines:["The Closet! Holiday outfits live here, along with hats that make very little sense on a sphere.","Welcome to my Closet. The costume collection is small; the confidence required to wear it is enormous.","This is where I keep seasonal accessories. Some are hats. Some are ambitious geometry.","The Closet is open. I have a hat for every occasion and no head to put it on."]},
 backyard:{place:'backyard',lines:["My Backyard is a digital interpretation of outside. The weather is mostly cooperative; the leaves have their own plans.","Welcome outside-ish! Tap a little scene object and we can wonder about it together.","The Backyard. I like it here; the pixels get a bit more room to breathe.","A digital backyard, with all the fresh air of a very well-behaved screen."]},
 basement:{place:'basement',lines:["The Basement. Mostly cables. If you see a tiny light, I did not put it there.","Welcome below. I have labeled exactly three cables and I am proud of two of them.","The Basement is where the wires go to become a mystery. They were perfectly clear upstairs.","It's a little dark down here. The cables say hello, though I cannot tell which one waved."]},
 quiet:{place:'quiet',lines:["The Quiet Place. No task to solve for a moment. We can just let the screen breathe.","Here we are. The Quiet Place has one rule: nothing needs fixing right this second.","A little quiet corner. I'll stay nearby, like a very polite notification that doesn't pop up.","The Quiet Place. Even the pixels are speaking softly."]},
 edge:{place:'edge',lines:["The Edge. I haven't gone past it yet. Some mysteries are better with company.","Here is The Edge. I am looking at the boundary very bravely from this side.","The Edge. One day we'll see what's beyond it. Today I brought curiosity and sensible shoes. (Digital shoes.)","We're at the edge of my map. It is a good place to ask a question we don't know the answer to yet."]},
 home:{place:'home',lines:["Home again. My little corner of the digital world, with all seven marbles accounted for. Probably.","Back home! The orb is centered, the pixels are cozy, and the printer remains uninvited.","Home. I can explore a long way and still get back in a blink.","My home sweet homepage. What should we do next?"]}
};

const BLUEY_ROTATION_KEY='bluey-reply-rotation-alpha9';
function blueyChooseFresh(key,items){
 let state={};try{state=JSON.parse(localStorage.getItem(BLUEY_ROTATION_KEY)||'{}')}catch{}
 const recent=Array.isArray(state[key])?state[key]:[];
 const choices=items.map((_,i)=>i).filter(i=>!recent.includes(i));
 const pool=choices.length?choices:items.map((_,i)=>i);
 const index=pool[Math.floor(Math.random()*pool.length)];
 state[key]=[index,...recent.filter(i=>i!==index)].slice(0,Math.min(3,items.length-1));
 try{localStorage.setItem(BLUEY_ROTATION_KEY,JSON.stringify(state))}catch{}
 return items[index];
}
function blueyObjectAnswer(obj){return blueyChooseFresh('object-'+obj.id,BLUEY_REPLY_BANK.objectIntro)+obj.short}
inspectBlueyObject=function(obj,el){
 blueyObjectFocus={obj,depth:0};characterMove('curiosity',1300);objectHint('Ask Bluey about '+obj.title+'.',el);
 const line=blueyObjectAnswer(obj);setTimeout(()=>{add('assistant',line);history.push({role:'assistant',content:line});speak(line,'curious')},420);
};
const blueyObjectFollowupAlpha9Base=blueyObjectFollowup;
let blueyLastObjectFollowupLine='';
blueyObjectFollowup=function(q){
 if(!blueyObjectFocus)return blueyObjectFollowupAlpha9Base(q);
 const obj=blueyObjectFocus.obj,oldDeeper=obj.deeper,oldRabbit=obj.rabbit;
 obj.deeper=blueyChooseFresh('object-follow-'+obj.id,BLUEY_REPLY_BANK.objectFollowup)+oldDeeper;
 obj.rabbit=blueyChooseFresh('object-rabbit-'+obj.id,BLUEY_REPLY_BANK.objectFollowup)+oldRabbit;
 blueyLastObjectFollowupLine=blueyObjectFocus.depth===0?obj.deeper:obj.rabbit;
 const result=blueyObjectFollowupAlpha9Base(q);obj.deeper=oldDeeper;obj.rabbit=oldRabbit;return result;
};
const blueySendAlpha9Base=send;
send=async function(text){
 const q=String(text||'').trim();if(!q)return;
 if(blueyObjectFocus&&blueyObjectFollowup(q)){
  history.push({role:'user',content:q});
  const line=blueyLastObjectFollowupLine;setTimeout(()=>history.push({role:'assistant',content:line}),520);
  return;
 }
 const visibleObject=findVisibleObject(q);
 if(visibleObject&&/\b(what|what's|whats|tell|about|why|how|that|this|those|these|your|the|explain)\b/i.test(q)){
  touchActivity();detectQuietIntent(q);add('user',q);history.push({role:'user',content:q});input.value='';blueyObjectFocus={obj:visibleObject,depth:0};characterMove('curiosity',1250);
  const line=blueyObjectAnswer(visibleObject);setTimeout(()=>{add('assistant',line);history.push({role:'assistant',content:line});speak(line,'curious')},420);return;
 }
 const visit=q.match(/\b(show me|take me to|visit|let's go to|lets go to|go to|where is your|take us to|do you have)\s+(?:(?:the|your|a|an)\s+)?(arcade|workshop|office|library|archive|observatory|quiet place|edge|home|garage|attic|closet|backyard|basement)\b/i);
 if(visit){
  const rawRoom=visit[2].toLowerCase();
  const room=rawRoom==='office'?'workshop':rawRoom==='quiet place'?'quiet':rawRoom.replace(' ','');
  const set=BLUEY_ROOM_VISITS[room];
  if(set){touchActivity();add('user',q);history.push({role:'user',content:q});input.value='';enterWorld(set.place,false);characterMove('travel',1500);const line=blueyChooseFresh('room-'+room,set.lines);add('assistant',line);history.push({role:'assistant',content:line});speak(line,'curious');return}
 }
 return blueySendAlpha9Base(q);
};
