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
 for(const width of [320,360,390,430,768,1024,1280,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  for(const language of ['fr','en']) {
   await evaluate(`document.querySelector('.site-language button:${language==='fr'?'first':'last'}-child').click()`);await pause();
   assert.equal(await evaluate("document.querySelectorAll('.programme-tabs,.programme-schedule').length"),0);
   assert.equal(await evaluate("document.querySelectorAll('.programme-day-panel:not([hidden])').length"),0);
   assert.equal(await evaluate("document.querySelectorAll('#programme .programme-slots li').length"),26);
   assert.equal(await evaluate("getComputedStyle(document.querySelector('.programme-grid')).gridTemplateColumns.split(' ').length"),width<=640?1:width<=1000?2:3);
   const before=await evaluate("[...document.querySelectorAll('.programme-card')].map(e=>e.getBoundingClientRect().height)");
   const closed=await evaluate(`(()=>{return [...document.querySelectorAll('.programme-card')].map(card=>{const r=card.getBoundingClientRect(),photo=card.querySelector('.programme-photo').getBoundingClientRect(),button=card.querySelector('.programme-day-toggle').getBoundingClientRect(),copy=card.querySelector('.programme-card-copy');return {height:r.height,width:r.width,top:r.top,photo:photo.height,button:button.top,bottomGap:r.bottom-button.bottom,padding:getComputedStyle(copy).padding};});})()`);
   if(width>1000){
     for(const card of closed){assert.ok(Math.abs(card.height-closed[0].height)<1,'Equal closed heights');assert.ok(Math.abs(card.width-closed[0].width)<1,'Equal widths');assert.ok(Math.abs(card.photo-closed[0].photo)<1,'Equal photos');assert.ok(Math.abs(card.button-closed[0].button)<1,'Aligned buttons');assert.ok(Math.abs(card.bottomGap-closed[0].bottomGap)<1,'Equal bottom spacing');assert.equal(card.padding,closed[0].padding);}
   }
   assert.ok(await evaluate("[...document.querySelectorAll('.programme-presentation-content h3,.programme-venue,.programme-description')].every(e=>e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight)"),'Unclipped presentation text');
   for(let day=0;day<3;day++) {
    await evaluate(`document.querySelector('#programme-tab-${day}').click()`);await pause();
    assert.equal(await evaluate("document.querySelectorAll('.programme-day-panel:not([hidden])').length"),day+1);
    assert.equal(await evaluate(`document.querySelector('#programme-tab-${day}').getAttribute('aria-expanded')`),'true');
    assert.ok(await evaluate(`document.querySelector('#programme-panel-${day}').closest('.programme-card')===document.querySelectorAll('.programme-card')[${day}]`));
    assert.equal(await evaluate(`document.querySelector('#programme-panel-${day}').querySelectorAll('li').length`),[9,12,5][day]);
    assert.ok(await evaluate(`(()=>{const card=document.querySelectorAll('.programme-card')[${day}],photo=card.querySelector('.programme-photo').getBoundingClientRect(),venue=card.querySelector('.programme-venue').getBoundingClientRect(),button=card.querySelector('button').getBoundingClientRect(),panel=card.querySelector('.programme-day-panel').getBoundingClientRect();return photo.bottom<=venue.top&&venue.bottom<=button.top&&button.bottom<=panel.top;})()`),'Photo/venue/control/schedule order');
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow');
    if(day===0&&width>1000){const after=await evaluate("[...document.querySelectorAll('.programme-card')].map(e=>e.getBoundingClientRect().height)");assert.equal(after[1],before[1]);assert.equal(after[2],before[2]);assert.ok(after[0]>before[0]);}
   }
   if(language==='fr'||width===1440){
    await evaluate("window.scrollTo({top:scrollY+document.querySelector('.programme-grid').getBoundingClientRect().top-document.querySelector('header').offsetHeight-16,behavior:'instant'})");await pause();
    const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(directory,`programme-cards-${width}-${language}.png`),Buffer.from(capture.data,'base64'));
   }
   for(let day=0;day<3;day++){
    await evaluate(`document.querySelector('#programme-tab-${day}').focus()`);
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause();
    assert.equal(await evaluate(`document.querySelector('#programme-tab-${day}').getAttribute('aria-expanded')`),'false');
   }
  }
  console.log(`${width}px: shared cards, independent toggles, correct order, 26 slots, FR/EN, keyboard/ARIA, no overflow or sibling stretching.`);
 }
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));}