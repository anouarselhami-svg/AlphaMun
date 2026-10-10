import { useLanguage } from '../i18n/LanguageContext';
function Story() {
  const { t, language } = useLanguage();
  return <section id="histoire" className="story section"><div><p className="eyebrow">{t("01 / L’ESPRIT ALPHA MUN")}</p><h2>{t("Un monde à comprendre.")}<br />{t("Une voix à")} <em>{t("construire.")}</em></h2></div><div className="story-text"><p>{t("Un Model United Nations est une simulation des Nations Unies. Vous représentez un pays, défendez ses positions et négociez des réponses aux grandes questions de notre monde.")}</p><p>{t("Organisé sous l’égide du Groupe Pédagogique Alpha à Kénitra, Alpha MUN est le projet phare du YouthGlobalClub. Sept éditions, des bureaux engagés et une même ambition : donner à la jeunesse les moyens de prendre la parole.")}</p><div className="tags"><span>{t("Prise de parole")}</span><span>{t("Négociation")}</span><span>Leadership</span></div></div>
  <div className="stats"><div><b>7</b><span>{t("ans d’impact")}</span></div>
  <div><b>8</b><span>{t("présidents engagés")}</span></div>
  <div><b>7</b><span>{t("bureaux dévoués")}</span></div>
  <div><b>1 700+</b><span>{t("délégués formés")}</span></div></div></section>;
}
export {
  Story as default
};
