import { useLanguage } from '../i18n/LanguageContext';
function Sponsors() {
  const { t, language } = useLanguage();
  return <section className="section sponsors"><p className="eyebrow">{t("ENSEMBLE, ALLONS PLUS LOIN")}</p><h2>{t("Accompagnez les voix")}<br />{t("de demain.")}</h2><p>{t("Vous souhaitez devenir partenaire d’Alpha MUN ?")}<br />{t("Échangeons autour de votre engagement.")}</p><a className="button outline" href="#contact">{t("Contacter le club")} <ArrowUpRight /></a></section>;
}
export {
  Sponsors as default
};
import { ArrowUpRight } from './icons';
