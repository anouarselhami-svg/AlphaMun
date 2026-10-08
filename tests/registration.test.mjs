import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const endpoint = 'https://script.google.com/macros/s/test/exec';
const source = (await fs.readFile(new URL('../src/services/registration.js', import.meta.url), 'utf8'))
  .replace("import { config } from '../config';", `const config = { appsScriptUrl: ${JSON.stringify(endpoint)} };`);
const { submitRegistration } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const data = { nom: 'Test', prenom: 'Alpha', email: 'test@example.com', etablissement: 'Test', ville: 'Kénitra', experience: 'Première participation', comite: '', pack: '550', motivation: 'Découvrir la diplomatie.', confirmation_pack: 'on' };
test('POST form contains all required fields and follows redirects once', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url, endpoint);
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'follow');
    assert.equal(options.mode, undefined);
    assert.equal(options.headers, undefined);
    assert.ok(options.body instanceof URLSearchParams);
    assert.deepEqual(Object.fromEntries(options.body), { ...data, type: 'registration' });
    return new Response('{"ok":true}');
  };
  try { await submitRegistration(data); assert.equal(calls, 1); }
  finally { globalThis.fetch = original; }
});
for (const [label, response, code] of [
  ['script refusal', () => new Response('{"ok":false,"code":"INVALID_FIELDS","requestId":"reference"}'), 'SCRIPT_REJECTED'],
  ['HTTP error', () => new Response('{"ok":true}', { status: 403 }), 'HTTP_ERROR'],
  ['HTML instead of JSON', () => new Response('<html>Sign in</html>'), 'INVALID_JSON'],
  ['null JSON', () => new Response('null'), 'UNCONFIRMED_JSON'],
  ['string true is not confirmation', () => new Response('{"ok":"true"}'), 'UNCONFIRMED_JSON'],
  ['missing ok', () => new Response('{}'), 'UNCONFIRMED_JSON'],
  ['network or CORS', () => { throw new TypeError('Failed to fetch'); }, 'RESPONSE_INACCESSIBLE'],
  ['timeout', () => { throw new DOMException('Timeout', 'TimeoutError'); }, 'TIMEOUT'],
  ['opaque response', () => ({ type: 'opaque', status: 0, url: '', headers: new Headers() }), 'RESPONSE_INACCESSIBLE'],
]) {
  test(label + ': correct diagnosis, no retry or form data mutation', async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => { calls++; return response(); };
    const snapshot = structuredClone(data);
    try {
      await assert.rejects(submitRegistration(data), error => error.code === code);
      assert.equal(calls, 1);
      assert.deepEqual(data, snapshot);
    } finally { globalThis.fetch = original; }
  });
}

const script = await fs.readFile(new URL('../integration/Code.gs', import.meta.url), 'utf8');
function scriptContext({ id = '', active = null, failLock = false, failWrite = false } = {}) {
  const rows = [], logs = [];
  let releases = 0, openedId;
  const sheet = {
    appendRow(row) { if (failWrite) throw Error('Write failed'); rows.push(row); },
    getLastColumn() { return 8; },
    getRange(...args) {
      if (args[0] === 'A:A') return { setNumberFormat(format) { assert.equal(format, 'dd/MM/yyyy HH:mm:ss'); } };
      if (args.length === 4) assert.equal(args.join(','), '1,1,1,8');
      if (args.length === 2) return { setValue(value) { assert.ok(['Ville', 'Motivation', 'Pack assumé'].includes(value)); } };
      return {
        getValues() { return [['Date', 'Prénom', 'Nom', 'Email', 'Établissement', 'Expérience MUN', 'Comité', 'Pack DH']]; },
      };
    },
  };
  const spreadsheet = { getSheetByName: () => sheet };
  const context = vm.createContext({
    Utilities: { getUuid: () => 'reference' },
    LockService: { getScriptLock: () => ({ waitLock() { if (failLock) throw Error('Lock failed'); }, releaseLock() { releases++; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => id }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => active, openById(value) { openedId = value; return spreadsheet; }, flush() {} },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
    console: { warn: line => logs.push(JSON.parse(line)), error: line => logs.push(JSON.parse(line)), info: line => logs.push(JSON.parse(line)) },
  });
  vm.runInContext(script, context);
  return { context, rows, logs, releases: () => releases, openedId: () => openedId };
}
test('script rejects invalid data before accessing Sheets', () => {
  const state = scriptContext();
  assert.equal(state.context.doPost({ parameter: { type: 'registration' } }).code, 'INVALID_FIELDS');
  assert.equal(state.rows.length, 0);
  assert.equal(state.releases(), 0);
});
test('missing active spreadsheet returns an actionable code', () => {
  const state = scriptContext();
  assert.equal(state.context.doPost({ parameter: { ...data, type: 'registration' } }).code, 'SPREADSHEET_NOT_CONFIGURED');
  assert.equal(state.rows.length, 0);
  assert.equal(state.releases(), 1);
});
test('explicit spreadsheet ID saves once and logs no form values', () => {
  const state = scriptContext({ id: ' target-id ' });
  assert.equal(state.context.doPost({ parameter: { ...data, type: 'registration' } }).ok, true);
  assert.equal(state.openedId(), 'target-id');
  assert.equal(state.rows.length, 1);
  assert.equal(state.rows[0][3], data.email);
  assert.equal(state.rows[0][8], data.ville);
  assert.equal(state.rows[0][10], data.confirmation_pack);
  assert.equal(state.logs[0].code, 'REGISTRATION_SAVED');
  assert.ok(!JSON.stringify(state.logs).includes(data.email));
});
test('lock failure is logged without releasing an unacquired lock', () => {
  const state = scriptContext({ failLock: true });
  assert.equal(state.context.doPost({ parameter: { ...data, type: 'registration' } }).code, 'SCRIPT_ERROR');
  assert.equal(state.logs[0].phase, 'lock');
  assert.equal(state.releases(), 0);
});
test('write failure logs the phase and never returns success', () => {
  const state = scriptContext({ id: 'target-id', failWrite: true });
  assert.equal(state.context.doPost({ parameter: { ...data, type: 'registration' } }).ok, false);
  assert.equal(state.logs[0].phase, 'append');
  assert.equal(state.rows.length, 0);
});
test('GET health check has no Sheets writes', () => {
  const state = scriptContext();
  assert.equal(state.context.doGet().service, 'alpha-mun-registration');
  assert.equal(state.rows.length, 0);
});
