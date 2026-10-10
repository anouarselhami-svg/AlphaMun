import { useLanguage } from '../i18n/LanguageContext';
import { config } from '../config';
import { ArrowUpRight } from './icons';

function Packs() {
  const { t, language } = useLanguage();
  const registrationUrl = pack => { const url = new URL(config.registrationSiteUrl); url.searchParams.set('pack', pack); return url.href; }; 
  return <section id="packs" className="section packs"><p className="eyebrow">{t("03 / VOTRE EXPÉRIENCE")}</p><div className="section-heading"><h2>{t("Deux packs.")}<br />{t("La même")} <em>{t("ambition.")}</em></h2><p>{t("Choisissez la formule qui vous correspond.")}<br />{t("Le paiement n’est pas effectué sur ce site.")}</p></div><div className="pack-grid"><article className="pack"><div className="pack-title"><span>{t("01 / PACK DÉLÉGUÉ")}</span><span>{t("3 JOURS D’EXPÉRIENCE")}</span></div><h3>{t("Au cœur du débat.")}</h3><p className="price">500 <span>MAD</span></p><p>{t("Vivez l’ensemble de l’expérience Alpha MUN.")}</p><ul><li>{t("Repas et boissons inclus")}</li><li>{t("Activité d’intégration & ateliers interactifs")}</li><li>{t("Sessions de débat & soirée à thème")}</li><li>{t("Welcome pack & certificat signé")}</li></ul><a href={registrationUrl("500")} target="_blank" rel="noopener noreferrer" className="button outline">{t("Choisir ce pack")} <ArrowUpRight /></a></article><article className="pack premium"><div className="pack-title"><span>{t("02 / PACK AVEC HÔTEL")}</span><span>{t("LE SÉJOUR COMPLET")}</span></div><h3>{t("L’esprit libre.")}</h3><p className="price">1 500 <span>MAD</span></p><p>{t("L’expérience complète, avec l’hébergement.")}</p><ul><li><b>{t("Deux nuits à l’hôtel")}</b></li><li>{t("Repas et boissons inclus")}</li><li>{t("Intégration, ateliers, débats & soirée à thème")}</li><li>{t("Welcome pack & certificat signé")}</li></ul><a href={registrationUrl("1500")} target="_blank" rel="noopener noreferrer" className="button">{t("Choisir ce pack")} <ArrowUpRight /></a></article></div></section>;
}
export {
  Packs as default
};
