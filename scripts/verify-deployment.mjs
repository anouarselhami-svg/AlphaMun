import assert from 'node:assert/strict';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/verify-deployment.mjs https://ADRESSE_REELLE_DU_SITE');
const base = new URL(input);
assert.equal(base.protocol, 'https:', 'Use HTTPS to verify the certificate.');
const request = async url => {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'follow' });
  assert.ok(response.ok, `HTTP ${response.status}: ${url}`);
  console.log(`${response.status} ${response.url}`);
  return response;
};
const response = await request(base);
const html = await response.text();
assert.ok(html.includes('id="root"'), 'React application root missing.');
const resources = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(match => new URL(match[1], response.url)).filter(url => url.origin === new URL(response.url).origin);
let registrationFound = false, emailFound = false;
for (const resource of resources) {
  const asset = await request(resource);
  if (resource.pathname.endsWith('.js')) {
    assert.ok(asset.headers.get('content-type')?.includes('javascript'), 'JavaScript asset returned the wrong MIME type.');
    const content = await asset.text();
    registrationFound ||= content.includes('inscription.youthglobalclub.com') || content.includes('/api/registration');
    emailFound ||= content.includes('alphamun@youthglobalclub.com');
    for (const match of content.matchAll(/["'](\/assets\/[^"']+\.(?:svg|png|jpe?g|webp))["']/g)) {
      const image = await request(new URL(match[1], response.url));
      assert.ok(image.headers.get('content-type')?.startsWith('image/'), 'Image asset returned the wrong MIME type.');
    }
  } else if (resource.pathname.endsWith('.css')) {
    assert.ok(asset.headers.get('content-type')?.includes('text/css'), 'CSS asset returned the wrong MIME type.');
  }
}
assert.ok(registrationFound, 'Registration link or local relay missing from published bundle.');
if (base.hostname === 'youthglobalclub.com') assert.ok(emailFound, 'Official contact email missing from published bundle.');
console.log('HTTPS, HTML, local assets, registration configuration and contact email verified.');
console.log('No registration submitted. Browser form testing and the Sheets row still need verification.');
