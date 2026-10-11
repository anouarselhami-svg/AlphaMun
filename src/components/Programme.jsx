import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

import { programme } from '../data/programme';
import { ArrowDown } from './icons';

// The supplied UIR and Lalla-Laaroussa filenames are reversed; match their actual photographs.
const days = [
  {name:'ENSGK',venue:'ENSGK, Kénitra',image:'/ENCGK.png',width:1672,height:941,position:'center',en:'The beginning of an inspiring diplomatic journey.',fr:'Le début d’un parcours diplomatique inspirant.'},
  {name:'UIR',venue:'Université Internationale de Rabat (UIR)',image:'/Lalla-Laaroussa.png',width:1672,height:941,position:'center',en:'A day of diplomacy, debate, and collaboration.',fr:'Une journée de diplomatie, de débat et de collaboration.'},
  {name:'Lalla Laaroussa',venue:'Lalla Laaroussa',image:'/UIR.png',width:1086,height:1448,position:'center 68%',en:'Celebrating connections, achievements, and unforgettable moments.',fr:'Célébrer les rencontres, les réussites et les moments inoubliables.'},
];

function Schedule({ index, open, mobile = false }) {
  const day = programme[index];
  const prefix = mobile ? 'programme-mobile' : 'programme';
  return <div className="programme-day-panel" role="region" id={`${prefix}-panel-${index}`} aria-labelledby={`${prefix}-tab-${index}`} hidden={!open} lang="fr">
    <h3>{day.title} — {day.venue}</h3>
    <ol className="programme-slots" id={`programme-slots-${index}`}>{day.slots.map(([time,activity]) => <li key={time}><span className="programme-time">{time}</span><p>{activity}</p></li>)}</ol>
  </div>;
}

function DayCard({day,index,english,mobile}) {
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
    <div className="programme-card-copy"><p className="eyebrow">{english?'DAY':'JOUR'} {index+1}</p>
      <h3>{mobile ? <button className="programme-day-toggle" type="button" id={`programme-mobile-tab-${index}`} aria-controls={`programme-mobile-panel-${index}`} aria-expanded={open} onClick={() => setOpen(current => !current)}><span>{english?'Day':'Jour'} {index+1} — {day.name}</span><ArrowDown /></button> : <>{english?'DAY':'JOUR'} {index+1} — {day.name}</>}</h3>
      {mobile && <Schedule index={index} open={open} mobile />}
      <p className="programme-venue">{english?'Venue':'Lieu'} : {day.venue}</p><p className="programme-description">{english?day.en:day.fr}</p>
    </div>
  </article>;
}

export default function Programme() {
  const {language} = useLanguage();
  const english = language === 'en';
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const [activeDay, setActiveDay] = useState(null);
  const selectDay = index => setActiveDay(current => current === index ? null : index);
  const tabs = useRef([]);
  const keyboard = (event, index) => {
    const next = { ArrowRight: (index + 1) % 3, ArrowLeft: (index + 2) % 3, Home: 0, End: 2 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    tabs.current[next].focus();
  };
  return <section className="section programme" id="programme" aria-labelledby="programme-title">
    <p className="eyebrow">PROGRAMME</p><h2 id="programme-title">{english?'Three days of connection.':'Trois jours de rencontres.'}</h2>
    <p className="programme-intro">{english?'Three days, three unique venues, one unforgettable MUN experience.':'Trois jours, trois lieux uniques, une expérience MUN inoubliable.'}</p>
    <div className="programme-grid">{days.map((day,index)=><DayCard key={day.name} day={day} index={index} english={english} mobile={mobile}/>)}</div>
    {!mobile && <div className="programme-schedule">
      <div className="programme-tabs" role="group" aria-label={english ? 'Daily schedule' : 'Planning par journée'}>
        {programme.map((day,index) => <button key={day.venue} ref={node => {tabs.current[index] = node;}} type="button" id={`programme-tab-${index}`} aria-controls={`programme-panel-${index}`} aria-expanded={activeDay === index} onClick={() => selectDay(index)} onKeyDown={event => keyboard(event,index)}>{english ? 'Day' : 'Jour'} {index+1}<ArrowDown /></button>)}
      </div>
      {programme.map((day,index) => <Schedule key={day.venue} index={index} open={activeDay === index} />)}
    </div>}
  </section>;
}
