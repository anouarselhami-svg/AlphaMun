import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { boardMembers } from '../data/board';
import { useDisclosure } from '../hooks/useDisclosure';

function MemberCard({ member, language, hidden }) {
  const [failedPhoto, setFailedPhoto] = useState(null);
  const initials = member.name.split(/\s+/).map(part => part[0]).join('');
  return <li className="board-card" hidden={hidden}>
    <div className="board-avatar" aria-hidden="true">
      {member.photo && failedPhoto !== member.photo
        ? <img src={member.photo} alt="" width="88" height="88" loading="lazy" onError={() => setFailedPhoto(member.photo)} />
        : <span>{initials}</span>}
    </div>
    <h3>{member.name}</h3>
    <p>{member.role[language]}</p>
  </li>;
}

export default function Board() {
  const { language, t } = useLanguage();
  const { expanded, toggle, startRef } = useDisclosure();
  return <section className="section board" id="bureau" aria-labelledby="board-title" ref={startRef}>
    <p className="eyebrow">{t('LE BUREAU')}</p>
    <h2 id="board-title">{language === 'en' ? 'Our organising team' : 'Notre équipe organisatrice'}</h2>
    <ul className="board-grid" id="board-members">{boardMembers.map((member, index) => <MemberCard key={member.name} member={member} language={language} hidden={!expanded && index >= 3} />)}</ul>
    <button type="button" className="disclosure-button" aria-expanded={expanded} aria-controls="board-members" onClick={toggle}>{language === 'en' ? (expanded ? 'Show less of the team ↑' : 'View the whole team ↓') : (expanded ? 'Réduire l’équipe ↑' : 'Voir toute l’équipe ↓')}</button>
  </section>;
}
