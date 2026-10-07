// Optional sign-in (Google, Apple, or an email link/code) so what Bluey remembers follows a person
// to their other devices. Guests never need it: signed out, Bluey works exactly as before and
// memory stays on the device (memory.js).
// - Supabase Auth + the tables in supabase/accounts_v1.sql (row level security: each person can
//   only read or change their own rows). The publishable key below is meant for browsers.
// - The Supabase library loads only when someone opens Sign in or already has a session.
// - Signed in: device memory (bluey-memory) and saved preferences (bluey-preferences) are merged
//   into the account on sign-in, then every change is copied to the `memories` table. Sign out
//   removes them from this device (they stay in the account). Delete my account removes everything.
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
let chain=Promise.resolve(),timer=null;
function schedule(){if(!user)return;clearTimeout(timer);timer=setTimeout(()=>{chain=chain.then(push).catch(e=>{console.warn('Bluey account sync',e)})},600)}

// memory.js and preferences.js save straight to localStorage; copy those changes to the account.
const setItem=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){setItem.call(this,k,v);if(!quiet&&this===window.localStorage&&(k===MEM||k===PREFS))schedule()};

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
  const out=button('Sign out','is-quiet',async()=>{out.disabled=true;try{await sb.auth.signOut()}catch(_){}writeQuiet(MEM,[]);writeQuiet(PREFS,[]);user=null;rows=new Map();redraw();close();status('Signed out. Your memories are safe in your account and were removed from this device.',5000)});
  let armed=false;
  const del=button('Delete my account','is-quiet is-danger',async()=>{
   if(!armed){armed=true;del.textContent='Tap again to delete your account and everything in it';return}
   del.disabled=true;say('Deleting…');
   try{const {error}=await sb.rpc('delete_my_account');if(error)throw error;try{await sb.auth.signOut({scope:'local'})}catch(_){}writeQuiet(MEM,[]);writeQuiet(PREFS,[]);user=null;rows=new Map();redraw();close();status('Your account and everything in it are deleted.',5000)}
   catch(_){del.disabled=false;say('I couldn’t delete it just now. Please try again in a moment.')}
  });
  sheet.append(note,actions(see,out),actions(del,button('Done',null,close)));
 }

 (user?signedIn:signedOut)();
 back.addEventListener('click',e=>{if(e.target===back)close()});document.addEventListener('keydown',esc);
 document.body.append(back);sheet.querySelector('button,input')?.focus({preventScroll:true});
}

build();
document.addEventListener('DOMContentLoaded',build);
// Load sign-in right away only for someone already signed in, or coming back from a sign-in link.
let hasSession=false;try{hasSession=!!localStorage.getItem(SESSION)}catch(_){}
if(hasSession||/access_token=|error_description=/.test(location.hash))client().catch(()=>{});
})();
