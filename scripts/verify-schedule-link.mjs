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
 for(const width of [320,390,430,768,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  for(const language of ['fr','en']) {
   await evaluate(`document.querySelector('.site-language button:${language==='fr'?'first':'last'}-child').click()`);await pause();
   await evaluate("window.scrollTo({top:0,behavior:'instant'})");await pause();
   assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.hero-actions a')).map(a=>a.getAttribute('href'))"),['/#packs','#histoire','#programme']);
   assert.equal(await evaluate("document.querySelector('.schedule-link').textContent.trim()"),language==='fr'?'Voir le planning':'View the schedule');
   assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow');
   assert.ok(await evaluate(`(()=>{const rects=[...document.querySelectorAll('.hero-actions a')].map(e=>e.getBoundingClientRect());return rects.every(r=>r.left>=0&&r.right<=innerWidth)&&!rects.some((a,i)=>rects.slice(i+1).some(b=>Math.min(a.right,b.right)>Math.max(a.left,b.left)+1&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+1));})()`),'Action overlap');
   if(language==='fr'&&(width===390||width===1440)){const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(directory,`hero-schedule-${width}.png`),Buffer.from(capture.data,'base64'));}
   await evaluate("document.querySelector('.schedule-link').click()");
   for(let n=0;n<40;n++){await pause();if(await evaluate("Math.abs(document.querySelector('#programme').getBoundingClientRect().top-document.querySelector('header').getBoundingClientRect().height-16)<2"))break;}
   assert.equal(await evaluate('location.hash'),'#programme');
   assert.ok(await evaluate("Math.abs(document.querySelector('#programme').getBoundingClientRect().top-document.querySelector('header').getBoundingClientRect().height-16)<2"),'Fixed header offset');
  }
  console.log(`${width}px: FR/EN labels, three original/new links, layout without overlap, schedule target and exact header offset verified.`);
 }
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await evaluate("window.scrollTo({top:0,behavior:'instant'});document.querySelector('.schedule-link').focus()");
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause();
 assert.ok(await evaluate("Math.abs(document.querySelector('#programme').getBoundingClientRect().top-document.querySelector('header').getBoundingClientRect().height-16)<2"));
 console.log('Keyboard activation and reduced motion verified.');
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));}