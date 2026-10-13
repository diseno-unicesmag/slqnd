'use client';

import { useEffect, useRef } from 'react';

const DICHO = ['Estoy bien.', 'Solo es cansancio.', 'Ya casi termino.', 'No pasa nada.'];
const CALLADO = ['Me aguanto y sigo.', 'Soy mi peor enemigo.', 'Es un ciclo sin fin.', 'Trato de salir solo.'];

/* Lente de cristal líquido: sigue el puntero con suavizado; sin puntero, deriva despacio.
   Solo anima mientras está en pantalla. */
export default function Lente() {
  const card = useRef(null), lupa = useRef(null), inner = useRef(null);

  useEffect(() => {
    const c = card.current, l = lupa.current, n = inner.current;
    let W = 0, H = 0, R = 0, cx = 0, cy = 0, tx = 0, ty = 0, manual = false, visible = false, raf = 0, t0 = performance.now();
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const medir = () => { const r = c.getBoundingClientRect(); W = r.width; H = r.height; R = l.offsetWidth / 2; };
    const pintar = () => {
      l.style.transform = `translate3d(${cx - R}px,${cy - R}px,0)`;
      n.style.transform = `translate3d(${R - cx}px,${R - cy}px,0)`;
    };
    const cuadro = t => {
      raf = 0;
      if (!manual && !quieto) {
        const s = (t - t0) / 1000;
        tx = W * (0.5 + 0.2 * Math.sin(s * 0.5)); ty = H * (0.43 + 0.22 * Math.sin(s * 0.34 + 1.2));
      }
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      pintar();
      if (visible && (!quieto || Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5)) raf = requestAnimationFrame(cuadro);
    };
    const arrancar = () => { if (!raf && visible) raf = requestAnimationFrame(cuadro); };
    const mover = e => { const r = c.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; manual = true; arrancar(); };
    const salir = () => { manual = false; t0 = performance.now() - 2000; };
    c.addEventListener('pointermove', mover); c.addEventListener('pointerdown', mover); c.addEventListener('pointerleave', salir);
    medir(); cx = tx = W * 0.6; cy = ty = H * 0.5; pintar();
    const ro = new ResizeObserver(() => { medir(); pintar(); }); ro.observe(c);
    const io = new IntersectionObserver(en => { visible = en[0].isIntersecting; arrancar(); }); io.observe(c);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); c.removeEventListener('pointermove', mover); c.removeEventListener('pointerdown', mover); c.removeEventListener('pointerleave', salir); };
  }, []);

  return (
    <div className="lente lg" ref={card} role="img" aria-label="Demostración del concepto: una lente de cristal que revela, bajo las frases que se dicen, las que se callan.">
      <div className="capa dicho" aria-hidden="true">{DICHO.map(t => <p key={t}>{t}</p>)}</div>
      <div className="lupa lg-r" ref={lupa} data-lg-depth="22" data-lg-strength="110" data-lg-blur="0.6" aria-hidden="true">
        <div className="capa callado" ref={inner}>{CALLADO.map(t => <p key={t}>{t}</p>)}</div>
      </div>
      <div className="pie"><span>Mueve la lente</span><span>Lo revelado: respuestas de la CDPS</span></div>
    </div>
  );
}
