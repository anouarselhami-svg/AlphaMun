import assert from 'node:assert/strict';
import { preview } from 'vite';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const main=await preview({configFile:false,preview:{host:'127.0.0.1',port:5200,strictPort:true}});
const registration=await preview({configFile:false,root:path.resolve('registration-site'),preview:{host:'127.0.0.1',port:5201,strictPort:true}});
const directory=path.resolve('.browser-check');await mkdir(directory,{recursive:true});

const edge=spawn(process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9243',`--user-data-dir=${directory}/edge-${Date.now()}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let socket;
const watchdog=setTimeout(()=>{console.error('Browser test timed out');edge.kill();process.exit(1);},55000);
try {
 let target;for(let i=0;i<50;i++){try{target=await (await fetch('http://127.0.0.1:9243/json/new?about:blank',{method:'PUT',signal:AbortSignal.timeout(1000)})).json();break;}catch{await new Promise(r=>setTimeout(r,200));}}
 assert.ok(target,'Edge remote debugging unavailable');socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();socket.onmessage=e=>{const msg=JSON.parse(e.data);if(msg.id){const item=pending.get(msg.id);pending.delete(msg.id);if(msg.error)item.reject(Error(JSON.stringify(msg.error)));else item.resolve(msg.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const current=++id;pending.set(current,{resolve,reject});socket.send(JSON.stringify({id:current,method,params}));});
 const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 const pause=()=>new Promise(r=>setTimeout(r,100));
 const navigate=async url=>{await call('Page.navigate',{url});for(let i=0;i<60;i++){await pause();if(await evaluate('document.querySelector("#root")?.children.length>0'))return;}throw Error('React did not mount');};
 await call('Page.enable');await call('Runtime.enable');
 console.log('Checking main site');
 await navigate('http://127.0.0.1:5200/');
 const links=await evaluate(`Array.from(document.querySelectorAll('#packs a')).map(a=>({href:a.href,target:a.target,rel:a.rel}))`);
 assert.deepEqual(links.map(l=>l.href),['https://inscription.youthglobalclub.com/?pack=500','https://inscription.youthglobalclub.com/?pack=1500']);assert.ok(links.every(l=>l.target==='_blank'&&l.rel.includes('noopener')));
 assert.ok(await evaluate(`Array.from(document.querySelectorAll('a')).filter(a=>a.textContent.includes('S’inscrire')||a.textContent.includes('Devenir délégué')).every(a=>a.hash==='#packs')`));

 console.log('Checking final schedule and accessible tabs');
 assert.equal(await evaluate("document.querySelectorAll('#programme .programme-slots li').length"),26);
 assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.programme-slots')).map(e=>e.children.length)"),[9,12,5]);
 assert.equal(await evaluate("document.querySelectorAll('nav a[href=\"/#programme\"]').length"),1);
 for (let day=0;day<3;day++) {
   await evaluate(`document.querySelectorAll('.programme-tabs button')[${day}].click()`);await pause();
   assert.equal(await evaluate("document.querySelector('.programme-tabs [aria-selected=true]').id"),`programme-tab-${day}`);
   assert.equal(await evaluate("document.querySelector('[role=tabpanel]:not([hidden])').id"),`programme-panel-${day}`);
 }
 await evaluate("document.querySelector('#programme-tab-2').focus()");
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});await pause();
 assert.equal(await evaluate('document.activeElement.id'),'programme-tab-0');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'End',code:'End'});await pause();
 assert.equal(await evaluate('document.activeElement.id'),'programme-tab-2');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft'});await pause();
 assert.equal(await evaluate('document.activeElement.id'),'programme-tab-1');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Home',code:'Home'});await pause();
 assert.equal(await evaluate('document.activeElement.id'),'programme-tab-0');
 await call('Emulation.setDeviceMetricsOverride',{width:320,height:844,deviceScaleFactor:1,mobile:true});
 await call('Emulation.setTouchEmulationEnabled',{enabled:true});
 for(let day=0;day<3;day++) {
   await evaluate(`document.querySelectorAll('.programme-tabs button')[${day}].scrollIntoView({block:'center',behavior:'instant'})`);await pause();
   const point=await evaluate(`(()=>{const r=document.querySelectorAll('.programme-tabs button')[${day}].getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
   await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
   await pause();await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await new Promise(r=>setTimeout(r,500));
   assert.equal(await evaluate("document.querySelector('[role=tabpanel]:not([hidden])').id"),`programme-panel-${day}`);
   assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),'320px schedule overflow');
 }
 await call('Emulation.setTouchEmulationEnabled',{enabled:false});
 console.log('26 slots; click, touch, arrows, Home/End and 320px layout verified.');
 console.log('Checking whole-site language switching');
 await evaluate(`document.querySelector('.site-language button:last-child').click()`);await pause();
 assert.equal(await evaluate('document.documentElement.lang'),'en');
 for(const [selector,expected] of [['#accueil','Become a delegate'],['#histoire','A world to understand.'],['#comites','Every debate opens'],['#packs','Choose this package'],['#programme','Three days of connection.'],['#bureau','13 dedicated members.'],['#staff','Join the staff'],['#faq','What is a MUN?'],['#contact','Your name'],['footer','Back to top']])assert.ok(await evaluate(`document.querySelector('${selector}').textContent.includes(${JSON.stringify(expected)})`),selector);
 assert.ok(await evaluate(`document.querySelector('.countdown').textContent.includes('DAYS')`));
 assert.ok(await evaluate(`document.querySelector('[name="nom"]').placeholder==='Your name'`));
 await call('Page.reload');await pause();await pause();assert.equal(await evaluate('document.documentElement.lang'),'en');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause();
 assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),'English mobile site overflow');
 const mainScreenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(directory,'main-mobile-en.png'),Buffer.from(mainScreenshot.data,'base64'));
 await evaluate(`document.querySelector('.site-language button:first-child').click()`);await pause();assert.equal(await evaluate('document.documentElement.lang'),'fr');
 assert.ok(await evaluate(`document.querySelector('#staff').textContent.includes('Devenir staff')`));
 await call('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});

 console.log('Checking programme responsive layouts and photographs');
 await evaluate("document.querySelector('#programme').scrollIntoView({behavior:'instant',block:'start'})");
 await new Promise(r=>setTimeout(r,1000));
 assert.equal(await evaluate("document.querySelectorAll('.programme-card').length"),3);
 assert.ok(await evaluate("!document.querySelector('#lieu')"));
 for (const [width,columns] of [[1280,3],[800,2],[390,1]]) {
   await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
   await pause();
   assert.equal(await evaluate("getComputedStyle(document.querySelector('.programme-grid')).gridTemplateColumns.split(' ').length"),columns);
   assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));
   await evaluate("document.querySelector('#programme').scrollIntoView({behavior:'instant',block:'start'})");
   await new Promise(r=>setTimeout(r,800));
   if(width===1280) {
     const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
     await writeFile(path.join(directory,'programme-desktop.png'),Buffer.from(capture.data,'base64'));
   }
 }
 await evaluate("document.querySelectorAll('.programme-card').forEach(e=>e.scrollIntoView({behavior:'instant'}))");
 await new Promise(r=>setTimeout(r,500));
 assert.ok(await evaluate("Array.from(document.querySelectorAll('.programme-photo img')).every(img=>img.complete&&img.naturalWidth>0&&img.alt&&img.loading==='lazy')"));
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause();
 assert.ok(await evaluate("Array.from(document.querySelectorAll('.programme-card')).every(e=>getComputedStyle(e).opacity==='1')"));
 await evaluate("document.querySelector('.programme-photo img').dispatchEvent(new Event('error'))");await pause();
 assert.ok(await evaluate("!!document.querySelector('.programme-placeholder')"));
 console.log('Programme verified: local photos, three/two/one columns, image fallback, reduced motion, no horizontal overflow.');
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));await new Promise(r=>registration.httpServer.close(r));}
