import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { boardMembers } from '../data/board';

function MemberCard({ member, language }) {
  const [failedPhoto, setFailedPhoto] = useState(null);
  const initials = member.name.split(/\s+/).map(part => part[0]).join('');
  return <li className="board-card">
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
  return <section className="section board" id="bureau" aria-labelledby="board-title">
    <p className="eyebrow">{t('LE BUREAU')}</p>
    <h2 id="board-title">{language === 'en' ? 'Our organising team' : 'Notre équipe organisatrice'}</h2>
    <ul className="board-grid">{boardMembers.map(member => <MemberCard key={member.name} member={member} language={language} />)}</ul>
  </section>;
}
