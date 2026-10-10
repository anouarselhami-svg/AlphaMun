import { useState } from 'react';
import { config } from '../config';

function StaffSection() {
  const [language, setLanguage] = useState(() => localStorage.getItem('amun-language') || 'fr');
  const english = language === 'en';
  function chooseLanguage(value) {
    setLanguage(value);
    localStorage.setItem('amun-language', value);
  }
  return <section className="section" id="staff" lang={english ? 'en' : 'fr'}>
    <div className="language-switch" aria-label={english ? 'Staff section language' : 'Langue de la section staff'}>
      {['fr', 'en'].map(value => <button key={value} type="button" aria-pressed={language === value} onClick={() => chooseLanguage(value)}>{value.toUpperCase()}</button>)}
    </div>
    <p className="eyebrow">{english ? 'JOIN THE STAFF' : 'REJOINDRE LE STAFF'}</p>
    <h2>{english ? 'Help organise the event.' : 'Participez à l’organisation.'}</h2>
    <p>{english ? 'Join the team and help organise Alpha MUN 8.' : 'Rejoignez l’équipe et participez à l’organisation d’Alpha MUN 8.'}</p>
    <a className="button outline" href={config.staffFormUrl} target="_blank" rel="noopener noreferrer">{english ? 'Join the staff' : 'Devenir staff'}</a>
  </section>;
}

export default function EventDetails() {
  return <>
    <section className="section" id="programme"><p className="eyebrow">PROGRAMME</p><h2>Trois jours de rencontres.</h2><p>Le programme détaillé et les horaires seront annoncés par l’équipe organisatrice.</p></section>
    <section className="section" id="lieu"><p className="eyebrow">LIEU & HORAIRES</p><h2>Kénitra</h2><p>Le lieu exact et les horaires restent à confirmer.</p></section>
    <section className="section" id="bureau"><p className="eyebrow">LE BUREAU</p><h2>13 membres engagés.</h2><p>Les noms, fonctions et portraits seront présentés après confirmation.</p></section>
    <StaffSection />
  </>;
}
