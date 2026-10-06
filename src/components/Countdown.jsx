import { useCountdown } from "../hooks/useCountdown";
import { config } from "../config";
function Countdown() {
  const { values, note } = useCountdown(config.eventDate);
  return <section className="countdown"><div><p className="eyebrow">LE RENDEZ-VOUS EST PRIS</p><h2>Le prochain chapitre<br />commence le 22 janvier 2027</h2><p id="date-note">{note}</p></div><div className="timer" aria-label="Compte à rebours"><div><b id="days">{values[0]}</b><span>JOURS</span></div><div><b id="hours">{values[1]}</b><span>HEURES</span></div><div><b id="minutes">{values[2]}</b><span>MINUTES</span></div><div><b id="seconds">{values[3]}</b><span>SECONDES</span></div></div></section>;
}
export {
  Countdown as default
};
