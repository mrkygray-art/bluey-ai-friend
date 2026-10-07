// Optional sign-in (Google, Apple, or an email link/code) so what Bluey remembers follows a person
// to their other devices. Guests never need it: signed out, Bluey works exactly as before and
// memory stays on the device (memory.js).
// - Supabase Auth + the tables in supabase/accounts_v1.sql (row level security: each person can
//   only read or change their own rows). The publishable key below is meant for browsers.
// - The Supabase library loads only when someone opens Sign in or already has a session.
// - Signed in: device memory (bluey-memory) and saved preferences (bluey-preferences) are merged
//   into the account on sign-in, then every change is copied to the `memories` table. Sign out
//   removes them from this device (they stay in the account). Delete my account removes everything.
// - Signed in, the chat on screen is also saved to the account as it grows (conversations +
//   messages tables); "Your saved chats" opens or deletes them from any device. New chat starts a
//   new saved chat. Guests' chats stay on their device, as before.
// - /api/chat requests carry `account: true` so Bluey knows memory now follows the person.
(function(){
'use strict';
const SUPABASE_URL='https://pmvgicmongeqlgzfmqmj.supabase.co';
const SUPABASE_KEY='sb_publishable_lCmANKdoQ8nfVUG2820oVg_mb6jdei5';
const LIB='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js';
const SESSION='sb-pmvgicmongeqlgzfmqmj-auth-token';
// Sign-in methods switched on in Supabase (Authentication > Sign In / Providers).
// Empty: the + menu item stays hidden. Open Bluey with ?signin=1 to preview every method on one device.
const READY=[]; // 'google', 'apple', 'email'
const ALL=['google','apple','email'];
const MEM='bluey-memory',PREFS='bluey-preferences';
// The chat on screen (saved by alpha36.js), which chat it is in the account, and the last message copied there.
const CONV='bluey-alpha36-conversation',CONV_ID='bluey-conversation-id',CONV_SYNC='bluey-conversation-synced';
const KINDS=['about_me','project','goal','other'];

let preview=false;
try{const q=new URLSearchParams(location.search).get('signin');if(q==='1')localStorage.setItem('bluey-signin-preview','1');if(q==='0')localStorage.removeItem('bluey-signin-preview');preview=localStorage.getItem('bluey-signin-preview')==='1'}catch(_){}
const methods=()=>preview?ALL:READY;

let sb=null,loading=null,user=null,rows=new Map(),quiet=false;
const account={get user(){return user},open:()=>openSheet()};
window.blueyAccount=account;

function client(){
 if(sb)return Promise.resolve(sb);
 if(!loading)loading=new Promise((resolve,reject)=>{
  const ready=()=>{try{sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{flowType:'implicit',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});sb.auth.onAuthStateChange((event,session)=>setTimeout(()=>changed(event,session),0));resolve(sb)}catch(e){reject(e)}};
  if(window.supabase?.createClient)return ready();
  const s=document.createElement('script');s.src=LIB;s.async=true;s.onload=ready;s.onerror=()=>{loading=null;reject(new Error('Could not load sign-in'))};document.head.append(s);
 });
 return loading;
}

function status(text,ms=3500){if(typeof tempStatus==='function')tempStatus(text,ms)}
const readList=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}};
function writeQuiet(k,v){quiet=true;try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}quiet=false}
function redraw(){window.blueyMemory?.refresh();if(window.blueyRenderRemembered)blueyRenderRemembered();renderItem()}

async function changed(event,session){
 const was=user;user=session?.user||null;
 if(location.hash&&/access_token=|error_description=/.test(location.hash))window.history.replaceState(null,'',location.pathname+location.search);
 renderItem();window.blueyMemory?.refresh();
 if(user&&(!was||was.id!==user.id)){try{await firstSync();if(event==='SIGNED_IN')status('Signed in. What Bluey remembers now follows you to your other devices.',5000)}catch(e){console.warn('Bluey account sync',e);status('Signed in, but I couldn’t reach your saved memories just now.',5000)}}
 if(!user&&was){rows=new Map()}
}

// What the account holds, by lower-case subject. Preferences are stored as kind "preference".
async function pull(){
 const {data,error}=await sb.from('memories').select('id,kind,subject,fact,updated_at').eq('status','active').order('updated_at',{ascending:true});
 if(error)throw error;
 rows=new Map(data.map(r=>[r.subject.toLowerCase(),r]));return data;
}
const prefSubject=p=>('preference: '+p).slice(0,80);
function wanted(){
 const want=new Map();
 for(const m of readList(MEM))if(m&&typeof m.subject==='string'&&typeof m.fact==='string'&&m.subject.trim()&&m.fact.trim())want.set(m.subject.toLowerCase().slice(0,80),{kind:KINDS.includes(m.kind)?m.kind:'other',subject:m.subject.slice(0,80),fact:m.fact.slice(0,500)});
 for(const p of readList(PREFS))if(typeof p==='string'&&p.trim())want.set(prefSubject(p).toLowerCase(),{kind:'preference',subject:prefSubject(p),fact:p.slice(0,500)});
 return want;
}

// On sign-in: everything in the account, plus anything this device knew that the account didn't.
async function firstSync(){
 const remote=await pull();
 const mem=remote.filter(r=>r.kind!=='preference').map(r=>({kind:r.kind,subject:r.subject,fact:r.fact,at:Date.parse(r.updated_at)||Date.now()}));
 for(const m of readList(MEM))if(m&&typeof m.subject==='string'&&!rows.has(m.subject.toLowerCase()))mem.push(m);
 const prefs=remote.filter(r=>r.kind==='preference').map(r=>r.fact);
 for(const p of readList(PREFS))if(typeof p==='string'&&!prefs.includes(p))prefs.push(p);
 writeQuiet(MEM,mem.slice(-30));writeQuiet(PREFS,prefs.slice(0,8));redraw();
 await push();
 scheduleChat();
}

// Make the account match this device: add new things, update changed ones, remove forgotten ones.
async function push(){
 if(!user)return;
 const want=wanted();
 for(const [k,r] of rows)if(!want.has(k)){const {error}=await sb.from('memories').delete().eq('id',r.id);if(error)throw error}
 for(const [k,m] of want){
  const r=rows.get(k);
  if(!r){const {error}=await sb.from('memories').insert(m);if(error&&error.code!=='23505')throw error}
  else if(r.fact!==m.fact||r.kind!==m.kind){const {error}=await sb.from('memories').update({kind:m.kind,fact:m.fact}).eq('id',r.id);if(error)throw error}
 }
 await pull();
}
let chain=Promise.resolve(),timer=null,chatTimer=null;
const queue=fn=>{chain=chain.then(fn).catch(e=>{console.warn('Bluey account sync',e)});return chain};
function schedule(){if(!user)return;clearTimeout(timer);timer=setTimeout(()=>queue(push),600)}
function scheduleChat(){if(!user)return;clearTimeout(chatTimer);chatTimer=setTimeout(()=>queue(pushChat),1500)}

// Saved chats: the chat on screen is copied to the account as it grows (new messages only).
const local={get:k=>{try{return localStorage.getItem(k)}catch(_){return null}},set:(k,v)=>{try{setItem.call(localStorage,k,v)}catch(_){}},drop:k=>{try{removeItem.call(localStorage,k)}catch(_){}}};
const uuid=()=>crypto.randomUUID?crypto.randomUUID():([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
function convId(){let id=local.get(CONV_ID);if(!id||!/^[0-9a-f-]{36}$/i.test(id)){id=uuid();local.set(CONV_ID,id)}return id}
// A short fingerprint of a message, so the sync mark stays small.
const fingerprint=m=>{let h=5381;const x=m.role+'\n'+m.content;for(let i=0;i<x.length;i++)h=((h<<5)+h+x.charCodeAt(i))|0;return m.role[0]+(h>>>0).toString(36)+'.'+x.length};
const markSynced=(id,t)=>{if(t.length)local.set(CONV_SYNC,JSON.stringify({id,n:t.length,tail:t.slice(-3).map(fingerprint)}))};
const transcript=()=>readList(CONV).filter(m=>m&&(m.role==='user'||m.role==='assistant')&&typeof m.content==='string'&&m.content.trim());
async function pushChat(){
 if(!user)return;
 const t=transcript();if(!t.length)return;
 const id=convId();let mark=null;try{mark=JSON.parse(local.get(CONV_SYNC)||'null')}catch(_){}
 // Normally only messages after the last ones copied are new: find the last three copied messages
 // (where they were, else searching back, since the saved chat keeps only the latest 100). If they
 // aren't on screen any more (or this chat was never copied from this device), copy it all again.
 let start=0,full=true;
 if(mark&&mark.id===id&&Array.isArray(mark.tail)&&mark.tail.length){
  const hs=t.map(fingerprint),ends=at=>mark.tail.every((h,k)=>hs[at-(mark.tail.length-1-k)]===h);
  const at=ends(mark.n-1)?mark.n-1:(()=>{for(let i=t.length-1;i>=mark.tail.length-1;i--)if(ends(i))return i;return -1})();
  if(at>=0){start=at+1;full=false}
 }
 if(!full&&start>=t.length)return;
 const first=t.find(m=>m.role==='user');
 const {error:e1}=await sb.from('conversations').upsert({id,title:(first?first.content:'Chat with Bluey').replace(/\s+/g,' ').trim().slice(0,80)||'Chat with Bluey'});if(e1)throw e1;
 if(full){const {error}=await sb.from('messages').delete().eq('conversation_id',id);if(error)throw error;start=0}
 const {error:e2}=await sb.from('messages').insert(t.slice(start).map(m=>({conversation_id:id,role:m.role,content:m.content.slice(0,20000)})));if(e2)throw e2;
 markSynced(id,t);
}
function clearChatHere(){
 local.drop(CONV);local.drop(CONV_ID);local.drop(CONV_SYNC);
 try{messages.replaceChildren();history.length=0;app.classList.remove('working')}catch(_){}
}

// memory.js, preferences.js, and alpha36.js save straight to localStorage; copy those changes to the account.
const setItem=Storage.prototype.setItem,removeItem=Storage.prototype.removeItem;
Storage.prototype.setItem=function(k,v){setItem.call(this,k,v);if(quiet||this!==window.localStorage)return;if(k===MEM||k===PREFS)schedule();else if(k===CONV)scheduleChat()};
// New chat removes the saved chat: the next message starts a new chat in the account.
Storage.prototype.removeItem=function(k){removeItem.call(this,k);if(this===window.localStorage&&k===CONV){removeItem.call(this,CONV_ID);removeItem.call(this,CONV_SYNC)}};

// Bluey knows when memory follows the person to their other devices.
const previousFetch=window.fetch;
window.fetch=function(resource,init){
 const url=typeof resource==='string'?resource:resource?.url||'';
 if(user&&/\/api\/chat(\?|$)/.test(url)&&typeof init?.body==='string'){try{const body=JSON.parse(init.body);body.account=true;init={...init,body:JSON.stringify(body)}}catch(_){}}
 return previousFetch.call(this,resource,init);
};

// + menu: "Sign in (optional)" or "Your account"
let item=null,label=null,sub=null;
function build(){
 const menu=document.querySelector('.bluey-plus-menu');if(!menu||item)return;
 item=document.createElement('button');item.type='button';item.className='bluey-plus-item bluey-account-item';
 const i=document.createElement('span');i.className='bluey-plus-icon';i.setAttribute('aria-hidden','true');i.textContent='👤';
 const t=document.createElement('span');t.className='bluey-plus-text';label=document.createTextNode('');sub=document.createElement('small');t.append(label,sub);
 item.append(i,t);
 item.addEventListener('click',()=>{menu.hidden=true;document.querySelector('.bluey-plus-toggle')?.setAttribute('aria-expanded','false');openSheet()});
 const after=menu.querySelector('.bluey-memory-item');if(after)after.after(item);else menu.insertBefore(item,menu.querySelector('.bluey-plus-head'));
 renderItem();
}
function renderItem(){
 if(!item)return;
 item.hidden=!user&&!methods().length;
 label.textContent=user?'Your account':'Sign in (optional)';
 sub.textContent=user?(user.email||'Signed in'):'Keep what Bluey remembers on all your devices';
}

const GOOGLE='<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const APPLE='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>';

function openSheet(){
 const back=document.createElement('div');back.className='bluey-memory-back';back.setAttribute('role','dialog');back.setAttribute('aria-modal','true');back.setAttribute('aria-label',user?'Your account':'Sign in');
 const sheet=document.createElement('div');sheet.className='bluey-memory-sheet bluey-account-sheet';back.append(sheet);
 const close=()=>{back.remove();document.removeEventListener('keydown',esc)};const esc=e=>{if(e.key==='Escape')close()};
 const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=text;return x};
 const button=(text,cls,fn)=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b};
 const note=el('p','bluey-account-note');note.setAttribute('role','status');note.setAttribute('aria-live','polite');
 const say=t=>{note.textContent=t};
 function actions(...extra){const a=el('div','bluey-memory-actions');a.append(...extra);return a}

 function signedOut(){
  sheet.replaceChildren(el('h2',null,'Sign in (optional)'),el('p','bluey-memory-lead','You don’t need an account to use Bluey. Signing in just means what Bluey remembers about you follows you to your phone, tablet, and computer.'));
  const list=methods();
  const oauth=async provider=>{say('Opening '+(provider==='google'?'Google':'Apple')+'…');try{const c=await client();const {error}=await c.auth.signInWithOAuth({provider,options:{redirectTo:location.origin+'/'}});if(error)throw error}catch(e){say('That didn’t work just now. Please try again in a moment.')}};
  if(list.includes('google')){const b=button('','bluey-account-provider is-google',()=>oauth('google'));b.innerHTML=GOOGLE+'<span>Continue with Google</span>';sheet.append(b)}
  if(list.includes('apple')){const b=button('','bluey-account-provider is-apple',()=>oauth('apple'));b.innerHTML=APPLE+'<span>Continue with Apple</span>';sheet.append(b)}
  if(list.includes('email')){
   if(list.length>1)sheet.append(el('p','bluey-account-or','or'));
   const form=el('form','bluey-account-email');
   const lab=el('label',null,'Your email');const input=el('input');input.type='email';input.required=true;input.autocomplete='email';input.inputMode='email';input.placeholder='you@example.com';lab.append(input);
   const send=el('button','bluey-account-send','Email me a sign-in link');send.type='submit';
   form.append(lab,send);
   form.addEventListener('submit',async e=>{e.preventDefault();const email=input.value.trim();if(!email)return;send.disabled=true;say('Sending…');
    try{const c=await client();const {error}=await c.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+'/',shouldCreateUser:true}});if(error)throw error;codeStep(email)}
    catch(err){send.disabled=false;say(/rate|seconds/i.test(err?.message||'')?'Please wait a minute before asking for another email.':'I couldn’t send that email just now. Please check the address and try again.')}});
   sheet.append(form);
  }
  sheet.append(note,actions(button('Keep using Bluey without signing in','is-quiet',close)));
 }

 function codeStep(email){
  sheet.replaceChildren(el('h2',null,'Check your email'),el('p','bluey-memory-lead',`I sent a sign-in email to ${email}. Tap the link in it on this device. If the email shows a 6-digit code, you can type it here instead (handy in the home-screen app).`));
  const form=el('form','bluey-account-email');
  const lab=el('label',null,'Code from the email');const input=el('input');input.inputMode='numeric';input.autocomplete='one-time-code';input.maxLength=10;input.placeholder='123456';lab.append(input);
  const ok=el('button','bluey-account-send','Sign in');ok.type='submit';form.append(lab,ok);
  form.addEventListener('submit',async e=>{e.preventDefault();const token=input.value.replace(/\D/g,'');if(token.length<6)return say('The code is the 6 numbers in the email.');ok.disabled=true;say('Checking…');
   try{const c=await client();const {error}=await c.auth.verifyOtp({email,token,type:'email'});if(error)throw error;close()}
   catch(_){ok.disabled=false;say('That code didn’t work. It may have expired; you can ask for a new email.')}});
  sheet.append(form,note,actions(button('Use a different email','is-quiet',signedOut),button('Done',null,close)));
  input.focus({preventScroll:true});
 }

 function signedIn(){
  const n=readList(MEM).length+readList(PREFS).length;
  sheet.replaceChildren(el('h2',null,'Your account'),el('p','bluey-memory-lead',`Signed in as ${user.email||'you'}. ${n?`Bluey remembers ${n} thing${n===1?'':'s'} about you, saved to your account`:'Anything Bluey remembers about you will be saved to your account'}, so it follows you to your other devices.`));
  const see=button('See what Bluey remembers',null,()=>{close();document.querySelector('.bluey-memory-item')?.click()});
  const chats=button('Your saved chats',null,()=>{close();openChats()});
  const out=button('Sign out','is-quiet',async()=>{out.disabled=true;clearTimeout(chatTimer);await queue(pushChat);try{await sb.auth.signOut()}catch(_){}writeQuiet(MEM,[]);writeQuiet(PREFS,[]);clearChatHere();user=null;rows=new Map();redraw();close();status('Signed out. Your memories and chats are safe in your account and were removed from this device.',5000)});
  let armed=false;
  const del=button('Delete my account','is-quiet is-danger',async()=>{
   if(!armed){armed=true;del.textContent='Tap again to delete your account and everything in it';return}
   del.disabled=true;say('Deleting…');
   try{const {error}=await sb.rpc('delete_my_account');if(error)throw error;try{await sb.auth.signOut({scope:'local'})}catch(_){}writeQuiet(MEM,[]);writeQuiet(PREFS,[]);clearChatHere();user=null;rows=new Map();redraw();close();status('Your account and everything in it are deleted.',5000)}
   catch(_){del.disabled=false;say('I couldn’t delete it just now. Please try again in a moment.')}
  });
  sheet.append(note,actions(see,chats),actions(out,del,button('Done',null,close)));
 }

 (user?signedIn:signedOut)();
 back.addEventListener('click',e=>{if(e.target===back)close()});document.addEventListener('keydown',esc);
 document.body.append(back);sheet.querySelector('button,input')?.focus({preventScroll:true});
}

// "Your saved chats": open a chat from any device (it replaces the one on screen, which is already
// saved in the account) or delete it.
async function openChats(){
 const back=document.createElement('div');back.className='bluey-memory-back';back.setAttribute('role','dialog');back.setAttribute('aria-modal','true');back.setAttribute('aria-label','Your saved chats');
 const sheet=document.createElement('div');sheet.className='bluey-memory-sheet bluey-account-sheet';back.append(sheet);
 const close=()=>{back.remove();document.removeEventListener('keydown',esc)};const esc=e=>{if(e.key==='Escape')close()};
 const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=text;return x};
 const done=el('button',null,'Done');done.type='button';done.addEventListener('click',close);
 const actions=el('div','bluey-memory-actions');actions.append(done);
 const list=el('div','bluey-chats-list');const note=el('p','bluey-account-note','Loading your chats…');
 sheet.append(el('h2',null,'Your saved chats'),el('p','bluey-memory-lead','Chats you have while signed in are saved here, so you can pick one up on another device.'),note,list,actions);
 back.addEventListener('click',e=>{if(e.target===back)close()});document.addEventListener('keydown',esc);
 document.body.append(back);done.focus({preventScroll:true});
 if(!user||!sb){note.textContent='Sign in to see your saved chats.';return}
 clearTimeout(chatTimer);await queue(pushChat);
 const {data,error}=await sb.from('conversations').select('id,title,updated_at').order('updated_at',{ascending:false}).limit(50);
 if(error){note.textContent='I couldn’t load your chats just now. Please try again in a moment.';return}
 note.textContent=data.length?'':'No saved chats yet. Start talking with Bluey and this chat will be saved here.';
 const current=local.get(CONV_ID);
 for(const c of data){
  const row=el('div','bluey-memory-row bluey-chat-row');
  const text=el('span');text.append(el('strong',null,c.title||'Chat with Bluey'),el('small',null,(c.id===current?'On screen now · ':'')+new Date(c.updated_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})));
  const btns=el('span','bluey-chat-buttons');
  const open=el('button',null,c.id===current?'On screen':'Open');open.type='button';open.disabled=c.id===current;
  open.addEventListener('click',async()=>{
   open.disabled=true;open.textContent='Opening…';
   const {data:msgs,error:e}=await sb.from('messages').select('role,content').eq('conversation_id',c.id).order('id',{ascending:false}).limit(100);
   if(e||!msgs){open.disabled=false;open.textContent='Open';note.textContent='I couldn’t open that chat just now.';return}
   const t=msgs.reverse().map(m=>({role:m.role,content:m.content}));
   local.set(CONV,JSON.stringify(t));local.set(CONV_ID,c.id);
   markSynced(c.id,t);
   location.reload();
  });
  let armed=false;
  const del=el('button','is-danger','Delete');del.type='button';del.setAttribute('aria-label','Delete chat: '+(c.title||'Chat with Bluey'));
  del.addEventListener('click',async()=>{
   if(!armed){armed=true;del.textContent='Tap again';return}
   del.disabled=true;
   const {error:e}=await sb.from('conversations').delete().eq('id',c.id);
   if(e){del.disabled=false;note.textContent='I couldn’t delete that chat just now.';return}
   if(c.id===local.get(CONV_ID))clearChatHere();
   row.remove();if(!list.children.length)note.textContent='No saved chats yet.';
  });
  btns.append(open,del);row.append(text,btns);list.append(row);
 }
}
account.chats=openChats;

build();
document.addEventListener('DOMContentLoaded',build);
// Load sign-in right away only for someone already signed in, or coming back from a sign-in link.
let hasSession=false;try{hasSession=!!localStorage.getItem(SESSION)}catch(_){}
if(hasSession||/access_token=|error_description=/.test(location.hash))client().catch(()=>{});
})();
