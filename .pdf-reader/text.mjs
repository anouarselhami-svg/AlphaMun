import fs from 'node:fs/promises';
const {getDocument,GlobalWorkerOptions}=await import('pdfjs-dist/legacy/build/pdf.mjs');
GlobalWorkerOptions.workerSrc=new URL('./pdf.worker.mjs',import.meta.url).href;
const pdf=await getDocument({data:new Uint8Array(await fs.readFile('C:/Users/Anouar Selhami/Downloads/Projet ALPHAMUN 8e.pdf')),useSystemFonts:true}).promise;
let text='';
for(let n=1;n<=pdf.numPages;n++) {const page=await pdf.getPage(n);const content=await page.getTextContent();text+=`\n=== PAGE ${n} ===\n`+content.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('');}
await fs.writeFile('.pdf-audit/text.txt',text);console.log(`Extracted ${pdf.numPages} pages.`);
