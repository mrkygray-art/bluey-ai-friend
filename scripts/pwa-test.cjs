// Add to home screen: Chrome sees an installable app, the service worker opens Bluey with no
// signal (and never serves /api/ from its cache), and the + menu shows the right steps per
// browser. Needs `vercel dev --listen 3210`. NODE_PATH=<folder with puppeteer-core> node scripts/pwa-test.cjs
const puppeteer=require('puppeteer-core');
const BASE=process.env.BLUEY_URL||'http://localhost:3210';
let fails=0;const check=(ok,name,extra='')=>{if(!ok)fails++;console.log(`${ok?'PASS':'FAIL'} ${name}${extra?' — '+extra:''}`)};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const UAS={
 duckduckgo:['Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile DuckDuckGo/5 Safari/537.36','Add to Home Screen'],
 firefox:['Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0','Add app to Home screen'],
 iphone:['Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1','Open as Web App'],
 'iphone-chrome':['Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0 Mobile/15E148 Safari/604.1','address bar'],
 'iphone-instagram':['Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0','Open in Safari'],
 samsung:['Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0 Mobile Safari/537.36','Add page to'],
};
(async()=>{
 const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const cdp=await page.createCDPSession();
 await page.goto(BASE+'/',{waitUntil:'networkidle0'});
 const {errors:manifestErrors}=await cdp.send('Page.getAppManifest');
 check(manifestErrors.length===0,'manifest parses with no errors',JSON.stringify(manifestErrors));
 await page.waitForFunction(()=>navigator.serviceWorker.ready.then(()=>true),{timeout:15000});
 await page.reload({waitUntil:'networkidle0'});
 check(await page.evaluate(()=>!!navigator.serviceWorker.controller),'service worker controls the page');
 const {installabilityErrors}=await cdp.send('Page.getInstallabilityErrors');
 check(installabilityErrors.length===0,'Chrome says Bluey is installable',JSON.stringify(installabilityErrors));
 for(const icon of ['/icons/icon-192.png','/icons/icon-512.png','/icons/icon-maskable-512.png','/icons/apple-touch-icon.png','/icons/icon.svg','/icons/favicon-32.png']){
  const r=await page.evaluate(u=>fetch(u).then(r=>r.status+' '+r.headers.get('content-type')),icon);check(/^200 image\//.test(r),'icon '+icon,r);
 }
 await wait(1500);
 await page.click('.bluey-plus-toggle');await wait(300);
 check(await page.$eval('.bluey-install',el=>!el.hidden),'Chrome install offer: + menu shows Add Bluey to your home screen');
 await page.keyboard.press('Escape');

 // Opening the lab must not replace the saved home page
 await page.goto(BASE+'/brain-lab.html',{waitUntil:'networkidle0'}).catch(()=>{});
 const home=await page.evaluate(()=>caches.match('/').then(r=>r?r.text():''));
 check(/id="bluey-tools"/.test(home),'saved home page is still Bluey after opening another page');
 await page.goto(BASE+'/',{waitUntil:'networkidle0'});await wait(800);

 // No signal: page and the SW both offline
 await page.setOfflineMode(true);
 const sw=await browser.waitForTarget(t=>t.type()==='service_worker');const swCdp=await sw.createCDPSession();
 await swCdp.send('Network.enable');await swCdp.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 await page.reload({waitUntil:'domcontentloaded'});await wait(2500);
 check(!!(await page.$('.bluey-plus-toggle'))&&!!(await page.$('.orb')),'offline: Bluey opens from the saved copy, + menu and orb included');
 const api=await page.evaluate(()=>fetch('/api/chat',{method:'POST',body:'{}'}).then(()=>'answered',()=>'failed'));
 check(api==='failed','offline: /api/ is never answered from the cache',api);
 const apiGet=await page.evaluate(()=>caches.keys().then(async ks=>{for(const k of ks){const c=await caches.open(k);const keys=await c.keys();if(keys.some(r=>new URL(r.url).pathname.startsWith('/api/')))return 'cached'}return 'none'}));
 check(apiGet==='none','no /api/ response is stored in the cache');
 await page.evaluate(()=>dispatchEvent(new Event('offline')));await wait(300);
 check(/No signal/.test(await page.$eval('#status',e=>e.textContent)),'offline: status line says No signal');
 await page.setOfflineMode(false);await swCdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});

 // Phones without an install dialog: the item shows that browser's steps
 for(const [name,[ua,expect]] of Object.entries(UAS)){
  const p=await browser.newPage();await p.setUserAgent(ua);
  // Headless Chrome still fires its install offer under these user agents; the real browsers don't.
  await p.evaluateOnNewDocument(()=>addEventListener('beforeinstallprompt',e=>e.stopImmediatePropagation(),true));await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  await p.goto(BASE+'/',{waitUntil:'networkidle0'});await wait(800);
  await p.tap('.bluey-plus-toggle');await wait(300);
  const shown=await p.$eval('.bluey-install',el=>!el.hidden).catch(()=>false);
  if(shown){await p.tap('.bluey-install');await wait(400)}
  // The steps open in install-help.js's sheet, with pictures of the buttons
  const text=await p.$eval('.ih-sheet',el=>el.innerText).catch(()=>'');
  check(shown&&text.includes(expect)&&/Home Screen/i.test(text),`${name}: install guide shows that browser's steps`,text.replace(/\s+/g,' ').slice(0,160));
  if(text){await p.tap('.ih-sheet button');await wait(200);check(!(await p.$('.ih-back')),`${name}: Got it closes the guide`)}
  if(name==='firefox')await p.screenshot({path:process.env.SHOT||require('os').tmpdir()+'/bluey-pwa-firefox.png'});
  await p.close();
 }
 // iPhone: a one-time "Make Bluey an app" card from the second visit; Show me or Not now hides it for good
 const ip=await browser.newPage();await ip.setUserAgent(UAS.iphone[0]);await ip.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 await ip.goto(BASE+'/',{waitUntil:'networkidle0'});await ip.evaluate(()=>{localStorage.removeItem('bluey-visits');localStorage.removeItem('bluey-install-nudge')});
 await ip.reload({waitUntil:'networkidle0'});await wait(3200);
 check(!(await ip.$('.bluey-install-nudge')),'iPhone, first visit: no nudge yet');
 await ip.reload({waitUntil:'networkidle0'});await wait(3200);
 check(!!(await ip.$('.bluey-install-nudge')),'iPhone, second visit: "Make Bluey an app" card');
 if(await ip.$('.bluey-install-nudge .is-yes')){await ip.tap('.bluey-install-nudge .is-yes');await wait(400);check(!!(await ip.$('.ih-sheet')),'iPhone: Show me opens the install guide');
  await ip.screenshot({path:process.env.SHOT_GUIDE||require('os').tmpdir()+'/bluey-ios-guide.png'})}
 await ip.reload({waitUntil:'networkidle0'});await wait(3200);
 check(!(await ip.$('.bluey-install-nudge')),'iPhone, after Show me: the card never comes back');
 await ip.close();
 // Already installed: no install item
 const inst=await browser.newPage();
 // Headless Chrome ignores display-mode emulation, so use the iPhone home-screen flag pwa.js also checks.
 await inst.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
 await inst.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await inst.goto(BASE+'/',{waitUntil:'networkidle0'});await wait(800);
 check(await inst.$eval('.bluey-install',el=>el.hidden).catch(()=>true),'opened from the home screen: no install item');

 check(!errors.length,'no page errors',errors.join(' | '));
 console.log(fails?`\n${fails} failed`:'\nall passed');
 await browser.close();process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
