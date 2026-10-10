import { useLanguage } from '../i18n/LanguageContext';
function AssemblyDrawing() {
  return <svg className="assembly-drawing" viewBox="0 0 600 200" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth=".8">
      {[0, 1, 2, 3, 4].map(i => <ellipse key={i} cx="300" cy="144" rx={110 + i * 46} ry={24 + i * 15} />)}
      <path d="M28 140V52l45 8v76M527 136V60l45-8v88M73 80h454M105 83v43M145 85v36M185 87v29M225 89v23M265 90v19M335 90v19M375 89v23M415 87v29M455 85v36M495 83v43M210 145l90-20 90 20-90 20z" />
      {Array.from({length: 17}, (_, i) => {
        const angle = Math.PI * (i / 16);
        return <path key={i} d={`M${300 + Math.cos(angle) * 155} ${144 + Math.sin(angle) * 36}L${300 + Math.cos(angle) * 294} ${144 + Math.sin(angle) * 84}`} />;
      })}
    </g>
  </svg>;
}
export default function Hero() {
  const { t, language } = useLanguage();
  return <section className="hero" id="accueil">
    <div className="hero-copy">
      <p className="eyebrow"><span className="dot" />{t("LA JEUNESSE PREND LA PAROLE")}</p>
      <h1>{t("La parole")}<br />{t("devient")} <em>{t("action.")}</em></h1>
      <p className="intro">{t("Trois jours pour débattre, créer des liens et faire entendre votre voix. Entrez dans la peau d’un diplomate avec Alpha MUN.")}</p>
      <div className="hero-actions"><a className="button" href="/#packs">{t("Devenir délégué")} <ArrowUpRight /></a><a className="text-link" href="#histoire">{t("Découvrir l’expérience")} <ArrowDown /></a></div>
      <div className="hero-foot"><div className="hero-date"><span className="date-number">{t("22, 23 et 24 janvier")}</span><span><b>{t("KÉNITRA, MAROC")}</b></span></div><span className="edition">{t("7 ans")}<small>{t("d’impact & de leadership")}</small></span></div>
    </div>
    <div className="hero-art">
      <div className="art-top"><span>MODEL UNITED NATIONS</span><span>YGC / KÉNITRA</span></div>
      <div className="emblem-stage"><span className="ornament ornament-one" aria-hidden="true">✦</span><img className="hero-logo" src="/assets/alpha-logo.svg" alt={t("Logo Alpha MUN")} /><span className="ornament ornament-two" aria-hidden="true">✦</span><div className="emblem-wordmark">ALPHA MUN<small>YOUTHGLOBALCLUB</small></div></div>
      <AssemblyDrawing />
      <div className="art-caption"><span>{t("VOTRE VOIX.")}<br />{t("NOTRE MONDE.")}</span><a className="button art-signup" href="/#packs">{t("S’inscrire")} <ArrowUpRight /></a></div>
      <div className="art-label">DIALOGUE <span>✦</span>{t("DIPLOMATIE")} <span>✦</span> LEADERSHIP</div>
    </div>
  </section>;
}
import { ArrowDown, ArrowUpRight } from './icons';
