import { useEffect, useState } from 'react';
export function useCountdown(eventDate, language = 'fr') {
  const [now, setNow] = useState(Date.now());
  const target = eventDate ? Date.parse(eventDate) : NaN;
  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!Number.isFinite(target)) return { values: ['00', '00', '00', '00'], note: 'Alpha MUN commence aujourd’hui !' };
  const seconds = Math.max(0, Math.floor((target - now) / 1000));
  return {
    values: [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60].map(v => String(v).padStart(2, '0')),
    note: target <= now ? 'Alpha MUN commence aujourd’hui !' : new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long', timeZone: 'Africa/Casablanca' }).format(new Date(target)),
  };
}
