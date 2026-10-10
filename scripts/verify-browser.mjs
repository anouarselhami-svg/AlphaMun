import assert from 'node:assert/strict';
import { preview } from 'vite';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const main=await preview({configFile:false,preview:{host:'127.0.0.1',port:5200,strictPort:true}});
const registration=await preview({configFile:false,root:path.resolve('registration-site'),preview:{host:'127.0.0.1',port:5201,strictPort:true}});
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
 console.log('Checking main site');
 await navigate('http://127.0.0.1:5200/');
 const links=await evaluate(`Array.from(document.querySelectorAll('#packs a')).map(a=>({href:a.href,target:a.target,rel:a.rel}))`);
 assert.deepEqual(links.map(l=>l.href),['https://inscription.youthglobalclub.com/?pack=500','https://inscription.youthglobalclub.com/?pack=1500']);assert.ok(links.every(l=>l.target==='_blank'&&l.rel.includes('noopener')));
 assert.ok(await evaluate(`Array.from(document.querySelectorAll('a')).filter(a=>a.textContent.includes('S’inscrire')||a.textContent.includes('Devenir délégué')).every(a=>a.hash==='#packs')`));
 const set=async(name,value)=>{await evaluate(`(()=>{const e=document.querySelector('[name="${name}"]');const setter=Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;setter.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await pause();};
 const click=async text=>{assert.ok(await evaluate(`(()=>{const button=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)});button?.click();return !!button;})()`),text);await pause();};
 console.log('Checking pack entry URLs');
 for(const pack of ['500','1500']){await navigate(`http://127.0.0.1:5201/?pack=${pack}`);assert.match(await evaluate(`document.querySelector('.selected-pack').textContent`),pack==='500'?/500 MAD/:/1 500 MAD/);assert.equal(await evaluate(`document.querySelectorAll('.registration-progress li').length`),5);await call('Page.reload');await pause();await pause();assert.match(await evaluate(`document.querySelector('.selected-pack').textContent`),pack==='500'?/500 MAD/:/1 500 MAD/);}
 await navigate('http://127.0.0.1:5201/?pack=1550');assert.ok(await evaluate(`!!document.querySelector('.selected-pack select')`));
 await navigate('http://127.0.0.1:5201/?pack=500');
 console.log('Checking step validations');
 await click('EN');assert.ok(await evaluate(`document.querySelector('h1').textContent.includes('Registration for Alpha MUN 8')`));assert.ok(await evaluate(`document.querySelector('.selected-pack').textContent.includes('Normal Package')`));await click('FR');
 await click('Suivant');assert.ok(await evaluate(`!!document.querySelector('#prenom-error')`));
 for(const [name,value] of Object.entries({prenom:'Local',nom:'Browser',email:'local@example.com',age:'17',telephone:'+212600000000',etablissement:'Local school',niveau:'Grade',ville:'City'}))await set(name,value);
 await click('Suivant');assert.ok(await evaluate(`!!document.querySelector('#contact_parent-error')`));await set('contact_parent','+212611111111');await click('Suivant');
 await set('comite_choix_1','INTERPOL');
 assert.ok(await evaluate(`document.querySelector('[name="comite_choix_2"] option[value="INTERPOL"]').disabled`));
 await set('comite_choix_2','UE');await set('comite_choix_3','MPS');await set('participations_mun','0');
 await click('EN');assert.ok(await evaluate(`document.querySelector('[name="comite_choix_1"] option[value="MPS"]').textContent.includes('Moroccan dialect')`));await click('FR');
 await click('Précédent');assert.equal(await evaluate(`document.querySelector('[name="prenom"]').value`),'Local');await click('Suivant');await click('Suivant');
 assert.ok(await evaluate(`!!document.querySelector('[name="experience_details"]')`));
 await click('Suivant');assert.equal(await evaluate('document.activeElement.name'),'experience_details');
 await set('experience_details','No previous experience');await set('motivation','Discover my first-choice committee');await set('attentes','Learn diplomacy');await click('Suivant');
 await set('pack','1500');assert.ok(await evaluate(`document.querySelector('.selected-pack').textContent.includes('1 500 MAD')`));await set('logistique','None');await click('Suivant');
 assert.equal(await evaluate(`document.querySelectorAll('.checkbox input').length`),4);
 assert.ok(await evaluate(`Array.from(document.querySelectorAll('.checkbox input')).every(e=>!e.checked)`));
 assert.ok(await evaluate(`!document.querySelector('main').textContent.includes('Merci pour votre inscription !')`));
 await evaluate(`document.querySelectorAll('.checkbox input').forEach(e=>e.click())`);await pause();
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.registration-fields')).gridTemplateColumns.split(' ').length`),2);
 console.log('Checking mobile layout');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause();
 assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),'mobile horizontal overflow');assert.equal(await evaluate(`getComputedStyle(document.querySelector('.registration-fields')).gridTemplateColumns.split(' ').length`),1);
 const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(path.join(directory,'registration-mobile.png'),Buffer.from(screenshot.data,'base64'));
 // Intercept all submissions in the browser: never contact Apps Script or production Sheets.
 await evaluate(`window.__calls=0;window.fetch=()=>{window.__calls++;return new Promise(resolve=>window.__finish=()=>resolve(new Response(JSON.stringify({ok:false}),{headers:{'Content-Type':'application/json'}})));}`);
 console.log('Checking submission');
 await click('Envoyer mon inscription');assert.ok(await evaluate(`document.querySelector('button[type="submit"]').disabled`));assert.equal(await evaluate('window.__calls'),1);await evaluate('window.__finish()');await pause();assert.ok(await evaluate(`document.querySelector('[role="status"]').textContent.includes('conservées')`));assert.ok(await evaluate(`!document.querySelector('fieldset').disabled`));
 await click('Précédent');assert.equal(await evaluate(`document.querySelector('[name="logistique"]').value`),'None');await click('Suivant');
 await evaluate(`window.fetch=async()=>new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}})`);await click('Envoyer mon inscription');assert.ok(await evaluate(`document.querySelector('main').textContent.includes('Votre demande a bien été enregistrée')`));
 await click('EN');assert.ok(await evaluate(`document.querySelector('main').textContent.includes('Thank you for registering! Your submission has been successfully received.')`));
 console.log('Browser checks passed: both external pack links, direct visits/reloads, invalid pack, steps, retained answers, minor guardian, package change, mobile layout, pending state, failure/retry, mocked success. No production submission.');
} finally {clearTimeout(watchdog);socket?.close();edge.kill();await new Promise(r=>main.httpServer.close(r));await new Promise(r=>registration.httpServer.close(r));}
