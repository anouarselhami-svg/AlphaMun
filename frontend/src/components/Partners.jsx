import { partners, proposedSpeakers, provisionalBudget, sponsors } from '../../../shared/edition.js';
import { useLanguage } from '../i18n/LanguageContext';

export default function Partners() {
  const { language } = useLanguage();
  const en = language === 'en';
  const label = en ? 'Proposed / awaiting confirmation' : 'Envisagés / en attente de confirmation';
  return <section className="section partners" id="partenaires">
    <p className="eyebrow">{en ? '04 / PARTNERS & SPEAKERS' : '04 / PARTENAIRES & INTERVENANTS'}</p>
    <h2>{en ? 'An edition built together.' : 'Une édition construite ensemble.'}</h2>
    <div className="partner-groups">
      <details><summary>{en ? 'Prospective sponsors' : 'Sponsors pressentis'} <span>+</span></summary><p>{label}</p><ul>{sponsors.map(name => <li key={name}>{name}</li>)}</ul></details>
      <details><summary>{en ? 'Prospective partners' : 'Partenaires envisagés'} <span>+</span></summary><p>{label}</p><ul>{partners.map(name => <li key={name}>{name}</li>)}</ul></details>
      <details><summary>{en ? 'Proposed speakers' : 'Intervenants proposés'} <span>+</span></summary><p>{label}</p><ul>{proposedSpeakers.map(name => <li key={name}>{name}</li>)}</ul></details>
      <details><summary>{en ? 'Provisional budget' : 'Budget prévisionnel'} <span>+</span></summary><p>{en ? 'All figures are provisional and may change.' : 'Tous les montants sont prévisionnels et susceptibles d’évoluer.'}</p><dl><div><dt>{en ? 'Indicated budget' : 'Budget nécessaire indiqué'}</dt><dd>{provisionalBudget.necessary.toLocaleString('fr-FR')} DH</dd></div><div><dt>{en ? 'Expected contributions' : 'Cotisations prévues'}</dt><dd>{provisionalBudget.contributions.toLocaleString('fr-FR')} DH</dd></div><div><dt>{en ? 'Additional funding sought' : 'Financement complémentaire recherché'}</dt><dd>{provisionalBudget.additional.toLocaleString('fr-FR')} DH</dd></div></dl><small>{en ? 'The PDF contains arithmetic inconsistencies in its detailed table (including the signs line); figures are reproduced without silent correction.' : 'Le PDF comporte des incohérences arithmétiques dans son tableau détaillé, notamment la ligne des pancartes ; les chiffres sont reproduits sans correction silencieuse.'}</small></details>
    </div>
  </section>;
}
