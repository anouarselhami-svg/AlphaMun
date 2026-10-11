import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { committees } from '../data/committees';
import { ArrowDown, ArrowUpRight } from './icons';

function Flag({ value, english }) {
  const flags = {
    fr: ['🇫🇷', english ? 'French debate language' : 'Langue de débat française'],
    en: ['🇬🇧', english ? 'English debate language' : 'Langue de débat anglaise'],
    ma: ['🇲🇦', english ? 'Morocco flag; MPS debate language unconfirmed' : 'Drapeau marocain ; langue de débat de MPS non confirmée'],
  };
  const [,label] = flags[value];
  return <img className="committee-flag" role="img" data-country={value} aria-label={label} alt={label} src={`/assets/flags/${value === 'en' ? 'gb' : value}.svg`} width="28" height="20" />;
}

function CommitteeCard({ committee, language, open, onToggle }) {
  const [failedLogo, setFailedLogo] = useState(null);
  const english = language === 'en';
  const flag = committee.debateLanguage === 'fr' ? 'fr' : committee.debateLanguage === 'en' ? 'en' : 'ma';
  return <li className="committee-card">
    <div className="committee-logo">{committee.logo && failedLogo !== committee.logo
      ? <img src={committee.logo} alt={`${english ? 'Logo of' : 'Logo du comité'} ${committee.acronym}`} width="160" height="100" loading="lazy" onError={() => setFailedLogo(committee.logo)} />
      : <span className="committee-logo-missing">{english ? 'Logo unavailable' : 'Logo indisponible'}</span>}</div>
    <div className="committee-controls">
      <Flag value={flag} english={english} />
      <button type="button" className="committee-toggle" id={`committee-toggle-${committee.id}`} aria-label={`${english ? (open ? 'Hide details for' : 'Show details for') : (open ? 'Masquer les détails de' : 'Afficher les détails de')} ${committee.acronym}`} aria-expanded={open} aria-controls={`committee-details-${committee.id}`} onClick={onToggle}><ArrowDown /></button>
    </div>
    <div className="committee-details" id={`committee-details-${committee.id}`} hidden={!open} role="region" aria-labelledby={`committee-toggle-${committee.id}`}>
      <h3 className="committee-full-name">{committee.name[language] || committee.acronym}</h3>
      <p><strong>{english ? 'Definition' : 'Définition'} : </strong>{committee.definition[language]}</p>
      {committee.topic && <p><strong>{english ? 'Debate topic' : 'Sujet de débat'} : </strong>{committee.topic[language]}</p>}
    </div>
  </li>;
}

export default function Committees() {
  const { t, language } = useLanguage();
  const english = language === 'en';
  const [filter,setFilter] = useState('all');
  const [openId,setOpenId] = useState(null);
  const filtered = committees.filter(committee => filter === 'all' || (filter === 'ma' ? committee.acronym === 'MPS' : committee.debateLanguage === filter));
  return <section id="comites" className="section committees">
    <div className="section-heading">
      <div><p className="eyebrow">{t('02 / COMITÉS & ACADEMICS')}</p><h2>{t('Chaque débat ouvre')}<br />{t('une nouvelle perspective.')}</h2></div>
      <p>{t('Géopolitique, économie, enjeux humanitaires : explorez la diplomatie à travers des débats et la rédaction de résolutions.')}</p>
    </div>
    <div className="committee-filters" role="group" aria-label={english ? 'Filter by debate language' : 'Filtrer par langue de débat'}>
      {[['all',english?'All':'Tous'],['fr',english?'French':'Français'],['en',english?'English':'Anglais'],['ma',english?'Moroccan committee':'Comité marocain']].map(([value,label]) => <button type="button" key={value} aria-label={label} aria-pressed={filter===value} aria-controls="committee-grid" onClick={() => {setFilter(value);setOpenId(null);}}>{value === 'all' ? label : <Flag value={value} english={english} />}</button>)}
    </div>
    <ul className="committee-grid" id="committee-grid">{filtered.map(committee => <CommitteeCard key={committee.id} committee={committee} language={language} open={openId===committee.id} onToggle={() => setOpenId(current => current===committee.id ? null : committee.id)} />)}</ul>
    <a href="/#packs" className="text-link committee-registration">{t('Préparer mon inscription')} <ArrowUpRight /></a>
  </section>;
}
