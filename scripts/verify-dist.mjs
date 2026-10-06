import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';

const root = path.resolve('dist');
const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
const env = loadEnv('production', process.cwd(), 'VITE_');
assert.ok(env.VITE_APPS_SCRIPT_URL, 'VITE_APPS_SCRIPT_URL doit être configurée avant la compilation.');
assert.equal(new URL(env.VITE_APPS_SCRIPT_URL).origin, 'https://script.google.com');
assert.ok(env.VITE_APPS_SCRIPT_URL.endsWith('/exec'));

const assets = new Set();
const verifyAsset = async reference => {
  if (/^(https?:|data:|#)/.test(reference)) return;
  const filename = path.resolve(root, reference.replace(/^\//, '').split(/[?#]/)[0]);
  assert.ok(filename.startsWith(root + path.sep), `Chemin hors dist : ${reference}`);
  assert.ok((await fs.stat(filename)).isFile(), `Fichier manquant : ${reference}`);
  assets.add(reference);
};
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
for (const reference of references) await verifyAsset(reference);
assert.ok(!html.includes('/src/main.jsx'), 'Le HTML doit charger le JavaScript compilé.');
const javascript = references.filter(ref => ref.endsWith('.js'));
assert.ok(javascript.length > 0);
for (const reference of javascript) {
  const content = await fs.readFile(path.join(root, reference.replace(/^\//, '')), 'utf8');
  assert.ok(content.includes(env.VITE_APPS_SCRIPT_URL), 'La compilation doit contenir la bonne URL Apps Script.');
  for (const match of content.matchAll(/["'](\/assets\/[^"']+\.(?:svg|png|jpe?g|webp))["']/g)) await verifyAsset(match[1]);
}
for (const reference of references.filter(ref => ref.endsWith('.css'))) {
  const content = await fs.readFile(path.join(root, reference.replace(/^\//, '')), 'utf8');
  for (const match of content.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) await verifyAsset(match[1]);
}
console.log(`Production vérifiée : ${assets.size} ressources locales, URL Apps Script intégrée, HTML compilé.`);
console.log(`Adresse de contact configurée : ${Boolean(env.VITE_CONTACT_EMAIL)}.`);
