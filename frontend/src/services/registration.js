import { submissionFields } from './registration-schema.js';
export class RegistrationError extends Error {
 constructor(code,message,diagnostics={}){super(message);this.name='RegistrationError';this.code=code;this.diagnostics=diagnostics;}
}
// Reuse the same ID for identical retry payloads within this form instance.
export function submissionAttempt(ref,payload){
 const serialized=JSON.stringify(payload);
 if(ref.current?.serialized!==serialized)ref.current={serialized,id:crypto.randomUUID()};
 return {...payload,submission_id:ref.current.id};
}
export async function submitForm(type,data){
 const body=new URLSearchParams();
 for(const field of ['submission_id',...submissionFields(type)])body.set(field,data[field]??'');
 let response;
 try{response=await fetch(`/api/${type==='contact'?'contact':'inscription'}`,{method:'POST',body,redirect:'follow',signal:AbortSignal.timeout(20000)});}
 catch(error){throw new RegistrationError(error.name==='TimeoutError'||error.name==='AbortError'?'TIMEOUT':'RESPONSE_INACCESSIBLE','Réponse inaccessible ; réessayez avec le même identifiant.');}
 if(response.type==='opaque'||response.type==='opaqueredirect')throw new RegistrationError('RESPONSE_INACCESSIBLE','Réception non confirmée.');
 if(!response.ok)throw new RegistrationError('HTTP_ERROR','Réception non confirmée.',{status:response.status});
 let result;try{result=await response.json();}catch{throw new RegistrationError('INVALID_JSON','Réception non confirmée.');}
 if(result?.ok===false)throw new RegistrationError('API_REJECTED','Enregistrement refusé.',{apiCode:result.code});
 if(result?.ok!==true||result.accepted!==true||result.submissionId!==data.submission_id)throw new RegistrationError('UNCONFIRMED_JSON','Le stockage n’est pas confirmé.');
 return result;
}
export const submitRegistration=data=>submitForm('registration',data);
export const submitContact=data=>submitForm('contact',data);
