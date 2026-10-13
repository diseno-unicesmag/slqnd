'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const GRUPOS = [
  { label: 'Productos', items: [['/cadena-valor/', 'Cadena de valor'], ['/match-creativo/', 'Match creativo'], ['/lluvia-ideas/', 'Lluvia de ideas']] },
  { label: 'Instrumentos', items: [['/cdps/', 'CDPS']] },
];
const Chevron = () => (
  <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M1 1l4 4 4-4" /></svg>
);

export default function Nav() {
  const ruta = usePathname();
  const esta = href => ruta === href || ruta === href.slice(0, -1);
  return (
    <nav className="lg-nav">
      <span className="lg-r lg-layer" data-lg-depth="6" data-lg-strength="50" data-lg-blur="6" aria-hidden="true" />
      <Link className="nav-brand" href="/"><span className="brand-main">SOBRE LO QUE</span><span className="brand-accent">NO DIGO</span></Link>
      <div className="nav-links">
        <Link className={'nav-link' + (esta('/ruta-metodologica/') ? ' active' : '')} href="/ruta-metodologica/">Ruta</Link>
        {GRUPOS.map(g => (
          <div className="nav-item" key={g.label}>
            <button type="button" className={'nav-link' + (g.items.some(([h]) => esta(h)) ? ' active' : '')} aria-haspopup="true">{g.label} <Chevron /></button>
            <div className="nav-dropdown">
              {g.items.map(([href, texto]) => (
                <Link key={href} href={href} className={esta(href) ? 'current' : undefined} aria-current={esta(href) ? 'page' : undefined}>{texto}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
