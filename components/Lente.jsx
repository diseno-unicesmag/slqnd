'use client';

import { useEffect, useRef } from 'react';

// Lo que se dice y, debajo, lo que se calla. Lo callado son opciones que los participantes marcaron en la CDPS (P14 y P17).
const FRASES = [
  ['Estoy bien.', 'Pierdo las ganas de todo.'],
  ['Yo puedo con todo.', 'Nunca es suficiente.'],
  ['Ya descanso después.', 'Si descanso, siento culpa.'],
  ['No pasa nada.', 'Me encierro y me aíslo.'],
];

/* Lente de cristal líquido: un disco transparente que refracta lo que tiene debajo.
   La frase que toca se revela completa. Sigue el puntero con suavizado; sin puntero,
   deriva despacio. Solo anima mientras está en pantalla. */
export default function Lente() {
  const card = useRef(null), lupa = useRef(null);

  useEffect(() => {
    const c = card.current, l = lupa.current, filas = [...c.querySelectorAll('.fila')];
    let W = 0, H = 0, R = 0, centros = [], cx = 0, cy = 0, tx = 0, ty = 0, manual = false, visible = false, raf = 0, t0 = performance.now();
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const medir = () => {
      const r = c.getBoundingClientRect(); W = r.width; H = r.height; R = l.offsetWidth / 2;
      centros = filas.map(f => { const b = f.getBoundingClientRect(); return { y: b.top - r.top + b.height / 2, x0: b.left - r.left, x1: b.right - r.left }; });
    };
    const pintar = () => {
      l.style.transform = `translate3d(${Math.round(cx - R)}px,${Math.round(cy - R)}px,0)`;
      filas.forEach((f, i) => {
        const m = centros[i];
        const dx = Math.max(m.x0 - cx, 0, cx - m.x1), dy = Math.abs(cy - m.y);
        const d = Math.hypot(dx, dy) / (R * 0.82);
        const t = Math.max(0, Math.min(1, 1.25 - d));
        f.style.setProperty('--t', (t * t * (3 - 2 * t)).toFixed(3));
      });
    };
    const cuadro = t => {
      raf = 0;
      if (!manual && !quieto) {
        const s = (t - t0) / 1000;
        tx = W * (0.46 + 0.16 * Math.sin(s * 0.45)); ty = H * (0.44 + 0.24 * Math.sin(s * 0.3 + 1.2));
      }
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      pintar();
      if (visible && (!quieto || Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5)) raf = requestAnimationFrame(cuadro);
    };
    const arrancar = () => { if (!raf && visible) raf = requestAnimationFrame(cuadro); };
    const mover = e => { const r = c.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; manual = true; arrancar(); };
    const salir = () => { manual = false; t0 = performance.now() - 2000; };
    c.addEventListener('pointermove', mover); c.addEventListener('pointerdown', mover); c.addEventListener('pointerleave', salir);
    medir(); cx = tx = W * 0.5; cy = ty = H * 0.42; pintar();
    const ro = new ResizeObserver(() => { medir(); pintar(); }); ro.observe(c);
    const io = new IntersectionObserver(en => { visible = en[0].isIntersecting; arrancar(); }); io.observe(c);
    document.fonts?.ready.then(() => { medir(); pintar(); });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); c.removeEventListener('pointermove', mover); c.removeEventListener('pointerdown', mover); c.removeEventListener('pointerleave', salir); };
  }, []);

  return (
    <div className="lente lg" ref={card}>
      <div className="frases">
        {FRASES.map(([dicho, callado]) => (
          <p className="fila" key={dicho}>
            <span className="dicho">{dicho}</span>
            <span className="callado" aria-label={'Lo que se calla: ' + callado}>{callado}</span>
          </p>
        ))}
      </div>
      <div className="lupa lg-r" ref={lupa} data-lg-depth="16" data-lg-strength="24" data-lg-blur="0.4" data-lg-ca="0" aria-hidden="true" />
      <div className="pie"><span>Mueve la lente</span><span>Lo revelado: lo que marcaron en la CDPS</span></div>
    </div>
  );
}
