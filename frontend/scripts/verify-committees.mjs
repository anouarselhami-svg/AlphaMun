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
 for(const width of [320,390,900,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  for(const language of ['fr','en']) {
   await navigate('http://127.0.0.1:5200/');
   await evaluate(`document.querySelector('.site-language button:${language==='fr'?'first':'last'}-child').click()`);
   assert.equal(await evaluate("document.querySelectorAll('.committee-filters button').length"),3);
   assert.equal(await evaluate("document.querySelectorAll('.committee-card').length"),0);
   assert.ok(await evaluate("document.querySelector('#committee-grid').hidden"));
   assert.ok(await evaluate("[...document.querySelectorAll('.committee-filters button')].every(b=>b.getAttribute('aria-expanded')==='false'&&b.querySelector('svg'))"));
   assert.equal(await evaluate("new Set([...document.querySelectorAll('.committee-filters button')].map(b=>b.getBoundingClientRect().top)).size"),1);
   for(const [index,count] of [[0,6],[1,6],[2,1]]) {
    await evaluate(`document.querySelectorAll('.committee-filters button')[${index}].click()`);await pause();
    assert.equal(await evaluate("document.querySelectorAll('.committee-card').length"),count);
    assert.equal(await evaluate("document.querySelectorAll('.committee-filters button[aria-expanded=true]').length"),1);
    assert.equal(await evaluate("document.querySelectorAll('.committee-details:not([hidden])').length"),0);
    assert.equal(await evaluate("document.querySelectorAll('.committee-card .committee-flag').length"),0);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.committee-grid')).gridTemplateColumns.split(' ').length"),width<=760?2:4);
    for(const dimension of ['height','width']) assert.equal(await evaluate(`new Set([...document.querySelectorAll('.committee-card')].map(b=>Math.round(b.getBoundingClientRect().${dimension}))).size`),1);
    await evaluate("document.querySelectorAll('.committee-logo img').forEach(img=>img.loading='eager');document.querySelector('.committee-filters').scrollIntoView({behavior:'instant',block:'center'})");
    for(let i=0;i<30;i++){if(await evaluate("[...document.querySelectorAll('.committee-logo img')].every(i=>i.complete&&i.naturalWidth>0)"))break;await pause();}
    assert.ok(await evaluate("[...document.querySelectorAll('.committee-logo img')].every(i=>i.complete&&i.naturalWidth>0)"));
    for(let i=0;i<count;i++) {
     await evaluate(`document.querySelectorAll('.committee-toggle')[${i}].click()`);await pause();
     assert.equal(await evaluate("document.querySelectorAll('.committee-details:not([hidden])').length"),1);
     assert.ok(await evaluate(`(()=>{const b=document.querySelectorAll('.committee-toggle')[${i}];const d=document.getElementById(b.getAttribute('aria-controls'));return b.getAttribute('aria-expanded')==='true'&&!d.hidden&&d.querySelector('h3').textContent.length>0&&d.querySelector('p').textContent.length>0&&getComputedStyle(b.querySelector('svg')).transform!=='none';})()`));
     assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'No horizontal overflow');
     await evaluate(`document.querySelectorAll('.committee-toggle')[${i}].click()`);
     assert.equal(await evaluate("document.querySelectorAll('.committee-details:not([hidden])').length"),0);
    }
    await evaluate("document.querySelector('.committee-toggle').focus()");
    for(const [key,code,vk] of [['Enter','Enter',13],[' ','Space',32]]) {
     await call('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:vk,...(key==='Enter'?{text:'\r'}:{})});
     await call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk});await pause();
     assert.equal(await evaluate("document.querySelector('.committee-toggle').getAttribute('aria-expanded')"),key==='Enter'?'true':'false');
    }
    const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(directory,`committees-${width}-${language}-${index}.png`),Buffer.from(capture.data,'base64'));
    await evaluate(`document.querySelectorAll('.committee-filters button')[${index}].click()`);
    assert.ok(await evaluate("document.querySelector('#committee-grid').hidden"));
    assert.equal(await evaluate("document.querySelectorAll('.committee-card').length"),0);
   }
   await evaluate("document.querySelectorAll('.committee-filters button')[0].click()");await pause();
   await evaluate("document.querySelector('.committee-toggle').click()");await pause();
   await evaluate("document.querySelectorAll('.committee-filters button')[1].click()");await pause();
   assert.equal(await evaluate("document.querySelectorAll('.committee-filters button[aria-expanded=true]').length"),1);
   assert.equal(await evaluate("document.querySelectorAll('.committee-details:not([hidden])').length"),0);
   assert.equal(await evaluate("document.querySelectorAll('.committee-card').length"),6);
   await evaluate("document.querySelectorAll('.committee-filters button')[1].focus()");
   for(const [key,code,vk] of [['Enter','Enter',13],[' ','Space',32]]) {
    await call('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:vk,...(key==='Enter'?{text:'\r'}:{})});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk});await pause();
    assert.equal(await evaluate("document.querySelector('#committee-grid').hidden"),key==='Enter');
   }
   assert.equal(await evaluate("document.querySelector('.committee-registration').getAttribute('href')"),'/#packs');
   console.log(`${width}px ${language}: 13 committees (6 FR/6 EN/1 AR), both disclosures, exclusive language/reset, keyboard/ARIA, loaded logos, uniform cards, ${width<=760?2:4} columns, no overflow, registration preserved.`);
  }
 }
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));}