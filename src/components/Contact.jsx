import { useLanguage } from '../i18n/LanguageContext';
import { ArrowUpRight } from './icons';
import { useRef, useState } from 'react';
import { config } from '../config';
import { submitContact, submissionAttempt } from '../services/registration';

export default function Contact() {
  const {t,language}=useLanguage();
  const [status,setStatus]=useState('');
  const [pending,setPending]=useState(false);
  const [saved,setSaved]=useState(false);
  const sending=useRef(false),attempt=useRef(null);
  const english=language==='en';
  async function handleSubmit(event){
    event.preventDefault();if(sending.current||saved)return;
    const form=event.currentTarget;
    for(const name of ['nom','email','message'])form.elements[name].setCustomValidity(form.elements[name].value.trim()?'':t('Veuillez remplir ce champ.'));
    if(!form.reportValidity())return;
    const data={...Object.fromEntries(new FormData(form)),langue_site:language};
    sending.current=true;setPending(true);setStatus('pending');
    try{await submitContact(submissionAttempt(attempt,data));setSaved(true);setStatus('saved');}
    catch{setStatus('failed');}
    finally{sending.current=false;setPending(false);}
  }
  const message={pending:english?'Sending your request…':'Envoi de votre demande…',saved:english?'Your request has been recorded. Thank you!':'Votre demande a bien été enregistrée. Merci !',failed:english?'Saving could not be confirmed. Your answers are preserved. Please try again; the same submission will not be recorded twice.':'L’enregistrement n’a pas pu être confirmé. Vos réponses sont conservées. Réessayez : la même demande ne sera pas enregistrée deux fois.'}[status]||'';
  return <section id="contact" className="section contact"><div><p className="eyebrow">{t('RESTONS EN CONTACT')}</p><h2>{t('Une question ?')}<br />{t('Ouvrons le dialogue.')}</h2><p>YouthGlobalClub · Groupe Pédagogique Alpha<br />{t('Kénitra, Maroc')}</p>{config.contactEmail&&<p className="muted">{t('Adresse officielle :')}<br /><a className="text-link" href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a></p>}</div>
    <form id="contact-form" onSubmit={handleSubmit} onInvalid={event=>event.target.setCustomValidity(event.target.validity.typeMismatch?(english?'Enter a valid email address.':'Saisissez une adresse e-mail valide.'):t('Veuillez remplir ce champ.'))} onInput={event=>{event.target.setCustomValidity?.('');setSaved(false);setStatus('');}}>
      <label>{t('Votre nom')}<input name="nom" required disabled={pending} autoComplete="name" placeholder={t('Votre nom')} /></label>
      <label>{t('Votre e-mail')}<input name="email" type="email" required disabled={pending} autoComplete="email" placeholder={english?'you@example.com':'vous@exemple.com'} /></label>
      <label>{t('Votre message')}<textarea name="message" required disabled={pending} rows="4" placeholder={t('Parlons de votre question ou de votre partenariat…')} /></label>
      <button className="button outline" type="submit" disabled={pending||saved}>{pending?(english?'Sending…':'Envoi…'):(english?'Send my message':'Envoyer mon message')} <ArrowUpRight /></button>
      <p id="contact-status" role="status" aria-live="polite">{message}</p>
    </form>
  </section>;
}
