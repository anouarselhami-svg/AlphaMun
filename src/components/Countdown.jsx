import { useLanguage } from '../i18n/LanguageContext';
import { useCountdown } from "../hooks/useCountdown";
import { config } from "../config";
function Countdown() {
  const { t, language } = useLanguage();
  const { values, note } = useCountdown(config.eventDate, language);
  return <section className="countdown"><div><p className="eyebrow">{t("LE RENDEZ-VOUS EST PRIS")}</p><h2>{t("Le prochain chapitre")}<br />{t("commence le 22 janvier 2027")}</h2><p id="date-note">{t(note)}</p></div><div className="timer" aria-label={t("Compte à rebours")}><div><b id="days">{values[0]}</b><span>{t("JOURS")}</span></div><div><b id="hours">{values[1]}</b><span>{t("HEURES")}</span></div><div><b id="minutes">{values[2]}</b><span>{t("MINUTES")}</span></div><div><b id="seconds">{values[3]}</b><span>{t("SECONDES")}</span></div></div></section>;
}
export {
  Countdown as default
};
