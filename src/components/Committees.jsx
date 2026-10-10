import { useLanguage } from '../i18n/LanguageContext';
import { config } from "../config";
function Committees() {
  const { t, language } = useLanguage();
  return <section id="comites" className="section committees">
      <div className="section-heading">
        <div><p className="eyebrow">{t("02 / COMITÉS & ACADEMICS")}</p><h2>{t("Chaque débat ouvre")}<br />{t("une nouvelle perspective.")}</h2></div>
        <p>{t("Géopolitique, économie, enjeux humanitaires : explorez la diplomatie à travers des débats et la rédaction de résolutions.")}</p>
      </div>
      {config.committees.length ? config.committees.map((committee) => <article className="committee-panel" key={committee.name}>
          <span className="committee-symbol" aria-hidden="true">◎</span>
          <div><p className="eyebrow">{(language==='en'?committee.levelEn:committee.level) || t('Niveau à confirmer')}</p><h3>{committee.name}</h3><p>{(language==='en'?committee.descriptionEn:committee.description) || t('Sujet à confirmer.')}</p></div>
          <a href="/#packs" className="text-link">{t("Préparer mon inscription")} <ArrowUpRight /></a>
        </article>) : <div className="committee-panel">
          <span className="committee-symbol" aria-hidden="true">◎</span>
          <div><p className="eyebrow">{t("L’ÉDITION SE PRÉPARE")}</p><h3>{t("Les comités seront annoncés prochainement.")}</h3><p>{t("Les noms, les sujets et les niveaux de difficulté seront publiés après confirmation par le board.")}</p></div>
          <a href="/#packs" className="text-link">{t("Préparer mon inscription")} <ArrowUpRight /></a>
        </div>}
    </section>;
}
export {
  Committees as default
};
import { ArrowUpRight } from './icons';
