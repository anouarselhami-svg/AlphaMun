import { submissionFields, validateSubmission } from '../services/registration-schema.js';
export const submissionHandler = type => async ({request,env}) => {
 const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 const endpoint=env.APPS_SCRIPT_URL||env.VITE_APPS_SCRIPT_URL;
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/?#]+\/exec$/.test(endpoint||'')||!env.SUBMISSION_TOKEN)return json({ok:false,code:'CONFIGURATION'},503);
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false,code:'ORIGIN'},403);
 if(!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))return json({ok:false,code:'CONTENT_TYPE'},415);
 try {
  const body=await request.text();if(body.length>100000)return json({ok:false,code:'TOO_LARGE'},413);
  const parameters=new URLSearchParams(body),forwarded=new URLSearchParams();
  for(const field of ['submission_id',...submissionFields(type)])forwarded.set(field,parameters.get(field)?.trim()||'');
  const code=validateSubmission(type,Object.fromEntries(forwarded));if(code)return json({ok:false,code},400);
  forwarded.set('type',type);forwarded.set('auth_token',env.SUBMISSION_TOKEN);
  const response=await fetch(endpoint,{method:'POST',body:forwarded.toString(),headers:{'Content-Type':'application/x-www-form-urlencoded'},redirect:'follow',signal:AbortSignal.timeout(18000)});
  if(!response.ok)return json({ok:false,code:'UPSTREAM_HTTP'},502);
  const result=await response.json();
  if(result?.ok!==true)return json({ok:false,code:typeof result?.code==='string'?result.code:'INVALID_RESPONSE',requestId:typeof result?.requestId==='string'?result.requestId:undefined},502);
  if(result.stored!==true||result.submissionId!==forwarded.get('submission_id'))return json({ok:false,code:'UNCONFIRMED_STORAGE'},502);
  // Return only the storage receipt; never echo submitted answers or secrets.
  return json({ok:true,stored:true,submissionId:result.submissionId,duplicate:result.duplicate===true});
 }catch{return json({ok:false,code:'UPSTREAM_UNCONFIRMED'},502);}
};
