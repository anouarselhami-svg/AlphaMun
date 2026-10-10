const FIELDS = ["prenom","nom","age","email","telephone","contact_parent","ville","etablissement","niveau","comite_choix_1","comite_choix_2","comite_choix_3","participations_mun","experience_details","motivation","attentes","pack","logistique","confirmation_pack","consentement","code_conduite","exactitude","type"];
export async function onRequestPost({ request, env }) {
 const json = (data, status=200) => Response.json(data, {status,headers:{'Cache-Control':'no-store'}});
 const endpoint = env.APPS_SCRIPT_URL || env.VITE_APPS_SCRIPT_URL;
 if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/?#]+\/exec$/.test(endpoint || '')) return json({ok:false,code:'CONFIGURATION'},503);
 if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return json({ok:false,code:'ORIGIN'},403);
 if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return json({ok:false,code:'CONTENT_TYPE'},415);
 try {
 const body=await request.text();
 if(body.length>40000) return json({ok:false,code:'TOO_LARGE'},413);
 const parameters = new URLSearchParams(body);
 const forwarded = new URLSearchParams();
 for (const field of FIELDS) forwarded.set(field, parameters.get(field) || '');
 const response=await fetch(endpoint,{method:'POST',body:forwarded.toString(),headers:{'Content-Type':'application/x-www-form-urlencoded'},redirect:'follow',signal:AbortSignal.timeout(18000)});
 if(!response.ok)return json({ok:false,code:'UPSTREAM_HTTP'},502);
 const result=await response.json();
 if(typeof result?.ok !== 'boolean')return json({ok:false,code:'INVALID_RESPONSE'},502);
 return json(result);
 } catch {return json({ok:false,code:'UPSTREAM_UNCONFIRMED'},502);}
}
