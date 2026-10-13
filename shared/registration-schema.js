import {committeeCatalogue, packages, debateLanguages} from './edition.js';
export const registrationCommittees = committeeCatalogue;
export const registrationFields = ['prenom','nom','age','email','telephone','contact_parent','ville','etablissement','niveau','comite_choix_1','comite_choix_2','comite_choix_3','participations_mun','experience_details','motivation','attentes','pack','logistique','confirmation_pack','consentement','code_conduite','exactitude'];
export const registrationOptionalFields = ['langue_comite','comite','motivation_comite','experience','hebergement','restrictions_alimentaires','besoins_particuliers','reglement'];
export const contactFields = ['nom','email','message','langue_site'];
export const submissionFields = type => type === 'contact' ? contactFields : [...registrationFields,...registrationOptionalFields];
const phone = text => /^\+?[\d\s().-]+$/.test(text) && text.replace(/\D/g,'').length>=7 && text.replace(/\D/g,'').length<=15;
export function validateSubmission(type, data) {
  const value = key => String(data[key] ?? '').trim();
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value('submission_id')))return 'INVALID_SUBMISSION_ID';
  const required=type==='contact'?['nom','email','message']:registrationFields;
  if(required.some(key=>!value(key)))return 'INVALID_FIELDS';
  if(submissionFields(type).some(key=>value(key).length>10000))return 'TOO_LARGE';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email')))return 'INVALID_EMAIL';
  if(type==='contact')return value('langue_site')&&!['fr','en'].includes(value('langue_site'))?'INVALID_LANGUAGE':null;
  if(!Object.hasOwn(packages,value('pack')))return 'INVALID_PACK';
  if(!['confirmation_pack','consentement','code_conduite','exactitude'].every(key=>value(key)==='on'))return 'INVALID_CONFIRMATIONS';
  if(!/^\d+$/.test(value('age'))||!Number.isSafeInteger(Number(value('age')))||Number(value('age'))<=0||!/^\d+$/.test(value('participations_mun'))||!Number.isSafeInteger(Number(value('participations_mun')))||!phone(value('telephone'))||!phone(value('contact_parent')))return 'INVALID_FIELDS';
  const choices=['comite_choix_1','comite_choix_2','comite_choix_3'].map(value);
  if(new Set(choices).size!==3)return 'DUPLICATE_COMMITTEE_CHOICES';
  if([...choices,...(value('comite')?[value('comite')]:[])].some(choice=>!registrationCommittees.some(c=>c.name===choice)))return 'INVALID_COMMITTEES';
  if(value('langue_comite')&&!Object.hasOwn(debateLanguages,value('langue_comite')))return 'INVALID_LANGUAGE';
  if(value('hebergement')&&!['oui','non'].includes(value('hebergement')))return 'INVALID_HOUSING';
  if(value('reglement')&&value('reglement')!=='on')return 'INVALID_CONFIRMATIONS';
  return null;
}
