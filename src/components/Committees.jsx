import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { committees } from '../data/committees';
import { ArrowDown, ArrowUpRight } from './icons';

function CommitteeCard({ committee, language, open, onToggle }) {
  const [failedLogo, setFailedLogo] = useState(null);
  const english = language === 'en';
  const debateLabel = committee.debateLanguage === 'fr' ? (english ? 'French' : 'Français') : committee.debateLanguage === 'en' ? (english ? 'English' : 'Anglais') : (english ? 'To be confirmed' : 'À confirmer');
  return <li className="committee-card">
    <div className="committee-logo" aria-hidden="true">{committee.logo && failedLogo !== committee.logo ? <img src={committee.logo} alt="" width="56" height="56" loading="lazy" onError={() => setFailedLogo(committee.logo)} /> : <span>{committee.acronym}</span>}</div>
    <h3><button type="button" className="committee-toggle" id={`committee-toggle-${committee.id}`} aria-expanded={open} aria-controls={`committee-details-${committee.id}`} onClick={onToggle}><span>{committee.acronym}</span><ArrowDown /></button></h3>
    <p className="committee-meta">{english ? 'Debate language' : 'Langue de débat'} : <strong>{debateLabel}</strong></p>
    <p className="committee-meta">{english ? 'Capacity' : 'Capacité'} : <strong>{committee.capacity}</strong></p>
    {committee.crisis && <span className="committee-crisis">{english ? 'Crisis' : 'Crise'}</span>}
    <div className="committee-details" id={`committee-details-${committee.id}`} hidden={!open} role="region" aria-labelledby={`committee-toggle-${committee.id}`}>
      {committee.name[language] && <p className="committee-full-name">{committee.name[language]}</p>}
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
  const filtered = committees.filter(committee => filter === 'all' || committee.debateLanguage === filter);
  return <section id="comites" className="section committees">
    <div className="section-heading">
      <div><p className="eyebrow">{t('02 / COMITÉS & ACADEMICS')}</p><h2>{t('Chaque débat ouvre')}<br />{t('une nouvelle perspective.')}</h2></div>
      <p>{t('Géopolitique, économie, enjeux humanitaires : explorez la diplomatie à travers des débats et la rédaction de résolutions.')}</p>
    </div>
    <div className="committee-filters" role="group" aria-label={english ? 'Filter by debate language' : 'Filtrer par langue de débat'}>
      {[['all',english?'All':'Tous'],['fr',english?'French':'Français'],['en',english?'English':'Anglais']].map(([value,label]) => <button type="button" key={value} aria-pressed={filter===value} aria-controls="committee-grid" onClick={() => {setFilter(value);setOpenId(null);}}>{label}</button>)}
    </div>
    <ul className="committee-grid" id="committee-grid">{filtered.map(committee => <CommitteeCard key={committee.id} committee={committee} language={language} open={openId===committee.id} onToggle={() => setOpenId(current => current===committee.id ? null : committee.id)} />)}</ul>
    <a href="/#packs" className="text-link committee-registration">{t('Préparer mon inscription')} <ArrowUpRight /></a>
  </section>;
}
