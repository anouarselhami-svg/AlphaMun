import {useLanguage} from '../i18n/LanguageContext';
import {config} from '../config';
import {packages, packageFeatures, packageLabel} from '../../../shared/edition.js';
import {ArrowUpRight} from './icons';
export default function Packs(){
 const {language}=useLanguage();const en=language==='en';
 const url=value=>{const link=new URL(config.registrationSiteUrl);link.searchParams.set('pack',value);return link.href;};
 return <section id="packs" className="section packs"><p className="eyebrow">{en?'03 / YOUR EXPERIENCE':'03 / VOTRE EXPÉRIENCE'}</p><div className="section-heading"><h2>{en?'Two packages.':'Deux packs.'}<br/>{en?'One ambition.':'La même ambition.'}</h2><p>{en?'Choose your package. Payment is not made on this website.':'Choisissez votre formule. Le paiement n’est pas effectué sur ce site.'}</p></div><div className="pack-grid">{Object.entries(packages).map(([value,pack])=><article key={value} className={'pack'+(value==='1500'?' premium':'')}><div className="pack-title"><span>{pack[language]}</span><span>{en?'3 DAYS':'3 JOURS'}</span></div><h3>{pack[language]}</h3><p className="price">{pack.amount.toLocaleString(en?'en-GB':'fr-FR')} <span>DH</span></p><p>{packageLabel(value,language)}</p><ul>{packageFeatures.map(item=><li key={item.fr}>{item[language]}</li>)}{value==='1500'&&<li><b>{en?'Hotel accommodation':'Hébergement à l’hôtel'}</b></li>}</ul><a href={url(value)} target="_blank" rel="noopener noreferrer" className={'button'+(value==='500'?' outline':'')}>{en?'Choose this package':'Choisir ce pack'} <ArrowUpRight/></a></article>)}</div></section>;
}
