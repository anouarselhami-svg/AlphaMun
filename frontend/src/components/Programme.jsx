import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

import { programme } from '../data/programme';
import { ArrowDown } from './icons';

// Photos from the published version (5687411), retained in frontend/public.
// Historical UIR and Lalla-Laaroussa filenames are reversed; match their actual photographs.
const days = [
  {name:'UIT',venue:'Université Ibn Tofail — UIT, Kénitra',image:'/ENCGK.png',width:1672,height:941,position:'center',en:'The beginning of an inspiring diplomatic journey.',fr:'Le début d’un parcours diplomatique inspirant.'},
  {name:'UIR',venue:'Université Internationale de Rabat — UIR',image:'/Lalla-Laaroussa.png',width:1672,height:941,position:'center',en:'A day of diplomacy, debate, and collaboration.',fr:'Une journée de diplomatie, de débat et de collaboration.'},
  {name:'Palais Lalla Laaroussa',venue:'Palais Lalla Laaroussa, Kénitra',image:'/UIR.png',width:1086,height:1448,position:'center 68%',en:'Celebrating connections, achievements, and unforgettable moments.',fr:'Célébrer les rencontres, les réussites et les moments inoubliables.'},
];

function Schedule({ index, open }) {
  const day = programme[index];
  return <div className="programme-day-panel" role="region" id={`programme-panel-${index}`} aria-labelledby={`programme-tab-${index}`} hidden={!open} lang="fr">
    <h3>{day.title} — {day.venue}</h3>
    <ol className="programme-slots" id={`programme-slots-${index}`}>{day.slots.map(([time,activity]) => <li key={time}><span className="programme-time">{time}</span><p>{activity}</p></li>)}</ol>
  </div>;
}

function DayCard({day,index,english}) {
  const ref = useRef(null);
  const [visible,setVisible] = useState(false);
  const [animate,setAnimate] = useState(false);
  const [failed,setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if(motion.matches || !('IntersectionObserver' in window)) {setVisible(true);return;}
    setAnimate(true);
    const observer = new IntersectionObserver(entries => {
      if(entries.some(entry=>entry.isIntersecting)) {setVisible(true);observer.disconnect();}
    },{threshold:0.12});
    observer.observe(ref.current);
    const reduce = () => {if(motion.matches) {setVisible(true);setAnimate(false);observer.disconnect();}};
    motion.addEventListener('change',reduce);
    return () => {observer.disconnect();motion.removeEventListener('change',reduce);};
  },[]);
  return <article ref={ref} className={`programme-card${animate?' programme-card-animated':''}${visible?' is-visible':''}`} style={{'--card-delay':`${index*90}ms`}}>
    <div className="programme-photo">
      {failed?<div className="programme-placeholder" role="img" aria-label={english?`Photograph of ${day.venue} coming soon`:`Photographie de ${day.venue} à venir`}><span aria-hidden="true">◎</span><p>{day.name}</p><small>{english?'Photograph coming soon':'Photographie à venir'}</small></div>:<img src={day.image} alt={english?`View of ${day.venue}`:`Vue de ${day.venue}`} width={day.width} height={day.height} loading="lazy" decoding="async" style={{objectPosition:day.position}} onError={()=>setFailed(true)}/>}
    </div>
    <div className="programme-card-copy"><div className="programme-presentation"><div className="programme-presentation-content"><p className="eyebrow">{english?'DAY':'JOUR'} {index+1}</p>
      <h3><button className="programme-day-toggle" type="button" id={`programme-tab-${index}`} aria-controls={`programme-panel-${index}`} aria-expanded={open} onClick={() => setOpen(current => !current)}><span>{english?'Day':'Jour'} {index+1} — {day.name.slice(0,day.name.lastIndexOf(' ')+1)}<span className="programme-title-ending"><span className="programme-title-last-word">{day.name.split(' ').at(-1)}</span><ArrowDown /></span></span></button></h3>
      <p className="programme-venue">{english?'Venue':'Lieu'} : {day.venue}</p><p className="programme-description">{english?day.en:day.fr}</p>
      </div>
      </div>
      <Schedule index={index} open={open} />
    </div>
  </article>;
}

export default function Programme() {
  const {language} = useLanguage();
  const english = language === 'en';
  const gridRef = useRef(null);
  const [presentationHeight, setPresentationHeight] = useState(0);
  useEffect(() => {
    const grid = gridRef.current;
    const contents = [...grid.querySelectorAll('.programme-presentation-content')];
    const measure = () => setPresentationHeight(Math.ceil(Math.max(...contents.map(content => content.getBoundingClientRect().height))));
    const observer = new ResizeObserver(measure);
    contents.forEach(element => observer.observe(element));
    measure();
    return () => observer.disconnect();
  }, [language]);
  return <section className="section programme" id="programme" aria-labelledby="programme-title">
    <p className="eyebrow">PROGRAMME</p><h2 id="programme-title">{english?'Three days of connection.':'Trois jours de rencontres.'}</h2>
    <p className="programme-intro">{english?'Three days, three unique venues, one unforgettable MUN experience.':'Trois jours, trois lieux uniques, une expérience MUN inoubliable.'}</p>
    <div className="programme-grid" ref={gridRef} style={{'--programme-presentation-height': `${presentationHeight}px`}}>{days.map((day,index)=><DayCard key={day.name} day={day} index={index} english={english}/>)}</div>
  </section>;
}
