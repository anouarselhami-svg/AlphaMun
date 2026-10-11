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
 const names=['INTERPOL','INTERSS','UN WOMEN','ICJ','AU PSC','UNOOSA','UNICEF','UNODC','CSNU','OMS','CIGIA','ECOSOC','UNESCO','UE','MPS'];
 for(const width of [320,360,390,430,900,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  for(const language of ['fr','en']) {
   await evaluate(`document.querySelector('.site-language button:${language==='fr'?'first':'last'}-child').click();document.querySelector('.committee-filters button').click()`);await pause();
   assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.committee-toggle')).map(e=>e.getAttribute('aria-label').replace(/^(Show details for|Afficher les détails de) /,''))"),names);
   assert.equal(await evaluate("document.querySelectorAll('.committee-details:not([hidden])').length"),0);
   assert.equal(await evaluate("document.querySelectorAll('.committee-card .committee-meta,.committee-crisis,.committee-card > h3').length"),0);
   assert.equal(await evaluate("document.querySelectorAll('.committee-logo img').length"),15);
   assert.equal(await evaluate("document.querySelectorAll('.committee-logo-missing').length"),0);
   assert.deepEqual(await evaluate("[...document.querySelectorAll('.committee-controls .committee-flag')].map(e=>e.dataset.country)"),['en','en','en','en','en','en','en','en','fr','fr','fr','fr','fr','fr','ma']);
   assert.ok(await evaluate("[...document.querySelectorAll('.committee-flag')].every(e=>e.getAttribute('role')==='img'&&e.getAttribute('aria-label'))"));
   assert.ok(await evaluate("[...document.querySelectorAll('.committee-logo img')].every(e=>e.alt&&getComputedStyle(e).objectFit==='contain')"));
   assert.equal(await evaluate("document.querySelectorAll('.committee-crisis').length"),0);
   assert.equal(await evaluate("getComputedStyle(document.querySelector('.committee-grid')).gridTemplateColumns.split(' ').length"),width<=760?2:width>=1200?4:3);
   for(let i=0;i<15;i++) {
    await evaluate(`document.querySelectorAll('.committee-toggle')[${i}].click()`);await pause();
    assert.equal(await evaluate("document.querySelectorAll('.committee-details:not([hidden])').length"),1);
    assert.equal(await evaluate(`document.querySelectorAll('.committee-toggle')[${i}].getAttribute('aria-expanded')`),'true');
    assert.ok(await evaluate(`document.getElementById(document.querySelectorAll('.committee-toggle')[${i}].getAttribute('aria-controls'))!==null`));
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow');
   }
   await evaluate("document.querySelectorAll('.committee-toggle')[14].click();document.querySelectorAll('.committee-toggle')[2].focus()");
   await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
   await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause();
   assert.ok(await evaluate("!document.querySelector('#committee-details-un-women').hidden"));
   assert.ok(await evaluate(`document.querySelector('#committee-details-un-women').textContent.includes(${JSON.stringify(language==='en'?'Tradition v. equality: breaking the cycle of harmful practices and sexual violence to protect women’s rights across different cultures and legal systems.':'Tradition et égalité : briser le cycle des pratiques néfastes et des violences sexuelles pour protéger les droits des femmes dans différents contextes culturels et systèmes juridiques.')})`));
   await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
   await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});await pause();
   assert.ok(await evaluate("document.querySelector('#committee-details-un-women').hidden"));
   for(const [index,count] of [[1,6],[2,8],[0,15]]) {
    await evaluate(`document.querySelectorAll('.committee-filters button')[${index}].click()`);await pause();
    assert.equal(await evaluate("document.querySelectorAll('.committee-card').length"),count);
    assert.equal(await evaluate(`document.querySelectorAll('.committee-filters button')[${index}].getAttribute('aria-pressed')`),'true');
   }
   assert.ok(await evaluate("Array.from(document.querySelectorAll('.committee-meta,.committee-toggle')).every(e=>e.scrollWidth<=e.clientWidth)"),'Card text overflow');
   assert.equal(await evaluate("document.querySelector('.committee-registration').getAttribute('href')"),'/#packs');
   assert.equal(await evaluate("document.querySelectorAll('#programme .programme-slots li').length"),26);
   assert.equal(await evaluate("document.querySelectorAll('.board-card').length"),13);
  }
  await evaluate("document.querySelectorAll('.committee-logo img').forEach(img=>img.loading='eager');document.querySelector('.committee-filters').scrollIntoView({behavior:'instant',block:'center'})");await pause();
  await new Promise(r=>setTimeout(r,500));
  assert.ok(await evaluate("[...document.querySelectorAll('.committee-logo img')].every(e=>e.complete&&e.naturalWidth>0)"),'Logo loading');
  const alpha=await evaluate(`(()=>{return [...document.querySelectorAll('.committee-logo img')].map(img=>{const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const context=canvas.getContext('2d');context.drawImage(img,0,0);const {data}=context.getImageData(0,0,canvas.width,canvas.height);let clear=0,solid=0;for(let i=3;i<data.length;i+=4){if(data[i]===0)clear++;if(data[i]===255)solid++;}return {src:img.getAttribute('src'),clear,solid,corners:[data[3],data[(canvas.width-1)*4+3],data[(canvas.width*(canvas.height-1))*4+3],data[data.length-1]],sameBackground:getComputedStyle(img.parentElement).backgroundColor===getComputedStyle(img.closest('.committee-card')).backgroundColor};});})()`);
  assert.equal(alpha.length,15);
  assert.ok(alpha.every(item=>item.src.endsWith('-transparent.png')&&item.clear>0&&item.solid>0&&item.corners.every(value=>value===0)&&item.sameBackground),'Transparent PNGs and uniform cream backgrounds');
  const bounds=await evaluate("(()=>{const r=document.querySelector('#comites').getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1};})()");
  const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:bounds});await writeFile(path.join(directory,`committees-transparent-${width}.png`),Buffer.from(capture.data,'base64'));
  console.log(`${width}px: 15 committees, FR/EN, 2/3/4 columns, exclusive disclosure, keyboard/ARIA, language filters, topic, no overflow; programme/board/registration preserved.`);
 }
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));}