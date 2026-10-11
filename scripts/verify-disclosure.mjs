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
 const slots="document.querySelectorAll('[role=tabpanel]:not([hidden]) .programme-slots li:not([hidden])').length";
 const members="document.querySelectorAll('.board-card:not([hidden])').length";
 for(const width of [320,390,768,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  for(const language of ['fr','en']) {
   await evaluate(`document.querySelector('.site-language button:${language==='fr'?'first':'last'}-child').click()`);await pause();
   assert.equal(await evaluate(members),3);
   for(let day=0;day<3;day++) {
    await evaluate(`document.querySelector('#programme-tab-${day}').click()`);await pause();
    assert.equal(await evaluate(slots),3);
    assert.equal(await evaluate("document.querySelector('#programme .disclosure-button').getAttribute('aria-expanded')"),'false');
    assert.equal(await evaluate("document.querySelector('#programme .disclosure-button').textContent"),language==='fr'?'Voir le programme complet ↓':'View the full programme ↓');
    await evaluate("document.querySelector('#programme .disclosure-button').focus()");
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause();
    assert.equal(await evaluate(slots),[9,12,5][day]);
    assert.equal(await evaluate("document.querySelector('#programme .disclosure-button').getAttribute('aria-expanded')"),'true');
    assert.equal(await evaluate("document.querySelector('#programme .disclosure-button').textContent"),language==='fr'?'Réduire le programme ↑':'Show less of the programme ↑');
    assert.ok(await evaluate("document.getElementById(document.querySelector('#programme .disclosure-button').getAttribute('aria-controls'))!==null"));
    if(day<2) continue;
    await evaluate("document.querySelector('#programme .disclosure-button').scrollIntoView({behavior:'instant',block:'center'});document.querySelector('#programme .disclosure-button').click()");await pause();
    assert.equal(await evaluate(slots),3);
    assert.ok(await evaluate("document.querySelector('.programme-schedule').getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().height"),'Programme scroll restoration');
   }
   assert.equal(await evaluate("document.querySelector('#bureau .disclosure-button').textContent"),language==='fr'?'Voir toute l’équipe ↓':'View the whole team ↓');
   await evaluate("document.querySelector('#bureau .disclosure-button').click()");await pause();
   assert.equal(await evaluate(members),11);
   assert.equal(await evaluate("document.querySelector('#bureau .disclosure-button').getAttribute('aria-expanded')"),'true');
   assert.equal(await evaluate("document.querySelector('#bureau .disclosure-button').textContent"),language==='fr'?'Réduire l’équipe ↑':'Show less of the team ↑');
   await evaluate("document.querySelector('#bureau .disclosure-button').scrollIntoView({behavior:'instant',block:'center'});document.querySelector('#bureau .disclosure-button').focus()");
   await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
   await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});await pause();
   assert.equal(await evaluate(members),3);
   assert.ok(await evaluate("document.querySelector('#bureau').getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().height"),'Board scroll restoration');
   assert.ok(await evaluate("document.activeElement.matches('#bureau .disclosure-button')"),'Focus retained');
   assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),'Overflow');
   assert.ok(await evaluate("document.getElementById(document.querySelector('#bureau .disclosure-button').getAttribute('aria-controls'))!==null"));
  }
  await evaluate("document.querySelector('#bureau').scrollIntoView({behavior:'instant',block:'start'})");await pause();
  const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(directory,`compact-${width}.png`),Buffer.from(capture.data,'base64'));
  console.log(`${width}px: FR/EN expand/collapse, day reset, Enter/Space, ARIA, focus, scroll restoration, no overflow.`);
 }
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));}