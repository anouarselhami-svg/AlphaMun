import { useLanguage } from '../i18n/LanguageContext';
import { config } from '../config';

function StaffSection() {
  const { language, t } = useLanguage();
  const english = language === 'en';
  return <section className="section" id="staff" lang={english ? 'en' : 'fr'}>
    <p className="eyebrow">{english ? 'JOIN THE STAFF' : 'REJOINDRE LE STAFF'}</p>
    <h2>{english ? 'Help organise the event.' : 'Participez à l’organisation.'}</h2>
    <p>{english ? 'Join the team and help organise Alpha MUN 8.' : 'Rejoignez l’équipe et participez à l’organisation d’Alpha MUN 8.'}</p>
    <a className="button outline" href={config.staffFormUrl} target="_blank" rel="noopener noreferrer">{english ? 'Join the staff' : 'Devenir staff'}</a>
  </section>;
}

export default function EventDetails() {
  const { t, language } = useLanguage();
  return <>
    <section className="section" id="programme"><p className="eyebrow">{t("PROGRAMME")}</p><h2>{t("Trois jours de rencontres.")}</h2><p>{t("Le programme détaillé et les horaires seront annoncés par l’équipe organisatrice.")}</p></section>
    <section className="section" id="lieu"><p className="eyebrow">{t("LIEU & HORAIRES")}</p><h2>Kénitra</h2><p>{t("Le lieu exact et les horaires restent à confirmer.")}</p></section>
    <section className="section" id="bureau"><p className="eyebrow">{t("LE BUREAU")}</p><h2>{t("13 membres engagés.")}</h2><p>{t("Les noms, fonctions et portraits seront présentés après confirmation.")}</p></section>
    <StaffSection />
  </>;
}
