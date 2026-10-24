const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const Flecha = () => <svg viewBox="0 0 16 16" strokeWidth="1.8" {...base}><path d="M3 8h10M9 4l4 4-4 4" /></svg>;
export const FlechaDiag = () => <svg viewBox="0 0 14 14" strokeWidth="1.8" {...base}><path d="M4 10l6-6M5 4h5v5" /></svg>;
export const Descarga = () => <svg viewBox="0 0 24 24" strokeWidth="2" {...base}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>;
export const Lupa = () => <svg viewBox="0 0 24 24" strokeWidth="2" {...base}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;

export const ICONOS = {
  cdps: <svg viewBox="0 0 24 24" strokeWidth="1.7" {...base}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></svg>,
  cadena: <svg viewBox="0 0 24 24" strokeWidth="1.7" {...base}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="8" r="2.5" /><circle cx="10" cy="18" r="2.5" /><path d="M8.3 6.9l7.3.7M7 8.3l2.2 7.3M16.5 10l-5 6.2" /></svg>,
  match: <svg viewBox="0 0 24 24" strokeWidth="1.7" {...base}><rect x="3" y="4" width="8" height="16" rx="2" /><rect x="13" y="4" width="8" height="16" rx="2" /><path d="M6 9h2M16 9h2M6 13h2M16 13h2" /></svg>,
  lluvia: <svg viewBox="0 0 24 24" strokeWidth="1.7" {...base}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>,
  ruta: <svg viewBox="0 0 24 24" strokeWidth="1.7" {...base}><circle cx="5" cy="18" r="2" /><circle cx="19" cy="6" r="2" /><path d="M7 18h6a4 4 0 0 0 0-8h-2a4 4 0 0 1 0-8" /></svg>,
};
