import { config } from "../config";
function Committees() {
  return <section id="comites" className="section committees">
      <div className="section-heading">
        <div><p className="eyebrow">02 / COMITÉS & ACADEMICS</p><h2>Chaque débat ouvre<br />une nouvelle perspective.</h2></div>
        <p>Géopolitique, économie, enjeux humanitaires : explorez la diplomatie à travers des débats et la rédaction de résolutions.</p>
      </div>
      {config.committees.length ? config.committees.map((committee) => <article className="committee-panel" key={committee.name}>
          <span className="committee-symbol" aria-hidden="true">◎</span>
          <div><p className="eyebrow">{committee.level || "Niveau \xE0 confirmer"}</p><h3>{committee.name}</h3><p>{committee.description || "Sujet \xE0 confirmer."}</p></div>
          <a href="/inscription" className="text-link">Préparer mon inscription <ArrowUpRight /></a>
        </article>) : <div className="committee-panel">
          <span className="committee-symbol" aria-hidden="true">◎</span>
          <div><p className="eyebrow">L’ÉDITION SE PRÉPARE</p><h3>Les comités seront annoncés prochainement.</h3><p>Les noms, les sujets et les niveaux de difficulté seront publiés après confirmation par le board.</p></div>
          <a href="/inscription" className="text-link">Préparer mon inscription <ArrowUpRight /></a>
        </div>}
    </section>;
}
export {
  Committees as default
};
import { ArrowUpRight } from './icons';
