import { useEffect, useState } from 'react';
const links = [['histoire', 'L’esprit Alpha'], ['comites', 'Comités'], ['packs', 'Les packs'], ['faq', 'FAQ']];
export default function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting);
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: '-20% 0px -55% 0px' });
    document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
    const close = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => { observer.disconnect(); window.removeEventListener('keydown', close); };
  }, []);
  return <header>
    <a href="#accueil" className="brand" aria-label="Alpha MUN — Accueil"><img className="brand-mark" src="/assets/alpha-emblem.svg" alt="" /><span>ALPHA <b>MUN</b><small>YOUTHGLOBALCLUB</small></span></a>
    <nav id="navigation" className={open ? 'open' : ''} aria-label="Navigation principale">
      {links.map(([id, label]) => <a key={id} href={`#${id}`} className={active === id ? 'active' : ''} aria-current={active === id ? 'location' : undefined} onClick={() => setOpen(false)}>{label}</a>)}
    </nav>
    <a className="button small" href="#inscription" onClick={() => setOpen(false)}>S’inscrire <span aria-hidden="true">↗</span></a>
    <button className={`menu ${open ? 'is-open' : ''}`} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} aria-controls="navigation" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /></button>
  </header>;
}
