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
 for (const width of [320,360,390,430,768,1024,1280,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  for (const language of ['fr','en']) {
   await evaluate(`document.querySelector('.site-language button:${language==='fr'?'first':'last'}-child').click()`);await pause();
   assert.equal(await evaluate('document.documentElement.lang'),language);
   const geometry=await evaluate(`(()=>{
    const elements=[...document.querySelectorAll('header .brand,header .button.small,header .site-language,header .menu')].filter(e=>getComputedStyle(e).display!=='none');
    const rects=elements.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}});
    const overlap=rects.some((a,i)=>rects.slice(i+1).some(b=>Math.min(a.right,b.right)>Math.max(a.left,b.left)+1 && Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+1));
    return {overlap,inside:rects.every(r=>r.left>=0&&r.right<=innerWidth),overflow:document.documentElement.scrollWidth>innerWidth,brandClipped:document.querySelector('.brand').scrollWidth>document.querySelector('.brand').clientWidth,buttonWidth:document.querySelector('header .button.small').getBoundingClientRect().width};
   })()`);
   assert.ok(!geometry.overlap,`${width} ${language}: overlap`);assert.ok(geometry.inside,`${width} ${language}: header bounds`);assert.ok(!geometry.overflow,`${width} ${language}: overflow`);assert.ok(!geometry.brandClipped,`${width}: brand clipped`);
   if(width<=1100) {
    assert.ok(geometry.buttonWidth<150);
    await evaluate("document.querySelector('.menu').click()");await pause();
    assert.equal(await evaluate("document.querySelector('.menu').getAttribute('aria-expanded')"),'true');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('header nav')).display"),'flex');
    assert.ok(await evaluate("document.querySelector('header nav').getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().bottom-1"));
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await pause();
    assert.equal(await evaluate("document.querySelector('.menu').getAttribute('aria-expanded')"),'false');
    await evaluate("document.querySelector('.menu').click()");await pause();
    await evaluate("document.querySelector('header nav a[href=\"/#programme\"]').click()");await pause();
    assert.equal(await evaluate("document.querySelector('.menu').getAttribute('aria-expanded')"),'false');
   }
   await evaluate("document.querySelector('header .button.small').click()");await pause();
   assert.equal(await evaluate('location.hash'),'#packs');
   await evaluate("window.scrollTo({top:0,behavior:'instant'})");await pause();
  }
  const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(path.join(directory,`header-${width}.png`),Buffer.from(capture.data,'base64'));
  console.log(`${width}px: FR/EN, no overlap/overflow, registration and menu verified.`);
 }
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));}