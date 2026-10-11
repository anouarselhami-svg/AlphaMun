import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

import { programme } from '../data/programme';

// The supplied UIR and Lalla-Laaroussa filenames are reversed; match their actual photographs.
const days = [
  {name:'ENSGK',venue:'ENSGK, Kénitra',image:'/ENCGK.png',width:1672,height:941,position:'center',en:'The beginning of an inspiring diplomatic journey.',fr:'Le début d’un parcours diplomatique inspirant.'},
  {name:'UIR',venue:'Université Internationale de Rabat (UIR)',image:'/Lalla-Laaroussa.png',width:1672,height:941,position:'center',en:'A day of diplomacy, debate, and collaboration.',fr:'Une journée de diplomatie, de débat et de collaboration.'},
  {name:'Lalla Laaroussa',venue:'Lalla Laaroussa',image:'/UIR.png',width:1086,height:1448,position:'center 68%',en:'Celebrating connections, achievements, and unforgettable moments.',fr:'Célébrer les rencontres, les réussites et les moments inoubliables.'},
];

function DayCard({day,index,english}) {
  const ref = useRef(null);
  const [visible,setVisible] = useState(false);
  const [animate,setAnimate] = useState(false);
  const [failed,setFailed] = useState(false);
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
    <div className="programme-card-copy"><p className="eyebrow">{english?'DAY':'JOUR'} {index+1}</p><h3>{english?'DAY':'JOUR'} {index+1} — {day.name}</h3><p className="programme-venue">{english?'Venue':'Lieu'} : {day.venue}</p><p className="programme-description">{english?day.en:day.fr}</p></div>
  </article>;
}

export default function Programme() {
  const {language} = useLanguage();
  const english = language === 'en';
  const [activeDay, setActiveDay] = useState(0);
  const tabs = useRef([]);
  const keyboard = (event, index) => {
    const next = { ArrowRight: (index + 1) % 3, ArrowLeft: (index + 2) % 3, Home: 0, End: 2 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActiveDay(next);
    tabs.current[next].focus();
  };
  return <section className="section programme" id="programme" aria-labelledby="programme-title">
    <p className="eyebrow">PROGRAMME</p><h2 id="programme-title">{english?'Three days of connection.':'Trois jours de rencontres.'}</h2>
    <p className="programme-intro">{english?'Three days, three unique venues, one unforgettable MUN experience.':'Trois jours, trois lieux uniques, une expérience MUN inoubliable.'}</p>
    <div className="programme-grid">{days.map((day,index)=><DayCard key={day.name} day={day} index={index} english={english}/>)}</div>
    <div className="programme-schedule">
      <div className="programme-tabs" role="tablist" aria-label={english ? 'Daily schedule' : 'Planning par journée'}>
        {programme.map((day,index) => <button key={day.venue} ref={node => {tabs.current[index] = node;}} type="button" role="tab" id={`programme-tab-${index}`} aria-controls={`programme-panel-${index}`} aria-selected={activeDay === index} tabIndex={activeDay === index ? 0 : -1} onClick={() => setActiveDay(index)} onKeyDown={event => keyboard(event,index)}>{english ? 'Day' : 'Jour'} {index+1}</button>)}
      </div>
      {programme.map((day,index) => <div key={day.venue} role="tabpanel" id={`programme-panel-${index}`} aria-labelledby={`programme-tab-${index}`} hidden={activeDay !== index} tabIndex={0} lang="fr">
        <h3>{day.title} — {day.venue}</h3>
        <ol className="programme-slots">{day.slots.map(([time,activity]) => <li key={time}><span className="programme-time">{time}</span><p>{activity}</p></li>)}</ol>
      </div>)}
    </div>
  </section>;
}
