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
 const panel="document.querySelectorAll('.programme-schedule [role=region]:not([hidden])').length";
 const press=async(key,code,n)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:n,...(key==='Enter'?{text:'\r'}:{})});await call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:n});await pause();};
 for(const width of [768,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  for(const language of ['fr','en']) {
   await evaluate(`document.querySelector('.site-language button:${language==='fr'?'first':'last'}-child').click()`);await pause();
   assert.equal(await evaluate(panel),0);
   assert.ok(await evaluate("document.querySelector('#board-members').hidden"));
   assert.equal(await evaluate("document.querySelectorAll('.disclosure-button').length"),0);
   assert.equal(await evaluate("document.querySelectorAll('.programme-photo img').length"),3);
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
   for(let day=0;day<3;day++) {
    await evaluate(`document.querySelector('#programme-tab-${day}').click()`);await pause();
    assert.equal(await evaluate(panel),1);
    assert.equal(await evaluate("document.querySelector('.programme-schedule [role=region]:not([hidden])').id"),`programme-panel-${day}`);
    assert.equal(await evaluate("document.querySelector('.programme-schedule [role=region]:not([hidden]) ol').children.length"),[9,12,5][day]);
    assert.equal(await evaluate(`document.querySelector('#programme-tab-${day}').getAttribute('aria-expanded')`),'true');
    assert.ok(await evaluate(`getComputedStyle(document.querySelector('#programme-tab-${day} .icon')).transform.includes('-1')`));
   }
   await evaluate("document.querySelector('#programme-tab-2').focus()");
   await press('Enter','Enter',13);assert.equal(await evaluate(panel),0);
   await press(' ','Space',32);assert.equal(await evaluate(panel),1);
   await press('Enter','Enter',13);assert.equal(await evaluate(panel),0);
   assert.equal(await evaluate("document.querySelector('#programme-tab-2 .icon').getBoundingClientRect().height"),18);
   const geometry=await evaluate(`(()=>{const button=document.querySelector('#programme-tab-2').getBoundingClientRect(),icon=document.querySelector('#programme-tab-2 .icon').getBoundingClientRect();return Math.abs((button.top+button.bottom)/2-(icon.top+icon.bottom)/2)})()`);
   assert.ok(geometry<2,'Chevron vertical alignment');
   await evaluate("document.querySelector('.board-toggle').focus()");await press('Enter','Enter',13);
   assert.ok(await evaluate("!document.querySelector('#board-members').hidden"));
   assert.equal(await evaluate("document.querySelectorAll('#board-members .board-card').length"),11);
   assert.equal(await evaluate("document.querySelector('.board-toggle').getAttribute('aria-expanded')"),'true');
   assert.equal(await evaluate("document.querySelector('.board-toggle').getAttribute('aria-controls')"),'board-members');
   assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Overflow');
   await press(' ','Space',32);assert.ok(await evaluate("document.querySelector('#board-members').hidden"));
   assert.equal(await evaluate("document.querySelector('.board-toggle').getAttribute('aria-expanded')"),'false');
  }
  await evaluate("document.querySelector('#programme-tab-0').scrollIntoView({behavior:'instant',block:'center'})");await pause();
  const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(directory,`chevrons-${width}.png`),Buffer.from(capture.data,'base64'));
  console.log(`${width}px: FR/EN, initially closed, exclusive day opening, same-day closing, full content, Enter/Space, ARIA, chevrons, no overflow.`);
 }
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));}