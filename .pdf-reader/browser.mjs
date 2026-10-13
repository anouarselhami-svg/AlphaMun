import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
const server=createServer(async(req,res)=>{try{
 if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<canvas id="page"></canvas><script type="module">import * as pdfjs from "/pdf.mjs";pdfjs.GlobalWorkerOptions.workerSrc="/pdf.worker.mjs";window.pdf=await pdfjs.getDocument("/document.pdf").promise;</script>');return;}
 const filename=req.url==='/document.pdf'?'C:/Users/Anouar Selhami/Downloads/Projet ALPHAMUN 8e.pdf':'.pdf-reader'+req.url;
 res.setHeader('Content-Type',req.url.endsWith('.mjs')?'text/javascript':'application/pdf');res.end(await fs.readFile(filename));
 }catch(e){res.statusCode=500;res.end(String(e));}}).listen(5390,'127.0.0.1');
const edge=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9293','--user-data-dir='+process.cwd()+'/.pdf-reader/edge','about:blank'],{windowsHide:true,stdio:'ignore'});
let socket;try{
 let target;for(let i=0;i<60;i++){try{target=await(await fetch('http://127.0.0.1:9293/json/new?about:blank',{method:'PUT'})).json();break;}catch{await new Promise(r=>setTimeout(r,200));}}
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r);let id=0;const waiting=new Map();socket.onmessage=e=>{const msg=JSON.parse(e.data);if(msg.id){waiting.get(msg.id)?.(msg);waiting.delete(msg.id);}};
 const call=(method,params={})=>new Promise(r=>{waiting.set(++id,r);socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const msg=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(msg.result.exceptionDetails)throw Error(JSON.stringify(msg.result.exceptionDetails));return msg.result.result.value;};
 await call('Page.navigate',{url:'http://127.0.0.1:5390/'});for(let i=0;i<120;i++){if(await evaluate('!!window.pdf'))break;await new Promise(r=>setTimeout(r,250));}
 const assets=process.argv.includes('--assets');const total=assets?0:await evaluate('pdf.numPages');let text='';
 for(let n=1;n<=total;n++){
  const result=await evaluate(`(async()=>{const p=await pdf.getPage(${n});const t=await p.getTextContent();const v=p.getViewport({scale:1.5});const c=document.querySelector('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;return {text:t.items.map(i=>i.str+(i.hasEOL?'\\n':' ')).join(''),image:c.toDataURL('image/png')};})()`);
  text+='\n=== PAGE '+n+' ===\n'+result.text;await fs.writeFile('.pdf-audit/page-'+n+'.png',Buffer.from(result.image.split(',')[1],'base64'));console.log('Rendered page '+n);
 }
 if(!assets) await fs.writeFile('.pdf-audit/text.txt',text);
 if(assets){
 const crops=[
 [6,'committees/moot-court.png',42,769,99,111],
 [8,'board/hajar.png',54,172,217,307],[8,'board/rania.png',62,508,206,291],[8,'board/marouane.png',63,842,196,280],
 [9,'board/miral.png',47,215,225,320],[9,'board/laila.png',52,595,214,305],[9,'board/yasmine-bentaleb.png',47,914,207,294],
 [10,'board/adam.png',50,130,207,293],[10,'board/lina.png',30,451,220,311],[10,'board/zineb.png',30,813,233,331],
 [11,'board/nidal.png',69,204,206,293],[11,'board/meryem.png',55,618,234,332],
 [12,'board/asmae.png',37,211,285,405],[12,'board/yasmine-alaoui.png',45,634,265,377],
 [14,'venues/uit.jpg',47,738,387,376],[15,'venues/uir.jpg',59,676,405,479],[16,'venues/lalla-laaroussa.jpg',60,667,390,469],
 ];
 for(const [n,name,left,top,width,height] of crops){const png=await evaluate(`(async()=>{const p=await pdf.getPage(${n});const v=p.getViewport({scale:1.5});const s=document.createElement('canvas');s.width=Math.ceil(v.width);s.height=Math.ceil(v.height);await p.render({canvasContext:s.getContext('2d'),viewport:v}).promise;const c=document.createElement('canvas');c.width=${width};c.height=${height};c.getContext('2d').drawImage(s,${left},${top},${width},${height},0,0,${width},${height});return c.toDataURL(${JSON.stringify(name.endsWith('.jpg')?'image/jpeg':'image/png')},0.92);})()`);
 const filename='frontend/public/assets/'+name;await fs.mkdir(filename.slice(0,filename.lastIndexOf('/')),{recursive:true});await fs.writeFile(filename,Buffer.from(png.split(',')[1],'base64'));console.log('Extracted '+name);}
 }
 // Contact sheets are generated from the already inspected page renders.
 for(let first=1;first<=total;first+=7){
  const png=await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=1400;c.height=1800;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,1400,1800);for(let n=${first};n<${first+7}&&n<=pdf.numPages;n++){const p=await pdf.getPage(n);const v=p.getViewport({scale:0.65});const s=document.createElement('canvas');s.width=v.width;s.height=v.height;await p.render({canvasContext:s.getContext('2d'),viewport:v}).promise;const i=n-${first},left=i%2*700,top=Math.floor(i/2)*450;x.fillStyle='black';x.font='20px sans-serif';x.fillText('Page '+n,left+10,top+24);x.drawImage(s,left,top+30,690,410);}return c.toDataURL();})()`);
  await fs.writeFile('.pdf-audit/sheet-'+first+'.png',Buffer.from(png.split(',')[1],'base64'));
 }
}finally{socket?.close();edge.kill();server.close();}
