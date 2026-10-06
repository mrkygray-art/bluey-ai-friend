// Renders Bluey's app icons from the same CSS as the orb on screen (index.html .orb), so the
// home-screen icon is the same round blue ball. Writes icons/ at the repo root.
// Needs puppeteer-core and Chrome: NODE_PATH=<folder with puppeteer-core> node scripts/make-icons.cjs
const puppeteer=require('puppeteer-core'),path=require('path'),fs=require('fs');
const OUT=path.join(__dirname,'..','icons');fs.mkdirSync(OUT,{recursive:true});
const ORB="background:radial-gradient(circle at 31% 22%,#fff 0 3%,rgba(255,255,255,.6) 7%,rgba(255,255,255,.08) 20%,transparent 29%),radial-gradient(circle at 68% 73%,rgba(0,70,150,.32),transparent 42%),linear-gradient(145deg,#58d6ff,#12afea 37%,#008bd5 68%,#0871bf)";
// [file, size, ball size as a share of the icon, background]
const ICONS=[
 ['icon-512.png',512,.92,null],          // transparent: the ball is the whole icon
 ['icon-192.png',192,.92,null],
 ['favicon-48.png',48,.96,null],
 ['favicon-32.png',32,.96,null],
 ['icon-maskable-512.png',512,.62,'#ffffff'], // Android crops to a circle/squircle: keep the ball inside the safe zone
 ['apple-touch-icon.png',180,.78,'#ffffff'],  // iPhone fills transparency with black, so give it the app's white
];
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const p=await b.newPage();
 for(const [file,size,share,bg] of ICONS){
  const d=Math.round(size*share),blur=Math.max(1,size/23);
  await p.setViewport({width:size,height:size,deviceScaleFactor:1});
  await p.setContent(`<html><body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg||'transparent'}">
   <div style="width:${d}px;height:${d}px;border-radius:50%;${ORB};box-shadow:inset ${-d*.124}px ${-d*.14}px ${d*.213}px rgba(0,60,130,.22),inset ${d*.1}px ${d*.084}px ${d*.157}px rgba(255,255,255,.2)${bg?`,0 ${blur}px ${blur*1.6}px rgba(0,116,185,.18)`:''}"></div></body></html>`);
  await p.screenshot({path:path.join(OUT,file),omitBackground:!bg});
  console.log('wrote',file);
 }
 await b.close();
})();
