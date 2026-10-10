import { useLanguage } from '../i18n/LanguageContext';
function FAQ() {
  const { t, language } = useLanguage();
  return <section id="faq" className="section faq"><div><p className="eyebrow">{t("05 / BON À SAVOIR")}</p><h2>{t("Vos questions.")}<br />{t("Nos réponses.")}</h2></div><div><details><summary>{t("Qu’est-ce qu’un MUN ?")}<span>+</span></summary><p>{t("Une simulation des Nations Unies : les participants représentent des pays, débattent, négocient et rédigent des résolutions.")}</p></details><details><summary>{t("Faut-il avoir déjà participé ?")}<span>+</span></summary><p>{t("Le formulaire permet de préciser une première participation. Les niveaux et conditions propres à chaque comité seront annoncés par le board.")}</p></details><details><summary>{t("Que comprennent les packs ?")}<span>+</span></summary><p>{t("Les deux packs incluent repas, boissons, activités, ateliers, débats, soirée à thème, welcome pack et certificat signé. Le pack à 1 500 MAD ajoute deux nuits à l’hôtel.")}</p></details><details><summary>{t("Quel est le code vestimentaire ?")}<span>+</span></summary><p>{t("Le code vestimentaire officiel sera communiqué par l’équipe organisatrice avant l’événement.")}</p></details><details><summary>{t("Où trouver les horaires et le lieu exact ?")}<span>+</span></summary><p>{t("L’événement se déroule à Kénitra les 22, 23 et 24 janvier. L’année, le lieu exact et les horaires restent à confirmer par le club.")}</p></details></div></section>;
}
export {
  FAQ as default
};
