import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { committees } from '../data/committees';
import { ArrowDown, ArrowUpRight } from './icons';

function Flag({ value, english }) {
  const flags = {
    fr: ['🇫🇷', english ? 'French debate language' : 'Langue de débat française'],
    en: ['🇬🇧', english ? 'English debate language' : 'Langue de débat anglaise'],
    ar: ['🇲🇦', english ? 'Morocco flag; Arabic debate language' : 'Drapeau marocain ; langue de débat arabe'],
  };
  const [,label] = flags[value];
  return <img className="committee-flag" role="img" data-country={value} aria-label={label} alt={label} src={`/assets/flags/${value === 'en' ? 'gb' : value === 'ar' ? 'ma' : value}.svg`} width="28" height="20" />;
}

function CommitteeCard({ committee, language, open, onToggle }) {
  const [failedLogo, setFailedLogo] = useState(null);
  const english = language === 'en';
  return <li className="committee-card">
    <button type="button" className="committee-toggle" id={`committee-toggle-${committee.id}`} aria-label={`${english ? (open ? 'Hide details for' : 'Show details for') : (open ? 'Masquer les détails de' : 'Afficher les détails de')} ${committee.acronym}`} aria-expanded={open} aria-controls={`committee-details-${committee.id}`} onClick={onToggle}>
      <span className="committee-logo">{committee.logo && failedLogo !== committee.logo
      ? <img src={committee.logo} alt={`${english ? 'Logo of' : 'Logo du comité'} ${committee.acronym}`} width="160" height="100" loading="lazy" onError={() => setFailedLogo(committee.logo)} />
      : <span className="committee-logo-missing">{english ? 'Logo unavailable' : 'Logo indisponible'}</span>}</span>
      <ArrowDown />
    </button>
    <div className="committee-details" id={`committee-details-${committee.id}`} hidden={!open} role="region" aria-labelledby={`committee-toggle-${committee.id}`} dir={committee.acronym === 'MPS' ? 'rtl' : undefined}>
      <h3 className="committee-full-name">{committee.name[language] || committee.acronym}</h3>
      <p><strong>{english ? 'Definition' : 'Définition'} : </strong>{committee.definition[language]}</p>
      {committee.topic && <><p><strong>{english ? 'Debate topic' : 'Sujet de débat'} : </strong>{committee.topic[language] || committee.topic.fr}</p>{committee.acronym === 'MPS' && <p lang="ar" dir="rtl"><strong>موضوع النقاش: </strong>{committee.topic.ar}</p>}</>}
    </div>
  </li>;
}

export default function Committees() {
  const { t, language } = useLanguage();
  const english = language === 'en';
  const [filter,setFilter] = useState(null);
  const [openId,setOpenId] = useState(null);
  const filtered = committees.filter(committee => committee.debateLanguage === filter);
  return <section id="comites" className="section committees">
    <div className="section-heading">
      <div><p className="eyebrow">{t('02 / COMITÉS & ACADEMICS')}</p><h2>{t('Chaque débat ouvre')}<br />{t('une nouvelle perspective.')}</h2></div>
      <p>{t('Géopolitique, économie, enjeux humanitaires : explorez la diplomatie à travers des débats et la rédaction de résolutions.')}</p>
    </div>
    <div className="committee-filters" role="group" aria-label={english ? 'Filter by debate language' : 'Filtrer par langue de débat'}>
      {[['fr',english?'French':'Français'],['en',english?'English':'Anglais'],['ar',english?'Arabic':'Arabe']].map(([value,label]) => <button type="button" key={value} aria-label={label} aria-expanded={filter===value} aria-controls="committee-grid" onClick={() => {setFilter(current => current===value ? null : value);setOpenId(null);}}><Flag value={value} english={english} /><ArrowDown /></button>)}
    </div>
    <ul className="committee-grid" id="committee-grid" hidden={filter===null}>{filtered.map(committee => <CommitteeCard key={committee.id} committee={committee} language={language} open={openId===committee.id} onToggle={() => setOpenId(current => current===committee.id ? null : committee.id)} />)}</ul>
    <a href="/#packs" className="text-link committee-registration">{t('Préparer mon inscription')} <ArrowUpRight /></a>
  </section>;
}
