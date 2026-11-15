import { submissionFields, registrationCommittees } from './validation.js';
import { debateLanguages, packageLabel } from '../../shared/edition.js';

export const fieldLabels = {
 prenom:'Prénom', nom:'Nom', age:'Âge', email:'Email', telephone:'Téléphone', contact_parent:'Téléphone du parent ou tuteur', ville:'Ville', etablissement:'Établissement', niveau:'Niveau scolaire',
 comite_choix_1:'Premier choix de comité', comite_choix_2:'Deuxième choix de comité', comite_choix_3:'Troisième choix de comité', participations_mun:'Nombre de participations MUN', experience_details:'Détails de l’expérience MUN', motivation:'Motivation', attentes:'Attentes', pack:'Pack choisi', logistique:'Logistique et besoins particuliers',
 confirmation_pack:'Conditions du pack acceptées', consentement:'Consentement au traitement des informations', code_conduite:'Code de conduite accepté', exactitude:'Exactitude des informations confirmée',
 langue_comite:'Langue de comité souhaitée', comite:'Comité complémentaire', motivation_comite:'Motivation du comité complémentaire', experience:'Expérience complémentaire', hebergement:'Besoin d’hébergement', restrictions_alimentaires:'Restrictions alimentaires', besoins_particuliers:'Autres besoins particuliers', reglement:'Règlement accepté', message:'Message', langue_site:'Langue du site',
};
const languageLabels = Object.fromEntries(Object.entries(debateLanguages).map(([id,label]) => [id,label.fr]));
const confirmations = ['confirmation_pack','consentement','code_conduite','exactitude','reglement'];
const logisticsFields = ['hebergement','restrictions_alimentaires','besoins_particuliers','logistique'];
const escapeHtml = text => String(text).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export function emailPayload(type, data, env) {
 const value = field => {
   if(!data[field]) return 'Non renseigné';
   if(confirmations.includes(field)) return data[field] === 'on' ? 'Oui' : 'Non';
   if(field === 'hebergement') return data[field] === 'oui' ? 'Oui' : 'Non';
   if(field === 'langue_comite' || field === 'langue_site') return languageLabels[data[field]] || data[field];
   if(field === 'pack') return packageLabel(data.pack);
   return data[field];
 };
 const lines = submissionFields(type).filter(field => type !== 'registration' || !logisticsFields.includes(field)).map(field => `${fieldLabels[field]} : ${value(field)}`);
 if(type === 'registration') {
   lines.push('', 'Logistique et besoins particuliers :',
     `- Hébergement : ${value('hebergement')}`,
     `- Restrictions alimentaires : ${value('restrictions_alimentaires')}`,
     `- Autres besoins particuliers : ${value('besoins_particuliers')}`,
     `- Précisions complémentaires : ${value('logistique')}`);
   lines.push(`Tarif : ${data.pack} DH`);
   for(let i=1; i<=3; i++) {
     const committee = registrationCommittees.find(c => c.name === data[`comite_choix_${i}`]);
     lines.push(`Langue du choix ${i} : ${languageLabels[committee.language]}`);
   }
 }
 const htmlRow = (field, label = fieldLabels[field]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value(field))}</td></tr>`;
 const htmlSection = (title, fields, optional = false) => {
     const visible = optional ? fields.filter(field => data[field]) : fields;
     return visible.length ? `<section><h2>${escapeHtml(title)}</h2><table>${visible.map(field => htmlRow(field)).join('')}</table></section>` : '';
 };
 const html = type === 'registration'
     ? `<div style="margin:0 auto;max-width:760px;background:#faf3e8;color:#3c0b0b;font:15px/1.5 Arial,sans-serif;padding:28px">
         <div style="border-bottom:3px solid #790e12;padding-bottom:16px">
           <div style="color:#790e12;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase">Alpha MUN 8</div>
           <h1 style="margin:6px 0 0;font:28px Georgia,serif;color:#790e12">Nouvelle inscription</h1>
           <p style="margin:8px 0 0;color:#795e51">Identifiant : ${escapeHtml(data.submission_id)}</p>
         </div>
         <div style="display:inline-block;margin:20px 0 4px;padding:10px 14px;background:#790e12;color:#fff;border-radius:6px;font-weight:bold">Pack : ${escapeHtml(value('pack'))}</div>
         ${htmlSection('Informations personnelles', ['prenom','nom','age','email','telephone','contact_parent','ville','etablissement','niveau'])}
         ${htmlSection('Comités et expérience', ['comite_choix_1','comite_choix_2','comite_choix_3','participations_mun','experience_details'])}
         ${htmlSection('Motivation et attentes', ['motivation','attentes'])}
         ${htmlSection('Logistique et besoins particuliers', ['hebergement','restrictions_alimentaires','besoins_particuliers','logistique'])}
         ${htmlSection('Confirmations', ['confirmation_pack','consentement','code_conduite','exactitude'])}
         ${htmlSection('Informations complémentaires', ['langue_comite','comite','motivation_comite','experience','reglement'], true)}
         <p style="margin:20px 0 0;padding-top:14px;border-top:1px solid #d9c7ac;color:#795e51">Tarif : ${escapeHtml(data.pack)} DH</p>
       </div>`
     : `<div style="margin:0 auto;max-width:760px;background:#faf3e8;color:#3c0b0b;font:15px/1.5 Arial,sans-serif;padding:28px">
         <h1 style="margin:0 0 18px;font:28px Georgia,serif;color:#790e12">Nouveau contact Alpha MUN</h1>
         ${htmlSection('Message', submissionFields(type))}
       </div>`;
 return {from:env.REGISTRATION_EMAIL_FROM,to:[env.REGISTRATION_EMAIL_TO],reply_to:data.email,
   subject:type === 'registration' ? 'AlphaMUN — nouvelle inscription' : 'AlphaMUN — nouveau contact',
     text:[`Identifiant de soumission : ${data.submission_id}`,...lines].join('\n'), html};
}
export async function sendEmail(payload, key, env, fetcher = fetch) {
 let response;
 try {
   response = await fetcher('https://api.resend.com/emails', {
     method:'POST',
     headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':key},
     body:JSON.stringify(payload), signal:AbortSignal.timeout(15000),
   });
 } catch { return {ok:false,code:'EMAIL_UNCONFIRMED',status:504}; }
 if(response.status === 409) return {ok:false,code:'EMAIL_IDEMPOTENCY_CONFLICT',status:409};
 if(!response.ok) return {ok:false,code:'EMAIL_REJECTED',status:502};
 try { const result = await response.json(); if(typeof result.id === 'string' && result.id) return {ok:true}; } catch {}
 return {ok:false,code:'EMAIL_UNCONFIRMED',status:502};
}
