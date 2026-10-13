import test from 'node:test';
import assert from 'node:assert/strict';
import {submitRegistration,submitContact,submissionAttempt} from '../src/services/registration.js';
import * as frontend from '../src/services/registration-schema.js';
import * as backend from '../../backend/src/validation.js';
const id='11111111-1111-4111-8111-111111111111';
const data={submission_id:id,code_conduite:'on'};
for(const [label,response,code] of [
 ['success',()=>Response.json({ok:true,accepted:true,submissionId:id}),null],
 ['refused',()=>Response.json({ok:false}),'API_REJECTED'],
 ['unconfirmed',()=>Response.json({ok:true}),'UNCONFIRMED_JSON'],
 ['wrong receipt',()=>Response.json({ok:true,accepted:true,submissionId:'other'}),'UNCONFIRMED_JSON'],
 ['HTML',()=>new Response('<html>'),'INVALID_JSON'],['HTTP',()=>new Response('',{status:502}),'HTTP_ERROR'],
 ['network',()=>{throw new TypeError();},'RESPONSE_INACCESSIBLE'],['timeout',()=>{throw new DOMException('timeout','TimeoutError');},'TIMEOUT'],
 ['opaque',()=>({type:'opaque'}),'RESPONSE_INACCESSIBLE']
])test('client '+label,async()=>{const original=fetch;globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/inscription');assert.equal(options.body.get('submission_id'),id);return response();};try{if(code)await assert.rejects(submitRegistration(data),e=>e.code===code);else await submitRegistration(data);}finally{globalThis.fetch=original;}});
test('identical retries keep ID; changed answers get new ID',()=>{const ref={current:null};const first=submissionAttempt(ref,data);assert.equal(submissionAttempt(ref,{...data}).submission_id,first.submission_id);assert.notEqual(submissionAttempt(ref,{...data,nom:'changed'}).submission_id,first.submission_id);});
test('contact goes through backend',async()=>{const original=fetch;globalThis.fetch=async(url)=>{assert.equal(url,'/api/contact');return Response.json({ok:true,accepted:true,submissionId:id});};try{await submitContact(data);}finally{globalThis.fetch=original;}});
test('all answers from earlier steps and optional fields reach the Pages endpoint',async()=>{
 const original=fetch;
 const answers={submission_id:id,...Object.fromEntries([...frontend.registrationFields,...frontend.registrationOptionalFields].map(field=>[field,`Réponse ${field}`]))};
 globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/inscription');for(const [field,value] of Object.entries(answers))assert.equal(options.body.get(field),value,field);return Response.json({ok:true,accepted:true,submissionId:id});};
 try {await submitRegistration(answers);} finally {globalThis.fetch=original;}
});
test('backend and frontend keep exactly the same fields, committees and rules',()=>{for(const key of ['registrationFields','registrationOptionalFields','registrationCommittees','contactFields'])assert.deepEqual(frontend[key],backend[key]);assert.equal(frontend.validateSubmission.toString(),backend.validateSubmission.toString());});
