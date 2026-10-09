// Formatted replies. Bluey's replies may use light Markdown (### headings, - bullets,
// 1. steps, **bold**, `code`, simple | tables), the way ChatGPT and Claude show answers.
// - blueyFormat(text) builds the reply bubble from DOM nodes (never innerHTML), so model
//   text can't inject markup. index.html add() and alpha36's restore use it for Bluey's
//   replies; the raw text is kept in data-raw for the saved chat.
// - blueyPlain(text) is the same reply without Markdown symbols: used for speech, and as the
//   plain-text half of Copy.
// - blueyCopyReply(text) copies formatted HTML plus plain text, so a paste into Word or an
//   email keeps the bullets and bold, and a paste into a text box gets clean text.
// - Ky's own sites (portfolio, Bluey, NightAgent demo, PicTalk) become links that open in a
//   new tab. Only these hosts: any other address the model writes stays plain text.
// Loaded before alpha7.js so restored chats render formatted too.
(function(){
'use strict';
const INLINE=/(\*\*[^*\n]+?\*\*|__[^_\n]+?__|`[^`\n]+`|\*(?=\S)[^*\n]+?\S?\*(?!\*))/g;
const LINKS=/(?<![\w.@-])(?:https?:\/\/)?(?:www\.)?((?:ky-gray-portfolio|bluey-ai-friend|nightshift-dispatch)\.vercel\.app|pictalk-6cbff\.web\.app)((?:\/[\w\-./?=&%#]*)?)/gi;
function linkify(parent,text){
 let last=0;
 for(const m of String(text).matchAll(LINKS)){
  let path=m[2].replace(/[.?!,;:]+$/,'');const shown=m[0].slice(0,m[0].length-(m[2].length-path.length));
  if(m.index>last)parent.append(text.slice(last,m.index));
  const a=document.createElement('a');a.href='https://'+m[1].toLowerCase()+path;a.target='_blank';a.rel='noopener noreferrer';a.textContent=shown;
  parent.append(a);last=m.index+shown.length;
 }
 if(last<text.length)parent.append(text.slice(last));
}
function inline(parent,text){
 let last=0;
 for(const m of String(text).matchAll(INLINE)){
  if(m.index>last)linkify(parent,text.slice(last,m.index));
  const t=m[0];let el;
  if(t.startsWith('**')||t.startsWith('__')){el=document.createElement('strong');inline(el,t.slice(2,-2))}
  else if(t.startsWith('`')){el=document.createElement('code');el.textContent=t.slice(1,-1)}
  else{el=document.createElement('em');linkify(el,t.slice(1,-1))}
  parent.append(el);last=m.index+t.length;
 }
 if(last<text.length)linkify(parent,text.slice(last));
}
const BULLET=/^(\s*)([-*•])\s+(.*)$/,NUMBER=/^(\s*)(\d{1,3})[.)]\s+(.*)$/,HEADING=/^\s*(#{1,6})\s+(.*?)\s*#*\s*$/,RULE=/^\s*([-*_])(\s*\1){2,}\s*$/;
const cells=line=>line.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
const isTableSep=line=>/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line||'');

function blocks(text){
 const lines=String(text||'').replace(/\r\n?/g,'\n').split('\n'),out=document.createDocumentFragment();
 let para=[];
 const flush=()=>{if(!para.length)return;const p=document.createElement('p');para.forEach((l,i)=>{if(i)p.append(document.createElement('br'));inline(p,l)});out.append(p);para=[]};
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  if(/^\s*```/.test(line)){flush();const pre=document.createElement('pre'),code=document.createElement('code'),body=[];for(i++;i<lines.length&&!/^\s*```/.test(lines[i]);i++)body.push(lines[i]);code.textContent=body.join('\n');pre.append(code);out.append(pre);continue}
  if(!line.trim()){flush();continue}
  let m;
  if((m=line.match(HEADING))){flush();const h=document.createElement(m[1].length<=3?'h3':'h4');inline(h,m[2]);out.append(h);continue}
  if(RULE.test(line)){flush();out.append(document.createElement('hr'));continue}
  if(line.includes('|')&&isTableSep(lines[i+1])){
   flush();const wrap=document.createElement('div');wrap.className='bluey-table';const table=document.createElement('table'),thead=document.createElement('thead'),tbody=document.createElement('tbody'),head=document.createElement('tr');
   for(const c of cells(line)){const th=document.createElement('th');inline(th,c);head.append(th)}
   thead.append(head);i++;
   while(i+1<lines.length&&lines[i+1].includes('|')&&lines[i+1].trim()){i++;const tr=document.createElement('tr');for(const c of cells(lines[i])){const td=document.createElement('td');inline(td,c);tr.append(td)}tbody.append(tr)}
   table.append(thead,tbody);wrap.append(table);out.append(wrap);continue;
  }
  if(BULLET.test(line)||NUMBER.test(line)){
   flush();
   // One list per run of list lines; lines indented 2+ spaces under an item nest one level.
   const ordered=!BULLET.test(line),list=document.createElement(ordered?'ol':'ul');
   if(ordered){const start=Number(line.match(NUMBER)[2]);if(start>1)list.start=start}
   let item=null,sub=null;
   for(;i<lines.length;i++){
    const l=lines[i],b=l.match(BULLET),n=l.match(NUMBER),hit=b||n;
    if(!hit){
     if(item&&l.trim()&&/^\s{2,}/.test(l)){item.append(document.createElement('br'));inline(item,l.trim());continue}
     if(!l.trim()&&i+1<lines.length&&(BULLET.test(lines[i+1])||NUMBER.test(lines[i+1]))&&/^\s{2,}/.test(lines[i+1]))continue;
     i--;break;
    }
    const nested=hit[1].length>=2&&item;
    const li=document.createElement('li');inline(li,hit[3]);
    if(nested){if(!sub){sub=document.createElement(b?'ul':'ol');item.append(sub)}sub.append(li)}
    else{if(!!n!==ordered){i--;break}item=li;sub=null;list.append(li)}
   }
   out.append(list);continue;
  }
  para.push(line.trim());
 }
 flush();return out;
}

window.blueyFormat=function(text){
 const div=document.createElement('div');div.className='msg assistant bluey-formatted';div.dataset.raw=String(text||'');
 div.append(blocks(text));return div;
};
window.blueyPlain=function(text){
 return String(text||'').replace(/\r\n?/g,'\n').split('\n').filter(l=>!isTableSep(l)&&!RULE.test(l)&&!/^\s*```/.test(l)).map(l=>{
  if(l.includes('|')&&/^\s*\|/.test(l))return cells(l).join(' · ');
  return l.replace(HEADING,'$2').replace(BULLET,(_,s,__,t)=>s+'• '+t);
 }).join('\n').replace(/\*\*([^*\n]+?)\*\*|__([^_\n]+?)__/g,'$1$2').replace(/`([^`\n]+)`/g,'$1').replace(/\*(?=\S)([^*\n]+?)\*/g,'$1').replace(/\n{3,}/g,'\n\n').trim();
};
window.blueyCopyReply=async function(text){
 const plain=blueyPlain(text);
 try{
  if(window.ClipboardItem&&navigator.clipboard?.write){
   const html=blueyFormat(text).innerHTML;
   await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([plain],{type:'text/plain'})})]);
   return;
  }
 }catch(_){/* some browsers only allow plain text */}
 await navigator.clipboard.writeText(plain);
};

// Names voices get wrong. Lowercase "ky" (in ky-gray-portfolio.vercel.app) is read as the
// letters "K Y"; capitalized "Ky" is said right. Only what's spoken changes; the screen and
// Copy keep the real address. api/speech.js does the same for generated speech.
window.blueySpeakable=function(text){
 return String(text||'').replace(/\bky[-\s]gray[-\s]portfolio\b/gi,'Ky Gray portfolio').replace(/\bky(?=[-\s]gray\b)/g,'Ky');
};

// Speech reads the reply without Markdown symbols. speak() is redefined by alpha7/11/36,
// so wrap whichever one is current once every script has run.
document.addEventListener('DOMContentLoaded',()=>{
 if(typeof speak!=='function'||speak.blueyPlain)return;
 const previous=speak;
 speak=function(text,...rest){return previous.call(this,blueySpeakable(blueyPlain(text)),...rest)};
 speak.blueyPlain=true;
});
})();
