import { submissionFields, registrationCommittees } from './validation.js';

export const fieldLabels = {
 prenom:'Prénom', nom:'Nom', age:'Âge', email:'Email', telephone:'Téléphone', contact_parent:'Téléphone du parent ou tuteur', ville:'Ville', etablissement:'Établissement', niveau:'Niveau scolaire',
 comite_choix_1:'Premier choix de comité', comite_choix_2:'Deuxième choix de comité', comite_choix_3:'Troisième choix de comité', participations_mun:'Nombre de participations MUN', experience_details:'Détails de l’expérience MUN', motivation:'Motivation', attentes:'Attentes', pack:'Pack choisi', logistique:'Logistique et besoins particuliers',
 confirmation_pack:'Conditions du pack acceptées', consentement:'Consentement au traitement des informations', code_conduite:'Code de conduite accepté', exactitude:'Exactitude des informations confirmée',
 langue_comite:'Langue de comité souhaitée', comite:'Comité complémentaire', motivation_comite:'Motivation du comité complémentaire', experience:'Expérience complémentaire', hebergement:'Besoin d’hébergement', restrictions_alimentaires:'Restrictions alimentaires', besoins_particuliers:'Autres besoins particuliers', reglement:'Règlement accepté', message:'Message', langue_site:'Langue du site',
};
const languageLabels={en:'Anglais',fr:'Français',ary:'Dialecte marocain'};
const confirmations=['confirmation_pack','consentement','code_conduite','exactitude','reglement'];
export function emailPayload(type, data, env) {
 const value = field => {
   if(!data[field]) return 'Non renseigné';
   if(confirmations.includes(field)) return data[field]==='on'?'Oui':'Non';
   if(field==='hebergement') return data[field]==='oui'?'Oui':'Non';
   if(field==='langue_comite'||field==='langue_site') return languageLabels[data[field]];
   if(field==='pack') return data.pack==='500'?'Normal — 500 MAD':'Premium — 1 500 MAD';
   return data[field];
 };
 const lines=submissionFields(type).map(field=>`${fieldLabels[field]} : ${value(field)}`);
 if(type==='registration') {
   lines.push(`Tarif : ${data.pack} MAD`);
   for(let i=1;i<=3;i++) lines.push(`Langue du choix ${i} : ${languageLabels[registrationCommittees.find(c=>c.name===data[`comite_choix_${i}`]).language]}`);
 }
 return {from:env.REGISTRATION_EMAIL_FROM,to:[env.REGISTRATION_EMAIL_TO],reply_to:data.email,
   subject:type==='registration'?'AlphaMUN — nouvelle inscription':'AlphaMUN — nouveau contact',
   text:[`Identifiant de soumission : ${data.submission_id}`,...lines].join('\n')};
}

export async function sendEmail(payload, key, env, fetcher = fetch) {
  let response;
  try {
    response = await fetcher('https://api.resend.com/emails', {
      method: 'POST', headers: {'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key},
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
    });
  } catch { return {ok: false, code: 'EMAIL_UNCONFIRMED', status: 504}; }
  if (response.status === 409) return {ok: false, code: 'EMAIL_IDEMPOTENCY_CONFLICT', status: 409};
  if (!response.ok) return {ok: false, code: 'EMAIL_REJECTED', status: 502};
  try { const result = await response.json(); if (typeof result.id === 'string' && result.id) return {ok: true}; } catch {}
  return {ok: false, code: 'EMAIL_UNCONFIRMED', status: 502};
}

