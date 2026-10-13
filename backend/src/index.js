import { submissionFields, validateSubmission } from './validation.js';
import { emailPayload, sendEmail } from './email.js';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = [new URL(request.url).origin, ...(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim())];
    const headers = {'Cache-Control': 'no-store', 'Vary': 'Origin'};
    if (origin && !allowed.includes(origin)) return Response.json({ok: false, code: 'ORIGIN'}, {status: 403, headers});
    if (origin) Object.assign(headers, {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'});
    const json = (data, status = 200) => Response.json(data, {status, headers});
    const path = new URL(request.url).pathname;
    if (path === '/health' && request.method === 'GET') return json({ok: true, service: 'alphamun-api'});
    const type = path === '/api/inscription' ? 'registration' : path === '/api/contact' ? 'contact' : null;
    if (!type) return json({ok: false, code: 'NOT_FOUND'}, 404);
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers});
    if (request.method !== 'POST') return json({ok: false, code: 'METHOD'}, 405);
    if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) return json({ok: false, code: 'CONTENT_TYPE'}, 415);
    try {
      const reader = request.body?.getReader(); let size = 0; const chunks = [];
      if (!reader) return json({ok: false, code: 'INVALID_FIELDS'}, 400);
      while (true) { const {done, value} = await reader.read(); if (done) break; size += value.byteLength; if (size > 100000) { await reader.cancel(); return json({ok: false, code: 'TOO_LARGE'}, 413); } chunks.push(value); }
      const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.length;}
      const params = new URLSearchParams(new TextDecoder().decode(bytes));
      const data = Object.fromEntries(['submission_id', ...submissionFields(type)].map(field => [field, (params.get(field) || '').trim()]));
      data.submission_id = data.submission_id.toLowerCase();
      const code = validateSubmission(type, data); if (code) return json({ok: false, code}, 400);
      const address = value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!env.RESEND_API_KEY || !address(env.REGISTRATION_EMAIL_FROM) || !address(env.REGISTRATION_EMAIL_TO)) return json({ok: false, code: 'CONFIGURATION'}, 503);
      const result = await sendEmail(emailPayload(type, data, env), `alphamun/${type}/${data.submission_id}`, env);
      if (!result.ok) return json({ok: false, code: result.code}, result.status);
      return json({ok: true, accepted: true, submissionId: data.submission_id});
    } catch { return json({ok: false, code: 'UNCONFIRMED'}, 502); }
  },
};
