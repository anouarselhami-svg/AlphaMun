import fs from 'node:fs/promises';
import {createCanvas, DOMMatrix, ImageData, Path2D} from '@napi-rs/canvas';
Object.assign(globalThis,{DOMMatrix,ImageData,Path2D});
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
const bytes=new Uint8Array(await fs.readFile('C:/Users/Anouar Selhami/Downloads/Projet ALPHAMUN 8e.pdf'));
const pdf=await getDocument({data:bytes,useSystemFonts:true}).promise;
let text='';
for(let n=1;n<=pdf.numPages;n++){
 const page=await pdf.getPage(n);const content=await page.getTextContent();
 text+=`\n=== PAGE ${n} ===\n`+content.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('');
 const viewport=page.getViewport({scale:1.4});const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
 await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
 await fs.writeFile(`.pdf-audit/page-${n}.png`,canvas.toBuffer('image/png'));
}
await fs.writeFile('.pdf-audit/text.txt',text);
for(let first=1;first<=pdf.numPages;first+=7){
 const sheet=createCanvas(1400,1800);const ctx=sheet.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1400,1800);
 const {loadImage}=await import('@napi-rs/canvas');
 for(let n=first;n<first+7&&n<=pdf.numPages;n++) {const im=await loadImage(`.pdf-audit/page-${n}.png`);const i=n-first,x=(i%2)*700,y=Math.floor(i/2)*450;ctx.fillStyle='black';ctx.font='20px sans-serif';ctx.fillText(`Page ${n}`,x+10,y+24);ctx.drawImage(im,x,y+30,690,410);}
 await fs.writeFile(`.pdf-audit/sheet-${first}.png`,sheet.toBuffer('image/png'));
}
console.log(`Read and rendered ${pdf.numPages} pages.`);
