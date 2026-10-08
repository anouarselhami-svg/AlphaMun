import { useRef, useState } from "react";
import { config } from "../config";
import { RegistrationError, submitRegistration } from "../services/registration";
import { ArrowUpRight } from "./icons";

const packLabels = {
  "550": "Pack délégué — 550 DH",
  "1550": "Pack avec hôtel — 1 550 DH",
};

function FieldError({ name, message }) {
  return message ? <span className="field-error" id={`${name}-error`} role="alert">{message}</span> : null;
}

function Registration({ pack, onChoosePack }) {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmation, setConfirmation] = useState(null);
  const [committeeChoices, setCommitteeChoices] = useState(["", "", ""]);
  const sending = useRef(false);
  const committeeCount = config.committees.length;

  function markInvalid(event) {
    const field = event.target;
    const message = field.validity.valueMissing
      ? "Ce champ est obligatoire."
      : field.validity.typeMismatch
        ? "Saisissez une adresse e-mail valide."
        : "Vérifiez cette valeur.";
    setFieldErrors(previous => ({ ...previous, [field.name]: message }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.ville = data.ville.trim();
    data.comite = data.comite_choix_1 || "";
    sending.current = true;
    setPending(true);
    setStatus("Envoi en cours\u2026");
    setFieldErrors({});
    try {
      await submitRegistration(data);
      setConfirmation(data);
      setStatus("");
      form.reset();
      setCommitteeChoices(["", "", ""]);
      onChoosePack("");
    } catch (error) {
      const reason = error instanceof RegistrationError
        ? error.message
        : "L’inscription n’a pas pu être confirmée.";
      setStatus(`${reason} Vos données saisies sont conservées. Vous pouvez réessayer.`);
      console.error("Alpha MUN — inscription", error instanceof RegistrationError
        ? { code: error.code, ...error.diagnostics }
        : { code: "UNEXPECTED_ERROR" });
    } finally {
      sending.current = false;
      setPending(false);
    }

  }

  function chooseCommittee(index, value) {
    setCommitteeChoices(previous => previous.map((choice, choiceIndex) => (
      choiceIndex !== index && choice === value ? "" : choiceIndex === index ? value : choice
    )));
    setFieldErrors(previous => ({ ...previous, [`comite_choix_${index + 1}`]: "" }));
  }

  function committeeOptions(selected) {
    return config.committees.map(committee => (
      <option
        key={committee.name}
        value={committee.name}
        disabled={committeeChoices.includes(committee.name) && selected !== committee.name}
      >
        {committee.name}
      </option>
    ));
  }

  if (confirmation) {
    return <section id="inscription" className="section registration registration-confirmation" aria-labelledby="registration-confirmed-title">
      <div>
        <p className="eyebrow">INSCRIPTION ENREGISTRÉE</p>
        <h2 id="registration-confirmed-title">Ton inscription a bien été enregistrée.</h2>
        <p>Le club vous contactera pour la suite. Cette confirmation ne constitue pas un paiement ni une validation définitive.</p>
      </div>
      <div className="confirmation-card">
        <p className="eyebrow">RÉCAPITULATIF</p>
        <dl>
          <div><dt>Prénom</dt><dd>{confirmation.prenom}</dd></div>
          <div><dt>Nom</dt><dd>{confirmation.nom}</dd></div>
          <div><dt>E-mail</dt><dd>{confirmation.email}</dd></div>
          <div><dt>Ville</dt><dd>{confirmation.ville}</dd></div>
          {["comite_choix_1", "comite_choix_2", "comite_choix_3"].map((field, index) => confirmation[field] ? <div key={field}><dt>{["Premier", "Deuxième", "Troisième"][index]} choix de comité</dt><dd>{confirmation[field]}</dd></div> : null)}
          <div><dt>Pack</dt><dd>{packLabels[confirmation.pack] || confirmation.pack}</dd></div>
        </dl>
        <p>Les choix expriment vos préférences et ne garantissent pas l’attribution d’un comité.</p>
        <a className="button outline" href="#accueil">Retour à l’accueil <ArrowUpRight /></a>
      </div>
    </section>;
  }

  return <section id="inscription" className="section registration">
    <div>
      <p className="eyebrow">04 / PRENEZ VOTRE PLACE</p>
      <h2>Le prochain<br />délégué,<br /><em>c’est vous.</em></h2>
      <p>Faites le premier pas vers trois jours de rencontres et de diplomatie.</p>
      <p className="notice" id="registration-note">Vos informations seront transmises au YouthGlobalClub pour le suivi de votre inscription.</p>
    </div>
    <form id="registration-form" onSubmit={handleSubmit} onInvalid={markInvalid}>
      <div className="form-row">
        <label>Prénom<input name="prenom" required autoComplete="given-name" placeholder="Votre prénom" aria-invalid={Boolean(fieldErrors.prenom)} aria-describedby={fieldErrors.prenom ? "prenom-error" : undefined} /><FieldError name="prenom" message={fieldErrors.prenom} /></label>
        <label>Nom<input name="nom" required autoComplete="family-name" placeholder="Votre nom" aria-invalid={Boolean(fieldErrors.nom)} aria-describedby={fieldErrors.nom ? "nom-error" : undefined} /><FieldError name="nom" message={fieldErrors.nom} /></label>
      </div>
      <label>E-mail<input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} /><FieldError name="email" message={fieldErrors.email} /></label>
      <div className="form-row school-row">
        <label>Ville de résidence<input name="ville" required placeholder="Ex. : Kénitra" aria-invalid={Boolean(fieldErrors.ville)} aria-describedby={fieldErrors.ville ? "ville-error" : undefined} /><FieldError name="ville" message={fieldErrors.ville} /></label>
        <label>Établissement<input name="etablissement" required placeholder="École, lycée ou université" aria-invalid={Boolean(fieldErrors.etablissement)} aria-describedby={fieldErrors.etablissement ? "etablissement-error" : undefined} /><FieldError name="etablissement" message={fieldErrors.etablissement} /></label>
      </div>
      <label>Expérience MUN<select name="experience" required aria-invalid={Boolean(fieldErrors.experience)} aria-describedby={fieldErrors.experience ? "experience-error" : undefined}><option value="">Sélectionner</option><option>Première participation</option><option>1 à 3 participations</option><option>5 participations ou plus</option></select><FieldError name="experience" message={fieldErrors.experience} /></label>
      <div className="form-row committee-choices">
        {[0, 1, 2].map(index => {
          const fieldName = `comite_choix_${index + 1}`;
          const required = committeeCount > index;
          return <label key={fieldName}>{["Premier", "Deuxième", "Troisième"][index]} choix de comité<select name={fieldName} value={committeeChoices[index]} required={required} disabled={!committeeCount} onChange={event => chooseCommittee(index, event.target.value)} aria-invalid={Boolean(fieldErrors[fieldName])} aria-describedby={fieldErrors[fieldName] ? `${fieldName}-error` : undefined}><option value="">{committeeCount ? "Sélectionner un comité" : "En attente de l’annonce"}</option>{committeeOptions(committeeChoices[index])}</select><FieldError name={fieldName} message={fieldErrors[fieldName]} /></label>;
        })}
      </div>
      <label>Votre pack<select name="pack" id="pack-select" required value={pack} onChange={(event) => onChoosePack(event.target.value)} aria-invalid={Boolean(fieldErrors.pack)} aria-describedby={fieldErrors.pack ? "pack-error" : undefined}><option value="">Choisir votre expérience</option><option value="550">Pack délégué — 550 DH</option><option value="1550">Pack avec hôtel — 1 550 DH</option></select><FieldError name="pack" message={fieldErrors.pack} /></label>
      <label>Why do you want to participate in Alpha MUN, and what do you hope to gain from this experience? | Pourquoi souhaitez-vous participer au Alpha MUN et qu’espérez-vous tirer de cette expérience ?<textarea name="motivation" placeholder="Votre réponse (facultatif)" rows="5" /></label>
      <label className="checkbox"><input type="checkbox" name="confirmation_pack" required onInvalid={markInvalid} aria-invalid={Boolean(fieldErrors.confirmation_pack)} aria-describedby={fieldErrors.confirmation_pack ? "confirmation_pack-error" : undefined} /><span>Je reconnais avoir choisi ce pack et j’en assume les conditions.</span><FieldError name="confirmation_pack" message={fieldErrors.confirmation_pack} /></label>
      <label className="checkbox"><input type="checkbox" name="consentement" required onInvalid={markInvalid} aria-invalid={Boolean(fieldErrors.consentement)} aria-describedby={fieldErrors.consentement ? "consentement-error" : undefined} /><span>J’accepte que le YouthGlobalClub utilise ces informations pour traiter mon inscription et me contacter à propos de l’événement.</span><FieldError name="consentement" message={fieldErrors.consentement} /></label>
      <button className="button" type="submit" disabled={pending}>{pending ? "Envoi en cours\u2026" : "Envoyer mon inscription"} <ArrowUpRight /></button>
      <p id="form-status" role="status" aria-live="polite">{status}</p>
    </form>
  </section>;
}

export default Registration;
