'use client';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import InstallButton from './InstallButton';
import { SITE } from '@/lib/config';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(scrollY > 40);
    f();
    addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, []);
  const links = [
    ['Guides', '/app/#guides'],
    ['Wikipedia', '/app/#wiki'],
    ['Local AI', '/app/#ai'],
    ['Maps', '/app/#maps'],
    ['Gear', '/gear/'],
    [SITE.ticker, '/#token'],
  ];
  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <a href="/" className="nav-brand" aria-label="AFTERNET home">
        <Logo size={30} glow={false} />
        <span>AFTERNET</span>
      </a>
      <nav className="nav-links" aria-label="Main">
        {links.map(([l, h]) => (
          <a key={h} href={h} onClick={() => setOpen(false)}>
            {l}
          </a>
        ))}
        <a href={SITE.github} target="_blank" rel="noreferrer" className="nav-gh" onClick={() => setOpen(false)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"/></svg>
          <span>Source</span>
        </a>
      </nav>
      <div className="nav-cta">
        <InstallButton compact />
      </div>
      <button className="nav-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <i />
        <i />
      </button>
    </header>
  );
}
