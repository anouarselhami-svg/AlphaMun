import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { registrationLocation } from '../src/services/registration-route.js';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},esbuild:{jsx:'automatic'},server:{middlewareMode:true}});
try {
 const {default:Packs}=await server.ssrLoadModule('/src/components/Packs.jsx');
 const {default:App}=await server.ssrLoadModule('/src/App.jsx');
 const {default:RegistrationApp}=await server.ssrLoadModule('/registration-site/App.jsx');
 globalThis.localStorage={getItem:()=> 'fr'};
 const html=renderToStaticMarkup(React.createElement(Packs));
 test('pack links open the registration subdomain in a new tab',()=>{const links=[...html.matchAll(/href="([^"]+\?pack=[^"]+)" target="_blank" rel="noopener noreferrer"/g)].map(m=>m[1]);assert.deepEqual(links,['https://inscription.youthglobalclub.com/?pack=500','https://inscription.youthglobalclub.com/?pack=1500']);assert.ok(!html.includes('550'));});
 test('presentation site always displays the packs, not the form',()=>{globalThis.window={location:new URL('https://youthglobalclub.com/?pack=500')};const page=renderToStaticMarkup(React.createElement(App));assert.ok(page.includes('id="packs"'));assert.ok(!page.includes('registration-page'));assert.ok(!page.includes('href="/inscription"'));});
 for(const pack of ['500','1500'])test(`registration root preselects ${pack} on direct visit and fresh render`,()=>{globalThis.window={location:new URL(`https://inscription.youthglobalclub.com/?pack=${pack}`)};for(let i=0;i<2;i++){const page=renderToStaticMarkup(React.createElement(RegistrationApp));assert.ok(page.includes('registration-page'));assert.ok(page.includes(pack==='500'?'Pack Normal — 500 MAD':'Pack Premium — 1 500 MAD'));assert.ok(page.includes('Inscription à Alpha MUN 8'));assert.ok(page.includes('https://youthglobalclub.com/'));assert.ok(!page.includes('id="packs"'));assert.equal((page.match(/<li(?: |>)/g)||[]).length,5);}});
 for(const search of ['', '?pack=550','?pack=bad'])test('missing or invalid pack prompts selection '+search,()=>{globalThis.window={location:new URL('https://inscription.youthglobalclub.com/'+search)};assert.equal(registrationLocation(window.location).pack,'');const page=renderToStaticMarkup(React.createElement(RegistrationApp));assert.ok(page.includes('Choisissez votre pack'));});
 test('both builds have their own HTML, bundles and logos',async()=>{for(const root of ['dist','registration-site/dist']){const page=await fs.readFile(root+'/index.html','utf8');const match=page.match(/src="(\/assets\/[^\"]+\.js)"/);assert.ok(match);await fs.access(root+match[1]);await fs.access(root+'/assets/alpha-emblem.svg');}await assert.rejects(fs.access('dist/inscription.html'));});
} finally {await server.close();}
