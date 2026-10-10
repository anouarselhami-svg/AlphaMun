import { useRef, useState } from 'react';
import { config } from '../config';
import { registrationCommittees, registrationFields } from '../services/registration-schema';
import { submitRegistration } from '../services/registration';

const confirmations = ['confirmation_pack','consentement','code_conduite','exactitude'];
export default function Registration({pack,onChoosePack}) {
  const [language,setLanguage] = useState(() => localStorage.getItem('amun-language') || 'fr');
  const t = (fr,en) => language === 'en' ? en : fr;
  const [data,setData] = useState(() => ({...Object.fromEntries(registrationFields.map(name=>[name,confirmations.includes(name)?false:''])),pack:['500','1500'].includes(pack)?pack:''}));
  const [step,setStep] = useState(0);
  const [errors,setErrors] = useState({});
  const [pending,setPending] = useState(false);
  const [status,setStatus] = useState('');
  const [saved,setSaved] = useState(null);
  const sending = useRef(false);
  const title = useRef(null);
  const steps = [t('Informations personnelles et coordonnées','Personal information and contact details'),t('Préférences de comité et expérience MUN','Committee preferences and MUN experience'),t('Motivation et parcours','Motivation and background'),t('Logistique et formule','Logistics and package'),t('Validations finales et confirmation','Final confirmations and review')];
  const groups = [registrationFields.slice(0,9),['comite_choix_1','comite_choix_2','comite_choix_3','participations_mun'],['experience_details','motivation','attentes'],['pack','logistique'],confirmations];
  const labels = {
    prenom:t('Prénom','First name'),nom:t('Nom','Last name'),age:t('Âge','Age'),email:'Email',telephone:t('Numéro de téléphone','Phone number'),contact_parent:t('Contact d’un parent ou tuteur','Parent or guardian phone'),ville:t('Ville de résidence','City of residence'),etablissement:t('Établissement / école / université','Institution / school / university'),niveau:t('Niveau scolaire ou classe','Grade or education level'),
    comite_choix_1:t('Premier choix','First choice'),comite_choix_2:t('Deuxième choix','Second choice'),comite_choix_3:t('Troisième choix','Third choice'),participations_mun:t('Nombre de participations à un MUN','Number of MUN participations'),experience_details:t('Décrivez brièvement votre expérience MUN : postes, distinctions, etc.','Briefly describe your MUN experience: roles, awards, etc.'),motivation:t('Pourquoi souhaitez-vous participer à Alpha MUN et être affecté(e) à votre comité de premier choix ?','Why do you want to participate in Alpha MUN and be assigned to your first-choice committee?'),attentes:t('Qu’espérez-vous tirer de cette expérience ?','What do you hope to gain from this experience?'),pack:t('Pack choisi','Selected package'),logistique:t('Logistique et besoins particuliers : hébergement, restrictions alimentaires, etc.','Logistics and special needs: accommodation, dietary restrictions, etc.'),
    confirmation_pack:t('Je reconnais avoir choisi ce pack et j’en assume les conditions.','I acknowledge choosing this package and accept its conditions.'),consentement:t('J’accepte l’utilisation de mes informations par YouthGlobalClub pour traiter mon inscription.','I agree to YouthGlobalClub using my information to process my registration.'),code_conduite:t('J’accepte de me conformer aux règles et au code de conduite d’AMUN.','I agree to comply with AMUN rules and code of conduct.'),exactitude:t('Je confirme que les informations fournies sont exactes.','I confirm that the information provided is accurate.'),
  };
  const languageName = value => ({en:t('Anglais','English'),fr:t('Français','French'),ary:t('Dialecte marocain','Moroccan dialect')})[value];
  const packName = value => value==='500'?t('Pack Normal — 500 MAD','Normal Package — 500 MAD'):value==='1500'?t('Pack Premium — 1 500 MAD','Premium Package — 1 500 MAD'):t('Choisissez votre pack','Choose your package');
  function update(name,value) {
    setData(previous=>({...previous,[name]:value,...(name==='pack'?{confirmation_pack:false}:{})}));
    setErrors(previous=>({...previous,[name]:''}));
    if(name==='pack') onChoosePack(value);
  }
  function focusError(next) { requestAnimationFrame(()=>document.getElementById(Object.keys(next)[0])?.focus()); }
  function validate(index) {
    const next = {};
    for(const name of groups[index]) if(data[name] === false || !String(data[name]).trim()) next[name]=t('Ce champ est obligatoire.','This field is required.');
    if(index===0) {
      if(!/^\d+$/.test(data.age)||!Number.isSafeInteger(Number(data.age))||Number(data.age)<=0) next.age=t('Saisissez un entier positif.','Enter a positive integer.');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) next.email=t('Adresse e-mail invalide.','Invalid email address.');
      for(const name of ['telephone','contact_parent']) if(!/^\+?[\d\s().-]+$/.test(data[name])||data[name].replace(/\D/g,'').length<7||data[name].replace(/\D/g,'').length>15) next[name]=t('Saisissez un numéro international valide.','Enter a valid international phone number.');
    }
    if(index===1) {
      if(!/^\d+$/.test(data.participations_mun)||!Number.isSafeInteger(Number(data.participations_mun))) next.participations_mun=t('Saisissez un entier positif ou nul.','Enter a non-negative integer.');
      const choices = groups[1].slice(0,3);
      choices.forEach((name,index)=>{if(!registrationCommittees.some(c=>c.name===data[name])) next[name]=t('Choisissez un comité proposé.','Choose an available committee.');else if(choices.slice(0,index).some(other=>data[other]===data[name])) next[name]=t('Choisissez trois comités distincts.','Choose three distinct committees.');});
    }
    if(index===3&&!['500','1500'].includes(data.pack)) next.pack=t('Choisissez un pack.','Choose a package.');
    setErrors(next);
    if(Object.keys(next).length) {setStep(index);focusError(next);return false;}
    return true;
  }
  function move(index) {setStep(index);setErrors({});requestAnimationFrame(()=>title.current?.focus());}
  async function submit(event) {
    event.preventDefault(); if(sending.current) return;
    for(let index=0;index<5;index++) if(!validate(index)) return;
    const payload=Object.fromEntries(Object.entries(data).map(([name,value])=>[name,typeof value==='boolean'?(value?'on':''):value.trim()]));
    sending.current=true;setPending(true);setStatus(t('Envoi de votre inscription…','Sending your registration…'));
    try {await submitRegistration(payload);setSaved(payload);setStatus('');}
    catch {setStatus(t('L’enregistrement n’a pas pu être confirmé. Vos réponses sont conservées. Vous pouvez réessayer. Si le serveur a reçu l’envoi sans pouvoir répondre, l’inscription a peut-être été enregistrée.','Registration could not be confirmed. Your answers are preserved; you can try again. If the server received the submission but could not respond, it may have been recorded.'));}
    finally {sending.current=false;setPending(false);}
  }
  function field(name,{long=false,type='text',options,help}={}) {
    const props={id:name,name,value:data[name],required:true,onChange:event=>update(name,event.target.value),'aria-invalid':!!errors[name],'aria-describedby':[help?`${name}-help`:'',errors[name]?`${name}-error`:''].filter(Boolean).join(' ')||undefined};
    return <label key={name} className={long||name.startsWith('comite_')?'wide':''} htmlFor={name}><span>{labels[name]} *</span>{options?<select {...props}><option value="">{t('Sélectionner','Select')}</option>{options.map(([value,label])=><option key={value} value={value} disabled={name.startsWith('comite_')&&[1,2,3].some(i=>`comite_choix_${i}`!==name&&data[`comite_choix_${i}`]===value)}>{label}</option>)}</select>:long?<textarea {...props} rows={4}/>:<input {...props} type={type} min={type==='number'?(name==='age'?1:0):undefined} step={type==='number'?1:undefined} inputMode={['age','participations_mun'].includes(name)?'numeric':undefined} autoComplete={({prenom:'given-name',nom:'family-name',email:'email',telephone:'tel',ville:'address-level2'})[name]}/>} {help&&<small id={`${name}-help`}>{help}</small>}{errors[name]&&<span id={`${name}-error`} className="field-error" role="alert">{errors[name]}</span>}</label>;
  }
  function summary(values,full=false) {
    return <dl className="registration-recap">{registrationFields.filter(name=>full||['prenom','nom','ville','pack','comite_choix_1','comite_choix_2','comite_choix_3'].includes(name)).map(name=><div key={name}><dt>{labels[name]}</dt><dd>{name==='pack'?packName(values[name]):confirmations.includes(name)?t('Oui','Yes'):values[name]}</dd></div>)}</dl>;
  }
  return <section className="section registration registration-page" id="inscription">
    <div className="registration-intro"><div className="language-switch" aria-label="Language">{['fr','en'].map(value=><button key={value} type="button" aria-pressed={language===value} onClick={()=>{setLanguage(value);localStorage.setItem('amun-language',value);}}>{value.toUpperCase()}</button>)}</div><p className="eyebrow">ALPHA MUN 8</p><h1>{t('Inscription à Alpha MUN 8','Registration for Alpha MUN 8')}</h1><p>{t('Vos informations seront transmises à YouthGlobalClub pour traiter votre inscription.','Your information will be sent to YouthGlobalClub to process your registration.')}</p></div>
    {saved?<div><h2>{t('Merci pour votre inscription ! Votre demande a bien été enregistrée.','Thank you for registering! Your submission has been successfully received.')}</h2>{summary(saved)}<p>{t('Cet enregistrement ne confirme ni le paiement ni l’admission.','This record does not confirm payment or admission.')}</p><a className="button" href={config.mainSiteUrl}>{t('Retour à l’accueil','Back to home')}</a></div>:<>
      <ol className="registration-progress">{steps.map((label,index)=><li key={index} aria-current={step===index?'step':undefined}><span>{index+1}</span>{label}</li>)}</ol>
      <div className="selected-pack"><strong>{packName(data.pack)}</strong>{!data.pack&&<label>{t('Choisissez votre pack','Choose your package')}<select value={data.pack} disabled={pending} onChange={event=>update('pack',event.target.value)}><option value="">{t('Choisir un pack','Choose a package')}</option>{['500','1500'].map(value=><option key={value} value={value}>{packName(value)}</option>)}</select></label>}<button type="button" disabled={pending} onClick={()=>move(3)}>{t('Changer de pack','Change package')}</button></div>
      <form noValidate onSubmit={submit}><fieldset disabled={pending}><legend ref={title} tabIndex={-1}>{step+1} / 5 — {steps[step]}</legend><div className="registration-fields">
        {step===0&&<><p className="wide name-group-title">{t('Nom complet','Full name')}</p>{field('prenom')}{field('nom')}{field('age',{type:'number'})}{field('email',{type:'email'})}{field('telephone',{type:'tel'})}{field('contact_parent',{type:'tel',help:t('Obligatoire pour tous les participants.','Required for every participant.')})}{field('ville')}{field('etablissement')}{field('niveau')}</>}
        {step===1&&<>{[1,2,3].map(index=>field(`comite_choix_${index}`,{options:registrationCommittees.map(c=>[c.name,`${c.name} — ${languageName(c.language)}`])}))}{field('participations_mun',{type:'number'})}<p className="wide notice">{t('Les choix expriment des préférences et ne garantissent pas l’affectation.','These choices express preferences and do not guarantee assignment.')}</p></>}
        {step===2&&<>{field('experience_details',{long:true,help:t('Si vous débutez, indiquez que vous n’avez pas encore d’expérience MUN.','If you are a beginner, state that you have no MUN experience yet.')})}{field('motivation',{long:true})}{field('attentes',{long:true})}</>}
        {step===3&&<>{field('pack',{options:['500','1500'].map(value=>[value,packName(value)])})}{field('logistique',{long:true,help:t('Si vous n’avez aucun besoin particulier, indiquez “Aucun”.','If you have no special needs, write “None”.')})}<p className="wide notice">{t('Cette réponse aide à l’organisation et ne constitue pas une réservation ou une prise en charge garantie.','This answer helps planning and does not guarantee a booking or support.')}</p></>}
        {step===4&&<>{confirmations.map(name=><label className="checkbox wide" key={name}><input id={name} name={name} type="checkbox" required checked={data[name]} onChange={event=>update(name,event.target.checked)} aria-invalid={!!errors[name]} aria-describedby={errors[name]?`${name}-error`:undefined}/><span>{labels[name]} *</span>{name==='consentement'&&<small className="wide">{t('Formulation provisoire : le texte complet de la capture doit être fourni avant publication.','Provisional wording: the full text from the screenshot must be supplied before publication.')}</small>}{errors[name]&&<span id={`${name}-error`} className="field-error" role="alert">{errors[name]}</span>}</label>)}<div className="wide"><h3>{t('Récapitulatif avant envoi','Review before submitting')}</h3>{summary(data,true)}{steps.slice(0,4).map((label,index)=><button key={index} type="button" onClick={()=>move(index)}>{t('Modifier : ','Edit: ')}{label}</button>)}</div></>}
      </div><div className="registration-actions">{step>0&&<button type="button" className="button outline" onClick={()=>move(step-1)}>{t('Précédent','Previous')}</button>}{step<4?<button type="button" className="button" onClick={()=>{if(validate(step))move(step+1);}}>{t('Suivant','Next')}</button>:<button className="button" type="submit" disabled={pending}>{pending?t('Envoi de votre inscription…','Sending your registration…'):t('Envoyer mon inscription','Submit registration')}</button>}</div></fieldset><p role="status" aria-live="polite">{status}</p></form>
    </>}
  </section>;
}
