import { useLanguage } from '../i18n/LanguageContext';
import { ArrowUpRight } from './icons';

import { useState } from "react";
import { config } from "../config";
function Contact() {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState("");
  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    for (const name of ['nom', 'email', 'message']) {
      const field = form.elements[name];
      field.setCustomValidity(field.value.trim() ? '' : t('Veuillez remplir ce champ.'));
    }
    if (!form.reportValidity()) return;
    if (!config.contactEmail) {
      setStatus("Le contact n’est pas configuré. Aucun e-mail n’a été envoyé.");
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    const body = `${t("Nom")} : ${data.nom.trim()}\nE-mail : ${data.email.trim()}\n\nMessage :\n${data.message.trim()}`;
    setStatus("Votre application de messagerie va s’ouvrir. Envoyez l’e-mail pour terminer.");
    window.location.href = `mailto:${config.contactEmail}?subject=${encodeURIComponent('Contact — Alpha MUN')}&body=${encodeURIComponent(body)}`;
  }
  return <section id="contact" className="section contact"><div><p className="eyebrow">{t("RESTONS EN CONTACT")}</p><h2>{t("Une question ?")}<br />{t("Ouvrons le dialogue.")}</h2><p>YouthGlobalClub · Groupe Pédagogique Alpha<br />{t("Kénitra, Maroc")}</p><p className="muted">{t("Adresse officielle :")}<br /><a className="text-link" href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a></p><p className="muted">{t("Votre application de messagerie va s’ouvrir. Envoyez l’e-mail pour terminer.")}</p></div><form id="contact-form" onSubmit={handleSubmit} onInvalid={event => event.target.setCustomValidity(event.target.validity.typeMismatch ? (language === 'en' ? 'Enter a valid email address.' : 'Saisissez une adresse e-mail valide.') : t('Veuillez remplir ce champ.'))} onInput={event => event.target.setCustomValidity?.('')}><label>{t("Votre nom")}<input name="nom" required autoComplete="name" placeholder={t("Votre nom")} /></label><label>{t("Votre e-mail")}<input name="email" type="email" required autoComplete="email" placeholder={language === "en" ? "you@example.com" : "vous@exemple.com"} /></label><label>{t("Votre message")}<textarea name="message" required rows="4" placeholder={t("Parlons de votre question ou de votre partenariat…")} /></label><button className="button outline" type="submit">{t("Ouvrir l’e-mail")} <ArrowUpRight /></button><p id="contact-status" role="status">{t(status)}</p></form></section>;
}
export {
  Contact as default
};



