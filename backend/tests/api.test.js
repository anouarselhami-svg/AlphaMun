import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import worker from '../src/index.js';
import {emailPayload, sendEmail, fieldLabels} from '../src/email.js';
import {validateSubmission, registrationFields} from '../src/validation.js';
const data = {submission_id:'11111111-1111-4111-8111-111111111111', ...Object.fromEntries(registrationFields.map(f=>[f,'TEST'])), age:'17', email:'test@example.com', telephone:'+212600000000', contact_parent:'+212611111111', participations_mun:'0', pack:'500', comite_choix_1:'INTERPOL', comite_choix_2:'UE', comite_choix_3:'MPS', confirmation_pack:'on', consentement:'on', code_conduite:'on', exactitude:'on', hebergement:'oui', restrictions_alimentaires:'no nuts', besoins_particuliers:'none'};
const env = {RESEND_API_KEY:'fake', REGISTRATION_EMAIL_FROM:'test@example.com', REGISTRATION_EMAIL_TO:'alphamun@youthglobalclub.com', ALLOWED_ORIGINS:'https://inscription.youthglobalclub.com'};
const request = (answers=data, options={}) => new Request('http://localhost/api/inscription', {method:'POST', body:new URLSearchParams(answers), ...options});
test('health, CORS, preflight, methods, invalid body and missing configuration', async()=>{
  assert.equal((await worker.fetch(new Request('http://localhost/unknown'),env)).status,404);
  assert.equal((await worker.fetch(request(data,{headers:{Origin:'https://evil.example'}}),env)).status,403);
  const preflight=await worker.fetch(new Request('http://localhost/api/inscription',{method:'OPTIONS',headers:{Origin:env.ALLOWED_ORIGINS}}),env);
  assert.equal(preflight.status,204); assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),env.ALLOWED_ORIGINS);
  assert.equal((await worker.fetch(new Request('http://localhost/api/inscription'),env)).status,405);
  assert.equal((await worker.fetch(request(data,{headers:{'Content-Type':'application/json'}}),env)).status,415);
  assert.equal((await worker.fetch(request({...data,pack:'550'}),env)).status,400);
  assert.equal((await worker.fetch(request(data),{...env,RESEND_API_KEY:''})).status,503);
  assert.equal((await worker.fetch(request(data),{...env,REGISTRATION_EMAIL_FROM:'invalid'})).status,503);
  assert.equal((await worker.fetch(request({...data,motivation:'x'.repeat(100001)}),env)).status,413);
});
test('all original rules and tariffs',()=>{
  for(const pack of ['500','1500']) assert.equal(validateSubmission('registration',{...data,pack}),null);
  for(const change of [{age:'0'},{age:'1.5'},{participations_mun:'-1'},{telephone:'123'},{contact_parent:''},{pack:'550'},{consentement:'false'},{comite_choix_2:'INTERPOL'},{comite_choix_1:'invalid'},{email:'bad'},{hebergement:'maybe'},{motivation:''},{nom:'x'.repeat(10001)}]) assert.ok(validateSubmission('registration',{...data,...change}));
});
test('complete readable email with optional answers, confirmations, prices, languages and Reply-To',()=>{
 for(const pack of ['500','1500']) {
  const message=emailPayload('registration',{...data,pack},env);
  for(const field of registrationFields) assert.ok(message.text.includes(fieldLabels[field]+' : '),field);
  for(const field of ['prenom','nom','age','email','telephone','contact_parent','ville','etablissement','niveau','comite_choix_1','comite_choix_2','comite_choix_3','participations_mun','experience_details','motivation','attentes','logistique','restrictions_alimentaires','besoins_particuliers']) assert.ok(message.text.includes(fieldLabels[field]+' : '+data[field]),field);
  assert.ok(message.text.includes('Besoin d’hébergement : Oui')); assert.ok(message.text.includes('Code de conduite accepté : Oui'));
  assert.ok(message.text.includes('Tarif : '+pack+' DH'));assert.ok(message.text.includes('Langue du choix 3 : Arabe'));assert.equal(message.reply_to,data.email);assert.deepEqual(message.to,['alphamun@youthglobalclub.com']);
 }
 const optional={...data,langue_comite:'fr',comite:'UE',motivation_comite:'alternate',experience:'workshops',reglement:'on'};
 const message=emailPayload('registration',optional,env);for(const field of ['motivation_comite','comite','experience'])assert.ok(message.text.includes(fieldLabels[field]+' : '+optional[field]));assert.ok(message.text.includes('Langue de comité souhaitée : Français'));assert.ok(message.text.includes('Règlement accepté : Oui'));
});
test('provider rejection, timeout/network and malformed receipts never report success',async()=>{
  for(const fetcher of [async()=>{throw new DOMException('timeout','TimeoutError');},async()=>new Response('',{status:429}),async()=>new Response('bad'),async()=>Response.json({})]) assert.equal((await sendEmail({},'key',env,fetcher)).ok,false);
});
test('Pages endpoint retries reuse the exact Resend key and payload; errors never confirm success',async()=>{
 const original=globalThis.fetch;let attempts=[];let failure=false;
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');attempts.push(options);if(failure)throw new DOMException('timeout','TimeoutError');return Response.json({id:'mock-email'});};
 try {
  const [first,second]=await Promise.all([worker.fetch(request(),env),worker.fetch(request(),env)]);
  assert.equal(first.status,200);assert.deepEqual(await first.json(),{ok:true,accepted:true,submissionId:data.submission_id});assert.equal(second.status,200);
  assert.equal(attempts[0].headers['Idempotency-Key'],'alphamun/registration/'+data.submission_id);assert.equal(attempts[1].headers['Idempotency-Key'],attempts[0].headers['Idempotency-Key']);assert.equal(attempts[1].body,attempts[0].body);
  assert.ok(attempts[0].signal instanceof AbortSignal);
  failure=true;const failed=await worker.fetch(request(),env);assert.equal(failed.status,504);assert.equal((await failed.json()).ok,false);
  failure=false;assert.equal((await worker.fetch(request(),env)).status,200);assert.equal(attempts[2].headers['Idempotency-Key'],attempts[3].headers['Idempotency-Key']);
  for(const response of [new Response('',{status:401}),new Response('',{status:429}),new Response('',{status:500}),Response.json({}),new Response('invalid')]) {
   globalThis.fetch=async()=>response;const result=await worker.fetch(request(),env);assert.equal(result.status,502);assert.equal((await result.json()).ok,false);
  }
  globalThis.fetch=async()=>new Response('',{status:409});const conflict=await worker.fetch(request(),env);assert.equal(conflict.status,409);assert.equal((await conflict.json()).code,'EMAIL_IDEMPOTENCY_CONFLICT');
 } finally {globalThis.fetch=original;}
});
test('actual Pages route entrypoints dispatch registrations and contacts',async()=>{
 const {onRequest:registration}=await import('../../frontend/functions/api/inscription.js');
 const {onRequest:contact}=await import('../../frontend/functions/api/contact.js');
 const original=fetch;globalThis.fetch=async()=>Response.json({id:'mock-email'});
 try {
  assert.equal((await registration({request:request(),env})).status,200);
  const req=new Request('https://youthglobalclub.com/api/contact',{method:'POST',body:new URLSearchParams({submission_id:data.submission_id,nom:'TEST',email:data.email,message:'TEST contact',langue_site:'fr'})});
  const result=await contact({request:req,env});assert.equal(result.status,200);assert.equal((await result.json()).accepted,true);
 } finally {globalThis.fetch=original;}
});
test('both generated sites route API requests to Functions without static overrides',async()=>{
 for(const folder of ['../../frontend/dist/','../../frontend/registration-site/dist/']) {
  const root=new URL(folder,import.meta.url);
  const routes=JSON.parse(await fs.readFile(new URL('_routes.json',root),'utf8'));
  assert.equal(routes.version,1);assert.ok(routes.include.includes('/api/*'));assert.deepEqual(routes.exclude,[]);
  const redirects=await fs.readFile(new URL('_redirects',root),'utf8');
  assert.equal(redirects.split('\n').filter(line=>line.trim()&&!line.trim().startsWith('#')).length,0);
  await assert.rejects(fs.access(new URL('_worker.js',root)));
 }
});
