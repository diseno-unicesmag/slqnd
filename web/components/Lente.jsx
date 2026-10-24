'use client';

import { useEffect, useRef } from 'react';

// Lo que se dice y, debajo, lo que se calla. Lo callado son opciones que los participantes marcaron en la CDPS (P14 y P17).
const FRASES = [
  ['Estoy bien.', 'Pierdo las ganas de todo.'],
  ['Yo puedo con todo.', 'Nunca es suficiente.'],
  ['Ya descanso después.', 'Si descanso, siento culpa.'],
  ['No pasa nada.', 'Me encierro y me aíslo.'],
];

/* Lente de cristal líquido dentro de un círculo. Hay dos capas de frases: la de lo dicho,
   recortada para que no se vea bajo la lente, y la de lo callado, visible solo dentro de ella.
   Así solo cambia lo que queda debajo del cristal. Sigue el puntero con suavizado; sin puntero,
   deriva despacio. Solo anima mientras está en pantalla. */
export default function Lente() {
  const card = useRef(null), lupa = useRef(null);

  useEffect(() => {
    const c = card.current, l = lupa.current;
    let W = 0, H = 0, R = 0, cx = 0, cy = 0, tx = 0, ty = 0, manual = false, visible = false, raf = 0, t0 = performance.now();
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const medir = () => { const r = c.getBoundingClientRect(); W = r.width; H = r.height; R = l.offsetWidth / 2; };
    const pintar = () => {
      l.style.transform = `translate3d(${Math.round(cx - R)}px,${Math.round(cy - R)}px,0)`;
      c.style.setProperty('--x', cx.toFixed(1) + 'px');
      c.style.setProperty('--y', cy.toFixed(1) + 'px');
      c.style.setProperty('--r', R.toFixed(1) + 'px');
    };
    const cuadro = t => {
      raf = 0;
      if (!manual && !quieto) {
        const s = (t - t0) / 1000;
        tx = W * (0.5 + 0.17 * Math.sin(s * 0.45)); ty = H * (0.5 + 0.2 * Math.sin(s * 0.3 + 1.2));
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
    <figure className="lente-caja">
      <div className="lente lg" ref={card}>
        <div className="frases dichas">
          {FRASES.map(([dicho]) => <p className="fila" key={dicho}>{dicho}</p>)}
        </div>
        <div className="frases calladas" aria-label="Lo que se calla">
          {FRASES.map(([dicho, callado]) => <p className="fila" key={dicho}>{callado}</p>)}
        </div>
        <div className="lupa lg-r" ref={lupa} data-lg-depth="16" data-lg-strength="24" data-lg-blur="0.4" data-lg-ca="0" aria-hidden="true" />
      </div>
      <figcaption className="pie"><span>Mueve la lente</span><span>Lo revelado: lo que marcaron en la CDPS</span></figcaption>
    </figure>
  );
}
