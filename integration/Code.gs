// AlphaMUN forms, version 8. Keep the existing spreadsheet and /exec deployment.
const COMMITTEE_LANGUAGES = {
 'UN WOMEN':'en',INTERPOL:'en',INTERSS:'en','MOOT COURT':'en','AU PSC':'en',UNOOSA:'en',
 CSNU:'fr',OMS:'fr',CIGIA:'fr',UE:'fr',UNICEF:'fr',ONUDC:'fr',MPS:'ar'
};
const REGISTRATION_FIELDS = ['prenom','nom','age','email','telephone','contact_parent','ville','etablissement','niveau','comite_choix_1','comite_choix_2','comite_choix_3','participations_mun','experience_details','motivation','attentes','pack','logistique','confirmation_pack','consentement','code_conduite','exactitude'];
const OPTIONAL_FIELDS = ['langue_comite','comite','motivation_comite','experience','hebergement','restrictions_alimentaires','besoins_particuliers','reglement'];
const CONTACT_FIELDS = ['nom','email','message','langue_site'];
const REGISTRATION_HEADERS = ['Date','Prénom','Nom','Email','Établissement','Expérience MUN','Comité','Pack DH','Ville','Pack assumé','Comité — choix 1','Comité — choix 2','Comité — choix 3','Âge','Téléphone','Contact parent / tuteur','Niveau scolaire','Langue des comités','Détails expérience MUN','Motivation premier comité','Attentes','Hébergement','Restrictions alimentaires','Besoins particuliers','Code de conduite accepté','Informations exactes','Consentement','Nombre de participations MUN','Logistique et besoins particuliers','Motivation','Identifiant de soumission','Empreinte soumission','Langue souhaitée','Pack choisi','Tarif MAD','Règlement accepté'];
const CONTACT_HEADERS = ['Identifiant de demande','Date','Nom','Email','Message','Langue du site','Empreinte soumission'];

function doGet(){return registrationJson_({ok:true,service:'alpha-mun-registration',version:'7'});}
function registrationJson_(result){return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);}
function registrationSpreadsheet_(){
 const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
 const spreadsheet=id&&id.trim()?SpreadsheetApp.openById(id.trim()):SpreadsheetApp.getActiveSpreadsheet();
 if(!spreadsheet)throw new Error('Configurez SPREADSHEET_ID ou conservez le classeur lié.');
 return spreadsheet;
}
function registrationHeaders_(sheet){const count=sheet.getLastColumn();return count>0?sheet.getRange(1,1,1,count).getValues()[0].map(h=>String(h).trim()):[];}
function formSheet_(spreadsheet,name,requiredHeaders){
 const sheet=spreadsheet.getSheetByName(name)||spreadsheet.insertSheet(name);
 const headers=registrationHeaders_(sheet),named=headers.filter(Boolean);
 if(new Set(named).size!==named.length)throw new Error('Titres en double dans '+name);
 // Append missing columns only. Never delete, reorder or rewrite historical rows.
 for(const header of requiredHeaders){if(!headers.includes(header)){
  headers.push(header);const column=headers.length;
  if(column>sheet.getMaxColumns())sheet.insertColumnsAfter(sheet.getMaxColumns(),column-sheet.getMaxColumns());
  sheet.getRange(1,column).setValue(header);
 }}
 return sheet;
}
function registrationSheet_(spreadsheet){return formSheet_(spreadsheet,'Inscriptions',REGISTRATION_HEADERS);}
function registrationSafe_(input){const text=String(input==null?'':input).trim();return /^[=+@\-]/.test(text)?"'"+text:text;}
function preparerColonnes(){
 const lock=LockService.getScriptLock();lock.waitLock(10000);
 try{const spreadsheet=registrationSpreadsheet_();registrationSheet_(spreadsheet);formSheet_(spreadsheet,'Contacts',CONTACT_HEADERS);SpreadsheetApp.flush();console.info('Colonnes Inscriptions et Contacts préparées, sans inscription.');}
 finally{lock.releaseLock();}
}
function validateForm_(type,p){
 const value=field=>String(p[field]||'').trim();
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value('submission_id')))return 'INVALID_SUBMISSION_ID';
 const required=type==='contact'?CONTACT_FIELDS.slice(0,3):REGISTRATION_FIELDS;
 if(required.some(field=>!value(field)))return 'INVALID_FIELDS';
 const fields=type==='contact'?CONTACT_FIELDS:REGISTRATION_FIELDS.concat(OPTIONAL_FIELDS);
 if(fields.some(field=>value(field).length>10000))return 'TOO_LARGE';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email')))return 'INVALID_EMAIL';
 if(type==='contact')return value('langue_site')&&!['fr','en'].includes(value('langue_site'))?'INVALID_LANGUAGE':null;
 if(!['500','1500'].includes(value('pack')))return 'INVALID_PACK';
 if(!['confirmation_pack','consentement','code_conduite','exactitude'].every(field=>value(field)==='on'))return 'INVALID_CONFIRMATIONS';
 const phone=text=>/^\+?[\d\s().-]+$/.test(text)&&text.replace(/\D/g,'').length>=7&&text.replace(/\D/g,'').length<=15;
 if(!/^\d+$/.test(value('age'))||!Number.isSafeInteger(Number(value('age')))||Number(value('age'))<=0||!/^\d+$/.test(value('participations_mun'))||!Number.isSafeInteger(Number(value('participations_mun')))||!phone(value('telephone'))||!phone(value('contact_parent')))return 'INVALID_FIELDS';
 const choices=['comite_choix_1','comite_choix_2','comite_choix_3'].map(value);
 if(new Set(choices).size!==3)return 'DUPLICATE_COMMITTEE_CHOICES';
 if(choices.concat(value('comite')?[value('comite')]:[]).some(choice=>!Object.prototype.hasOwnProperty.call(COMMITTEE_LANGUAGES,choice)))return 'INVALID_COMMITTEES';
 if(value('langue_comite')&&!['fr','en','ar'].includes(value('langue_comite')))return 'INVALID_LANGUAGE';
 if(value('hebergement')&&!['oui','non'].includes(value('hebergement')))return 'INVALID_HOUSING';
 if(value('reglement')&&value('reglement')!=='on')return 'INVALID_CONFIRMATIONS';
 return null;
}
function fingerprint_(type,p){
 const fields=type==='contact'?CONTACT_FIELDS:REGISTRATION_FIELDS.concat(OPTIONAL_FIELDS);
 const canonical=JSON.stringify([type].concat(fields.map(field=>String(p[field]||'').trim())));
 return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,canonical,Utilities.Charset.UTF_8).map(byte=>('0'+((byte+256)%256).toString(16)).slice(-2)).join('');
}
function findSubmission_(sheet,headers,idHeader,id){
 if(sheet.getLastRow()<2)return 0;
 const column=headers.indexOf(idHeader)+1;
 const values=sheet.getRange(2,column,sheet.getLastRow()-1,1).getValues();
 const found=values.findIndex(row=>String(row[0])===id);
 return found<0?0:found+2;
}
function registrationData_(p){
 const value=field=>String(p[field]||'').trim(),safe=field=>registrationSafe_(value(field));
 const choices=['comite_choix_1','comite_choix_2','comite_choix_3'].map(value);
 return {
  'Date':new Date(),'Prénom':safe('prenom'),'Nom':safe('nom'),'Email':safe('email'),'Téléphone':safe('telephone'),
  'Âge':Number(value('age')),'Contact parent / tuteur':safe('contact_parent'),'Ville':safe('ville'),'Établissement':safe('etablissement'),'Niveau scolaire':safe('niveau'),
  'Expérience MUN':registrationSafe_(value('experience')||(Number(value('participations_mun'))>0?'Oui':'Non')),
  'Nombre de participations MUN':Number(value('participations_mun')),'Détails expérience MUN':safe('experience_details'),
  'Comité':registrationSafe_(value('comite')||choices[0]),'Comité — choix 1':safe('comite_choix_1'),'Comité — choix 2':safe('comite_choix_2'),'Comité — choix 3':safe('comite_choix_3'),
  'Langue souhaitée':registrationSafe_(value('langue_comite')||COMMITTEE_LANGUAGES[choices[0]]),
  'Langue des comités':choices.map(choice=>COMMITTEE_LANGUAGES[choice]).join(', '),
  'Motivation premier comité':registrationSafe_(value('motivation_comite')||value('motivation')),'Motivation':safe('motivation'),'Attentes':safe('attentes'),
  'Pack DH':Number(value('pack')),'Pack choisi':value('pack')==='500'?'Normal':'Gold / Externe','Tarif MAD':Number(value('pack')),'Pack assumé':safe('confirmation_pack'),
  'Hébergement':safe('hebergement'),'Restrictions alimentaires':safe('restrictions_alimentaires'),'Besoins particuliers':safe('besoins_particuliers'),'Logistique et besoins particuliers':safe('logistique'),
  'Règlement accepté':registrationSafe_(value('reglement')||value('code_conduite')),'Code de conduite accepté':safe('code_conduite'),'Informations exactes':safe('exactitude'),'Consentement':safe('consentement')
 };
}
function doPost(e){
 const requestId=Utilities.getUuid(),lock=LockService.getScriptLock();let locked=false,phase='validation';
 try{
  const p=(e&&e.parameter)||{},token=PropertiesService.getScriptProperties().getProperty('SUBMISSION_TOKEN');
  if(!token||p.auth_token!==token)return registrationJson_({ok:false,code:'AUTHORIZATION',requestId});
  const type=p.type;if(!['registration','contact'].includes(type))return registrationJson_({ok:false,code:'INVALID_TYPE',requestId});
  const invalid=validateForm_(type,p);if(invalid)return registrationJson_({ok:false,code:invalid,requestId});
  phase='lock';lock.waitLock(10000);locked=true;
  phase='spreadsheet';const spreadsheet=registrationSpreadsheet_();
  const sheet=type==='contact'?formSheet_(spreadsheet,'Contacts',CONTACT_HEADERS):registrationSheet_(spreadsheet);
  const headers=registrationHeaders_(sheet),id=String(p.submission_id).trim(),idHeader=type==='contact'?'Identifiant de demande':'Identifiant de soumission';
  const fingerprint=fingerprint_(type,p),existing=findSubmission_(sheet,headers,idHeader,id);
  if(existing){
   if(String(sheet.getRange(existing,headers.indexOf('Empreinte soumission')+1).getValue())!==fingerprint)return registrationJson_({ok:false,code:'SUBMISSION_ID_REUSED',requestId});
   SpreadsheetApp.flush();
   return registrationJson_({ok:true,stored:true,submissionId:id,duplicate:true,requestId});
  }
  const data=type==='contact'?{'Date':new Date(),'Nom':registrationSafe_(p.nom),'Email':registrationSafe_(p.email),'Message':registrationSafe_(p.message),'Langue du site':registrationSafe_(p.langue_site)}:registrationData_(p);
  data[idHeader]=id;data['Empreinte soumission']=fingerprint;
  const row=headers.map(header=>Object.prototype.hasOwnProperty.call(data,header)?data[header]:'');
  phase='append';const nextRow=Math.max(sheet.getLastRow()+1,2);
  if(nextRow>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),nextRow-sheet.getMaxRows());
  sheet.getRange(nextRow,1,1,row.length).setValues([row]);
  sheet.getRange(nextRow,headers.indexOf('Date')+1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  phase='flush';SpreadsheetApp.flush();
  if(String(sheet.getRange(nextRow,headers.indexOf(idHeader)+1).getValue())!==id)throw new Error('La relecture ne confirme pas la ligne.');
  console.info(JSON.stringify({requestId,code:'FORM_SAVED',type,submissionId:id}));
  return registrationJson_({ok:true,stored:true,submissionId:id,duplicate:false,requestId});
 }catch(error){console.error(JSON.stringify({requestId,phase,code:'SCRIPT_ERROR',message:String(error.message||error)}));return registrationJson_({ok:false,code:'SCRIPT_ERROR',requestId});}
 finally{if(locked)lock.releaseLock();}
}
