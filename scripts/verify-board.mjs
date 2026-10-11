import assert from 'node:assert/strict';
import { preview } from 'vite';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const main=await preview({configFile:false,preview:{host:'127.0.0.1',port:5200,strictPort:true}});

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
 await navigate('http://127.0.0.1:5200/');
 await evaluate("document.querySelector('.board-toggle').click()");await pause();
 const expectedNames=['Hajar El Khachai','Rania Aqachmar','Marouane Lrhoul','Miral Hatta','Laila Addab','Yasmine Bentaleb','Nidal ElHammioui','Meryem Hajji','Adam Dekiouak','Asmae Ajabbade','Yasmine Alaoui'];
 const fr=['Présidente','Vice-présidente','Secrétaire général','Head of Academic Affairs','Head of Committees','Head of Committees','Head of Communication','Head of Media','Head of Staff','Head of Sponsorships','Trésorière'];
 const en=['President','Vice-President','Secretary-General',...fr.slice(3,10),'Treasurer'];
 for(const width of [320,360,390,430,768,1024,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  for(const language of ['fr','en']) {
   await evaluate(`document.querySelector('.site-language button:${language==='fr'?'first':'last'}-child').click()`);await pause();
   assert.equal(await evaluate("document.querySelectorAll('#bureau').length"),1);
   assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.board-card h3')).map(e=>e.textContent)"),expectedNames);
   assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.board-card p')).map(e=>e.textContent)"),language==='fr'?fr:en);
   assert.equal(await evaluate("document.querySelector('#board-title').textContent"),language==='fr'?'Notre équipe organisatrice':'Our organising team');
   assert.equal(await evaluate("document.querySelectorAll('.board-avatar img').length"),0);
   assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.board-avatar')).map(e=>e.textContent)"),['HEK','RA','ML','MH','LA','YB','NE','MH','AD','AA','YA']);
   assert.ok(await evaluate("Array.from(document.querySelectorAll('.board-card h3,.board-card p')).every(e=>e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight)"),'Clipped name or role');
   assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),'Horizontal overflow');
   assert.equal(await evaluate("getComputedStyle(document.querySelector('.board-grid')).gridTemplateColumns.split(' ').length"),width<=1000?2:3);
   const geometry=await evaluate(`(()=>{
     const cards=[...document.querySelectorAll('.board-card')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width};});
     const grid=document.querySelector('.board-grid').getBoundingClientRect();
     return {cards,center:(grid.left+grid.right)/2,avatars:[...document.querySelectorAll('.board-avatar')].map(e=>e.getBoundingClientRect().width),overlap:cards.some((a,i)=>cards.slice(i+1).some(b=>Math.min(a.right,b.right)>Math.max(a.left,b.left)+1&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+1))};
   })()`);
   assert.ok(!geometry.overlap,'Overlapping cards');
   if(width<=540) {
     assert.ok(geometry.avatars.every(size=>size===56),'Mobile avatar diameter');
     for(let row=0;row<5;row++) {
       const [a,b]=geometry.cards.slice(row*2,row*2+2);
       assert.ok(Math.abs(a.top-b.top)<1,'Two members per row');
       assert.ok(Math.abs(a.width-b.width)<1,'Equal card widths');
     }
     const last=geometry.cards[10];
     assert.ok(Math.abs(last.width-geometry.cards[0].width)<1,'Last card width');
     assert.ok(Math.abs((last.left+last.right)/2-geometry.center)<1,'Last member centered');
   } else assert.ok(geometry.avatars.every(size=>size===88),'Desktop/tablet avatar preserved');
  }
  await evaluate("document.querySelector('#bureau').scrollIntoView({behavior:'instant',block:'start'})");await pause();
  const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(path.join(directory,`board-${width}.png`),Buffer.from(capture.data,'base64'));
  console.log(`${width}px: 11 members in order, roles FR/EN, initials, readable responsive grid, no overflow.`);
 }
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));}