'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { maquetar } from '@/lib/pliegos';
import { pub } from '@/lib/base';

const DECO = { portada: '/contenido/deco/portada.jpg', cap1: '/contenido/deco/cap1.jpg', cap2: '/contenido/deco/cap2.jpg', intro: '/contenido/deco/intro.jpg' };

/* Visor de pliegos: compone fuera de pantalla a escala real y muestra los pliegos (dos cartas
   enfrentadas) con el lomo marcado. Imprimir saca un pliego por hoja de 17 × 11 in. */
const Pliegos = forwardRef(function Pliegos({ doc, resolver, zoom }, ref) {
  const fuera = useRef(null), visor = useRef(null);
  const [estado, setEstado] = useState('Componiendo pliegos…');
  const [total, setTotal] = useState(0);

  useImperativeHandle(ref, () => ({ imprimir: () => window.print(), ir: n => visor.current?.children[n]?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }));

  useEffect(() => {
    let vivo = true;
    setEstado('Componiendo pliegos…');
    const deco = Object.fromEntries(Object.entries(DECO).map(([k, v]) => [k, pub(v)]));
    const t = setTimeout(async () => {
      try {
        const { paginas, pliegos } = await maquetar(doc, { raiz: fuera.current, resolver, deco });
        if (!vivo) return;
        const v = visor.current; v.innerHTML = '';
        pliegos.forEach(([a, b], k) => {
          const s = document.createElement('div'); s.className = 'pliego' + (!a ? ' solo-der' : '');
          s.dataset.n = k;
          s.appendChild(a ? a.el : Object.assign(document.createElement('div'), { className: 'pag vacia' }));
          s.appendChild(b ? b.el : Object.assign(document.createElement('div'), { className: 'pag vacia' }));
          const et = document.createElement('div'); et.className = 'pliego-et';
          et.textContent = (a ? a.n : '') + (a && b ? ' – ' : '') + (b ? b.n : '');
          s.appendChild(et);
          v.appendChild(s);
        });
        setTotal(pliegos.length);
        setEstado(`${paginas.length} páginas · ${pliegos.length} pliegos`);
      } catch (e) { console.error(e); setEstado('Error al componer: ' + e.message); }
    }, 60);
    return () => { vivo = false; clearTimeout(t); };
  }, [doc, resolver]);

  return (
    <div className="visor-pliegos">
      <div className="pliegos-estado lg-r">{estado}</div>
      <div className="pl pl-fuera" ref={fuera} aria-hidden="true" />
      <div className="pl lista-pliegos" ref={visor} style={{ zoom }} />
    </div>
  );
});

export default Pliegos;
