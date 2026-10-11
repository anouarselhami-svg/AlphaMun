import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { boardLeaders, boardDepartments } from '../data/board';
import { ArrowDown } from './icons';

function MemberCard({ member, language, department }) {
  const [failedPhoto, setFailedPhoto] = useState(null);
  const initials = member.name.split(/\s+/).map(part => part[0]).join('');
  return <li className="board-card">
    <div className="board-avatar" aria-hidden="true">
      {member.photo && failedPhoto !== member.photo
        ? <img src={member.photo} alt="" width="88" height="88" loading="lazy" onError={() => setFailedPhoto(member.photo)} />
        : <span>{initials}</span>}
    </div>
    <h3>{member.name}</h3>
    <p className="board-role">{member.role[language]}</p>
    {department && <p className="board-department-label">{department}</p>}
  </li>;
}

function Department({ department, language }) {
  const [expanded, setExpanded] = useState(false);
  return <div className="board-department">
    <h3 className="board-department-title"><button type="button" className="board-department-toggle" id={`board-toggle-${department.id}`} aria-expanded={expanded} aria-controls={`board-members-${department.id}`} onClick={() => setExpanded(current => !current)}><span>{department.name[language]}</span><ArrowDown /></button></h3>
    <ul className="board-grid" id={`board-members-${department.id}`} hidden={!expanded} aria-labelledby={`board-toggle-${department.id}`} style={{ '--department-columns': department.members.length }}>
      {department.members.map(member => <MemberCard key={member.name} member={member} language={language} department={department.name[language]} />)}
    </ul>
  </div>;
}

export default function Board() {
  const { language, t } = useLanguage();
  return <section className="section board" id="bureau" aria-labelledby="board-title">
    <p className="eyebrow">{t('LE BUREAU')}</p>
    <h2 id="board-title">{language === 'en' ? 'Our organising team' : 'Notre équipe organisatrice'}</h2>
    <div className="board-leaders-group"><ul className="board-leaders">
      {boardLeaders.map(member => <MemberCard key={member.name} member={member} language={language} />)}
    </ul></div>
    <div className="board-departments">{boardDepartments.map(department => <Department key={department.id} department={department} language={language} />)}</div>
  </section>;
}
