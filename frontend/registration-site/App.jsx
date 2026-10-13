import { useState } from 'react';
import Registration from '../src/components/Registration';
import { config } from '../src/config';
import { registrationLocation } from '../src/services/registration-route';
export default function RegistrationApp() {
  const [pack, setPack] = useState(() => registrationLocation(window.location).pack);
  function choosePack(value) {
    setPack(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('pack', value); else url.searchParams.delete('pack');
    window.history.replaceState(null, '', url);
  }
  return <><header className="registration-header"><a className="brand" href={config.mainSiteUrl}><img className="brand-mark" src="/assets/alpha-emblem.svg" alt="" /><span>ALPHA <b>MUN</b><small>YOUTHGLOBALCLUB</small></span></a><a href={config.mainSiteUrl} className="text-link">youthglobalclub.com ↗</a></header><main><Registration pack={pack} onChoosePack={choosePack} /></main><footer className="registration-footer"><a href={config.mainSiteUrl}>Alpha MUN · YouthGlobalClub</a></footer></>;
}
