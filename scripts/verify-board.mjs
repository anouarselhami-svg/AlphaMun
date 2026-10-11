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
 const expected=['Hajar El Khachai','Rania Aqachmar','Marouane Lrhoul','Miral Hatta','Lailla Addab','Yasmine Bentaleb','Adam Dkouik','Zineb Maftah','Lina Sbaybi','Nidal Hammioui','Meryem Hajji','Asmae Ajbade','Yasmine Alaoui'];
 const fr=['Présidente','Vice-présidente','Secrétaire général','Responsable des affaires académiques','Responsable des comités','Responsable des comités','Responsable du staff','Responsable des affaires des délégués','Coordinatrice de l’événement','Responsable de la communication','Responsable des médias','Responsable des partenariats','Trésorière'];
 const en=['President','Vice-President','Secretary-General','Head of Academic Affairs','Head of Committees','Head of Committees','Head of Staff','Head of Delegate Affairs','Event Coordinator','Head of Communication','Head of Media','Head of Sponsorships','Treasurer'];
 const key=async(k,c,n)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:k,code:c,windowsVirtualKeyCode:n,...(k==='Enter'?{text:'\r'}:{})});await call('Input.dispatchKeyEvent',{type:'keyUp',key:k,code:c,windowsVirtualKeyCode:n});await pause();};
 for(const width of [320,360,390,430,768,1024,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  for(const language of ['fr','en']) {
   await evaluate(`document.querySelector('.site-language button:${language==='fr'?'first':'last'}-child').click()`);await pause();
   assert.equal(await evaluate("document.querySelectorAll('#board-title button,#board-title svg').length"),0);
   assert.deepEqual(await evaluate("[...document.querySelectorAll('.board-card h3')].map(e=>e.textContent)"),expected);
   assert.deepEqual(await evaluate("[...document.querySelectorAll('.board-role')].map(e=>e.textContent)"),language==='fr'?fr:en);
   assert.equal(await evaluate("document.querySelectorAll('.board-grid:not([hidden])').length"),0);
   assert.equal(await evaluate("document.querySelectorAll('.board-leaders .board-department-label').length"),0);
   const leaders=await evaluate("[...document.querySelectorAll('.board-leaders .board-card')].map(e=>{const r=e.getBoundingClientRect();return {top:r.top,width:r.width};})");
   assert.ok(leaders.every(r=>Math.abs(r.top-leaders[0].top)<1&&Math.abs(r.width-leaders[0].width)<1),'Three equal leaders on one row');
   for(let i=0;i<4;i++) {
    await evaluate(`document.querySelectorAll('.board-department-toggle')[${i}].focus()`);await key('Enter','Enter',13);
    assert.equal(await evaluate("document.querySelectorAll('.board-grid:not([hidden])').length"),i+1);
    assert.equal(await evaluate(`document.querySelectorAll('.board-department-toggle')[${i}].getAttribute('aria-expanded')`),'true');
    assert.ok(await evaluate(`document.getElementById(document.querySelectorAll('.board-department-toggle')[${i}].getAttribute('aria-controls'))!==null`));
   }
   assert.equal(await evaluate("document.querySelectorAll('.board-department-label').length"),10);
   assert.ok(await evaluate("[...document.querySelectorAll('.board-card h3,.board-card p')].every(e=>e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight)"),'Clipped text');
   assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow');
   const grids=await evaluate("[...document.querySelectorAll('.board-grid')].map(grid=>{const g=grid.getBoundingClientRect();return {center:(g.left+g.right)/2,cards:[...grid.children].map(e=>{const r=e.getBoundingClientRect();return {top:r.top,width:r.width,center:(r.left+r.right)/2};})};})");
   for(const grid of grids){const [a,b,c]=grid.cards;assert.ok(Math.abs(a.top-b.top)<1&&Math.abs(a.width-b.width)<1);if(c&&width<=760){assert.ok(c.top>a.top);assert.ok(Math.abs(c.width-a.width)<1&&Math.abs(c.center-grid.center)<1);}if(c&&width>760)assert.ok(Math.abs(c.top-a.top)<1);}
   if(language==='fr'){
    await evaluate("window.scrollTo({top:window.scrollY+document.querySelector('#bureau').getBoundingClientRect().top-document.querySelector('header').offsetHeight-16,behavior:'instant'})");await pause();
    const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(directory,`board-departments-${width}.png`),Buffer.from(capture.data,'base64'));
   }
   for(let i=0;i<4;i++){await evaluate(`document.querySelectorAll('.board-department-toggle')[${i}].focus()`);await key(' ','Space',32);assert.equal(await evaluate(`document.querySelectorAll('.board-department-toggle')[${i}].getAttribute('aria-expanded')`),'false');}
  }
  console.log(`${width}px: 13 names and FR/EN roles, three leaders, independent departments, mobile two columns/centered third, desktop rows, keyboard/ARIA, no clipping/overflow.`);
 }
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));}