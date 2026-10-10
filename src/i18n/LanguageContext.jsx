import { createContext, useContext, useEffect, useState } from 'react';
import { english } from './translations';
const LanguageContext = createContext({ language:'fr', t:value=>value, setLanguage:()=>{} });
export function LanguageProvider({ children }) {
  const [language,setLanguage] = useState(() => {try{return localStorage.getItem('amun-language') === 'en' ? 'en' : 'fr';}catch{return 'fr';}});
  const t = value => language === 'en' ? english[value] || value : value;
  useEffect(() => {
    try {localStorage.setItem('amun-language',language);}catch { /* Keep switching available when storage is blocked. */ }
    document.documentElement.lang = language;
    document.title = language === 'en' ? 'Alpha MUN — Words become action' : 'Alpha MUN — La parole devient action';
    const description = language === 'en' ? 'Alpha MUN, the Model United Nations event organised by YouthGlobalClub.' : 'Alpha MUN, la simulation des Nations Unies portée par le YouthGlobalClub.';
    for (const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]']) document.querySelector(selector)?.setAttribute('content',description);
    for (const selector of ['meta[property="og:title"]','meta[name="twitter:title"]']) document.querySelector(selector)?.setAttribute('content',document.title);
  },[language]);
  return <LanguageContext.Provider value={{language,setLanguage,t}}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
export function LanguageSwitch() {
  const {language,setLanguage} = useLanguage();
  return <div className="site-language" aria-label={language==='en'?'Website language':'Langue du site'}>{['fr','en'].map(value=><button key={value} type="button" aria-pressed={language===value} onClick={()=>setLanguage(value)}>{value.toUpperCase()}</button>)}</div>;
}
