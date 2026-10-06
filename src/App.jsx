import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Countdown from './components/Countdown';
import Story from './components/Story';
import Committees from './components/Committees';
import Packs from './components/Packs';
import Registration from './components/Registration';
import Sponsors from './components/Sponsors';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
export default function App() {
  const [pack, setPack] = useState('');
  return <><Header /><main><Hero /><Countdown /><Story /><Committees /><Packs onChoosePack={setPack} /><Registration pack={pack} onChoosePack={setPack} /><Sponsors /><FAQ /><Contact /></main><Footer /></>;
}
