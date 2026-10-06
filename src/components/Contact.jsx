import { useState } from "react";
import { config } from "../config";
function Contact() {
  const [status, setStatus] = useState("");
  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    for (const name of ['nom', 'email', 'message']) {
      const field = form.elements[name];
      field.setCustomValidity(field.value.trim() ? '' : 'Veuillez remplir ce champ.');
    }
    if (!form.reportValidity()) return;
    if (!config.contactEmail) {
      setStatus("Le contact n’est pas configuré. Aucun e-mail n’a été envoyé.");
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    const body = `Nom : ${data.nom.trim()}\nE-mail : ${data.email.trim()}\n\nMessage :\n${data.message.trim()}`;
    setStatus("Votre application de messagerie va s’ouvrir. Envoyez l’e-mail pour terminer.");
    window.location.href = `mailto:${config.contactEmail}?subject=${encodeURIComponent('Contact — Alpha MUN')}&body=${encodeURIComponent(body)}`;
  }
  return <section id="contact" className="section contact"><div><p className="eyebrow">RESTONS EN CONTACT</p><h2>Une question ?<br />Ouvrons le dialogue.</h2><p>YouthGlobalClub · Groupe Pédagogique Alpha<br />Kénitra, Maroc</p><p className="muted">Adresse officielle :<br /><a className="text-link" href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a></p><p className="muted">Votre application de messagerie va s’ouvrir. Envoyez l’e-mail pour terminer.</p></div><form id="contact-form" onSubmit={handleSubmit} onInput={event => event.target.setCustomValidity?.('')}><label>Votre nom<input name="nom" required autoComplete="name" placeholder="Votre nom" /></label><label>Votre e-mail<input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" /></label><label>Votre message<textarea name="message" required rows="4" placeholder="Parlons de votre question ou de votre partenariat…" /></label><button className="button outline" type="submit">Ouvrir l’e-mail ↗</button><p id="contact-status" role="status">{status}</p></form></section>;
}
export {
  Contact as default
};
