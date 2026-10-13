import { useLanguage } from '../i18n/LanguageContext';
function Footer() {
  const { t, language } = useLanguage();
  return <footer><a className="brand" href="/#accueil"><img className="brand-mark" src="/assets/alpha-emblem.svg" alt={t("Globe entouré de branches de laurier")} /><span>ALPHA <b>MUN</b><small>YOUTHGLOBALCLUB</small></span></a><p>{t("La jeunesse prend la parole.")}</p><a href="/#accueil">{t("Retour en haut ↑")}</a></footer>;
}
export {
  Footer as default
};
