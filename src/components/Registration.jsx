import { useRef, useState } from "react";
import { config } from "../config";
import { RegistrationError, submitRegistration } from "../services/registration";
function Registration({ pack, onChoosePack }) {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  async function handleSubmit(event) {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    if (!config.appsScriptUrl) {
      setStatus("Les inscriptions ne sont pas encore ouvertes. Aucune donn\xE9e n\u2019a \xE9t\xE9 envoy\xE9e.");
      return;
    }
    sending.current = true;
    setPending(true);
    setStatus("Envoi en cours\u2026");
    try {
      await submitRegistration(Object.fromEntries(new FormData(form)));
      setStatus("Votre inscription a bien \xE9t\xE9 re\xE7ue. Le club vous contactera pour la suite.");
      form.reset();
      onChoosePack("");
    } catch (error) {
      const reason = error instanceof RegistrationError ? error.message : "L’inscription n’a pas pu être confirmée.";
      setStatus(`${reason} Vos données saisies sont conservées. Vérifiez auprès du club avant de réessayer pour éviter un doublon.`);
      // Technical metadata only: no form values or redirect tokens.
      console.error('Alpha MUN — inscription', error instanceof RegistrationError
        ? { code: error.code, ...error.diagnostics } : { code: 'UNEXPECTED_ERROR' });
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
  return <section id="inscription" className="section registration"><div><p className="eyebrow">04 / PRENEZ VOTRE PLACE</p><h2>Le prochain<br />délégué,<br /><em>c’est vous.</em></h2><p>Faites le premier pas vers trois jours de rencontres et de diplomatie.</p><p className="notice" id="registration-note">{config.appsScriptUrl ? "Vos informations seront transmises au YouthGlobalClub pour le suivi de votre inscription." : "Pr\xE9paration des inscriptions en cours. Le formulaire sera ouvert d\xE8s que la connexion au club sera configur\xE9e."}</p></div><form id="registration-form" onSubmit={handleSubmit}><div className="form-row"><label>Prénom<input name="prenom" required autoComplete="given-name" placeholder="Votre prénom" /></label><label>Nom<input name="nom" required autoComplete="family-name" placeholder="Votre nom" /></label></div><label>E-mail<input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" /></label><label>Établissement<input name="etablissement" required placeholder="École, lycée ou université" /></label><div className="form-row"><label>Expérience MUN<select name="experience" required><option value="">Sélectionner</option><option>Première participation</option><option>1 à 2 participations</option><option>3 participations ou plus</option></select></label><label>Comité souhaité<select name="comite" id="committee-select" required={config.committees.length > 0}><option value="">{config.committees.length ? "S\xE9lectionner un comit\xE9" : "En attente de l\u2019annonce"}</option>{config.committees.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label></div><label>Votre pack<select name="pack" id="pack-select" required value={pack} onChange={(e) => onChoosePack(e.target.value)}><option value="">Choisir votre expérience</option><option value="550">Pack délégué — 550 DH</option><option value="1550">Pack avec hôtel — 1 550 DH</option></select></label><label className="checkbox"><input type="checkbox" required /><span>J’accepte que le YouthGlobalClub utilise ces informations pour traiter mon inscription et me contacter à propos de l’événement.</span></label><button className="button" type="submit" disabled={pending}>Envoyer mon inscription <span>↗</span></button><p id="form-status" role="status">{status}</p></form></section>;
}
export {
  Registration as default
};
