import {Miniflare, convertV4MiniflareOptions, Response as MFResponse} from 'miniflare';
import assert from 'node:assert/strict';
import {registrationFields} from './src/validation.js';
const accepted=new Map();let deliveries=0;
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:'dist/registration/index.js',compatibilityDate:'2026-10-13',bindings:{RESEND_API_KEY:'fake',REGISTRATION_EMAIL_FROM:'test@example.com',REGISTRATION_EMAIL_TO:'alphamun@youthglobalclub.com'},outboundService:async request=>{
 assert.equal(request.url,'https://api.resend.com/emails');const key=request.headers.get('Idempotency-Key');const body=await request.text();
 if(accepted.has(key)) {assert.equal(accepted.get(key),body);return MFResponse.json({id:'mock-email'});}
 accepted.set(key,body);deliveries++;return MFResponse.json({id:'mock-email'});
}}));
try {
 const data={...Object.fromEntries(registrationFields.map(f=>[f,'TEST'])),submission_id:crypto.randomUUID(),email:'test@example.com',age:'17',telephone:'+212600000000',contact_parent:'+212611111111',pack:'500',participations_mun:'0',comite_choix_1:'INTERPOL',comite_choix_2:'UE',comite_choix_3:'MPS',confirmation_pack:'on',consentement:'on',code_conduite:'on',exactitude:'on'};
 const post=answers=>mf.dispatchFetch('http://localhost/api/inscription',{method:'POST',body:new URLSearchParams(answers)});
 assert.equal((await mf.dispatchFetch('http://localhost/health')).status,200);
 const first=await post(data);assert.equal(first.status,200);assert.equal((await first.json()).accepted,true);
 const second=await post(data);assert.equal((await second.json()).accepted,true);assert.equal(deliveries,1);
 assert.equal((await post({...data,age:'0'})).status,400);assert.equal(deliveries,1);
 const payload=JSON.parse([...accepted.values()][0]);assert.equal(payload.reply_to,data.email);for(const text of ['Prénom : TEST','Tarif : 500 MAD','Code de conduite accepté : Oui'])assert.ok(payload.text.includes(text));
 console.log('Pages Functions/workerd: health, complete mocked email, validation and identical retry key passed. No external network.');
} finally {await mf.dispose();}
