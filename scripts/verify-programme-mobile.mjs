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
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const width of [320,360,390,430,640,768,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<=640});await pause();
  for(const language of ['fr','en']) {
   await evaluate(`document.querySelector('.site-language button:${language==='fr'?'first':'last'}-child').click()`);await pause();
   assert.equal(await evaluate("document.querySelectorAll('#programme .programme-slots li').length"),26);
   assert.equal(await evaluate("document.querySelectorAll('#programme .programme-day-panel:not([hidden])').length"),0);
   assert.equal(await evaluate("document.querySelectorAll('.programme-card').length"),3);
   const mobile=width<=640;
   assert.equal(await evaluate("document.querySelectorAll('.programme-day-toggle').length"),mobile?3:0);
   assert.equal(await evaluate("document.querySelectorAll('.programme-tabs').length"),mobile?0:1);
   for(let day=0;day<3;day++) {
    const id=`programme-${mobile?'mobile-':''}tab-${day}`;
    const panelId=`programme-${mobile?'mobile-':''}panel-${day}`;
    await evaluate(`document.getElementById('${id}').click()`);await pause();
    assert.equal(await evaluate(`document.getElementById('${id}').getAttribute('aria-expanded')`),'true');
    assert.equal(await evaluate(`document.getElementById('${id}').getAttribute('aria-controls')`),panelId);
    assert.ok(await evaluate(`!document.getElementById('${panelId}').hidden`));
    assert.equal(await evaluate(`document.getElementById('${panelId}').querySelectorAll('li').length`),[9,12,5][day]);
    assert.ok(await evaluate(`getComputedStyle(document.getElementById('${id}').querySelector('svg')).transform.includes('-1')`));
    if(mobile) {
     assert.ok(await evaluate(`document.getElementById('${panelId}').closest('.programme-card')===document.querySelectorAll('.programme-card')[${day}]`));
     assert.ok(await evaluate(`(()=>{const panel=document.getElementById('${panelId}').getBoundingClientRect(),title=document.getElementById('${id}').getBoundingClientRect();const next=document.querySelectorAll('.programme-card')[${day+1}];return panel.top>=title.bottom&&(!next||panel.bottom<=next.getBoundingClientRect().top);})()`),'Panel before next photograph');
     assert.ok(await evaluate(`(()=>{const b=document.getElementById('${id}').getBoundingClientRect(),s=document.getElementById('${id}').querySelector('svg').getBoundingClientRect();return Math.abs((b.top+b.bottom)/2-(s.top+s.bottom)/2)<2;})()`),'Chevron alignment');
    }
   }
   if(mobile) assert.equal(await evaluate("document.querySelectorAll('#programme .programme-day-panel:not([hidden])').length"),3);
   else assert.equal(await evaluate("document.querySelectorAll('#programme .programme-day-panel:not([hidden])').length"),1);
   if(language==='fr'&&(width===390||width===1440)) {
    await evaluate(`document.getElementById('programme-${mobile?'mobile-':''}tab-0').scrollIntoView({behavior:'instant',block:'center'})`);await pause();
    const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(directory,`programme-inline-${width}.png`),Buffer.from(capture.data,'base64'));
   }
   for(let day=0;day<3;day++) {
    if(!mobile&&day!==2)continue;
    const id=`programme-${mobile?'mobile-':''}tab-${day}`;
    await evaluate(`document.getElementById('${id}').focus()`);
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause();
    assert.equal(await evaluate(`document.getElementById('${id}').getAttribute('aria-expanded')`),'false');
   }
   assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow');
  }
  console.log(`${width}px: FR/EN, 26 slots, photos and day order, inline mobile panels, independent toggles, desktop layout, keyboard, ARIA, chevron alignment, no overflow.`);
 }
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));}