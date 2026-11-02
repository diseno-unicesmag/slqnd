'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { maquetar, aplicarCristales, ajustarCristal } from '@/lib/pliegos';
import { pub } from '@/lib/base';

const DECO = { portada: '/contenido/deco/portada.jpg', umbral: '/contenido/deco/umbral.jpg', cap1: '/contenido/deco/cap1.jpg', cap2: '/contenido/deco/cap2.jpg', cierre: '/contenido/deco/cierre.jpg' };

/* Visor de pliegos: compone fuera de pantalla a escala real y muestra los pliegos (dos cartas
   enfrentadas) con el lomo marcado. Imprimir saca un pliego por hoja de 17 × 11 in. */
const Pliegos = forwardRef(function Pliegos({ doc, resolver, zoom, editable, onCristal, onEditar, onSeleccionar }, ref) {
  const fuera = useRef(null), visor = useRef(null);
  const [estado, setEstado] = useState('Componiendo pliegos…');
  const [total, setTotal] = useState(0);

  useImperativeHandle(ref, () => ({ imprimir: () => window.print(), ir: n => visor.current?.children[n]?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }));

  // Mover el cristal no recompone los pliegos: solo cambia doc.cristales
  const base = useMemo(() => ({ ...doc, cristales: undefined }), [doc.blocks, doc.estilo, doc.meta]); // eslint-disable-line
  const cristales = doc.cristales || {};
  const vivoRef = useRef({}); vivoRef.current = { cristales, onCristal, onEditar, onSeleccionar, zoom, doc };
  const [listo, setListo] = useState(0);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    let vivo = true;
    setEstado('Componiendo pliegos…');
    const deco = Object.fromEntries(Object.entries(DECO).map(([k, v]) => [k, pub(v)]));
    const t = setTimeout(async () => {
      try {
        const { paginas, pliegos } = await maquetar(base, { raiz: fuera.current, resolver, deco });
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
        setTotal(pliegos.length); setListo(x => x + 1);
        setEstado(`${paginas.length} páginas · ${pliegos.length} pliegos`);
      } catch (e) { console.error(e); setEstado('Error al componer: ' + e.message); }
    }, 60);
    return () => { vivo = false; clearTimeout(t); };
  }, [base, resolver]);

  useEffect(() => { if (visor.current) aplicarCristales(visor.current, cristales); }, [cristales, listo]);

  // Edición directa en los pliegos: arrastrar el cristal, agrandarlo con la esquina o la rueda,
  // y doble clic en un texto para corregirlo sin salir de la vista
  useEffect(() => {
    const v = visor.current; if (!v || !editable) return;
    let sel = null;
    const marcar = el => {
      v.querySelectorAll('.cristal-sel').forEach(e => { e.classList.remove('cristal-sel'); e.querySelector(':scope > .cristal-asa')?.remove(); });
      sel = el; if (!el) return;
      el.classList.add('cristal-sel');
      const asa = document.createElement('i'); asa.className = 'cristal-asa'; el.appendChild(asa);
    };
    const guardar = (k, ov) => vivoRef.current.onCristal?.(k, ov);
    const abajo = e => {
      const el = e.target.closest('[data-k]');
      if (!el) {
        marcar(null);
        const b = e.target.closest('[data-b],[data-id]');
        v.querySelectorAll('.bloque-sel').forEach(x => x.classList.remove('bloque-sel'));
        if (b) { const id = b.dataset.b || b.dataset.id; v.querySelectorAll(`[data-b="${id}"],[data-id="${id}"]`).forEach(x => x.classList.add('bloque-sel')); vivoRef.current.onSeleccionar?.(id); }
        return;
      }
      e.preventDefault(); e.stopPropagation(); marcar(el);
      const k = el.dataset.k, z = vivoRef.current.zoom || 1;
      const ov0 = { dx: 0, dy: 0, s: 1, ...(vivoRef.current.cristales[k] || {}) };
      const x0 = e.clientX, y0 = e.clientY, base = +el.dataset.lado;
      const escalar = e.target.classList.contains('cristal-asa');
      let ov = ov0;
      const mover = m => {
        const dx = (m.clientX - x0) / z, dy = (m.clientY - y0) / z;
        ov = escalar
          ? { ...ov0, s: Math.max(0.2, Math.min(4, (base * ov0.s + Math.max(dx, dy) * 2) / base)) }
          : { ...ov0, dx: Math.round(ov0.dx + dx), dy: Math.round(ov0.dy + dy) };
        ajustarCristal(el, ov); if (!el.querySelector(':scope > .cristal-asa')) marcar(el);
      };
      const soltar = () => { window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', soltar); if (ov !== ov0) guardar(k, ov); };
      window.addEventListener('pointermove', mover); window.addEventListener('pointerup', soltar);
    };
    const rueda = e => {
      const el = e.target.closest('[data-k]'); if (!el) return;
      e.preventDefault();
      const k = el.dataset.k, ov = { dx: 0, dy: 0, s: 1, ...(vivoRef.current.cristales[k] || {}) };
      ov.s = Math.max(0.2, Math.min(4, +(ov.s * (e.deltaY < 0 ? 1.05 : 1 / 1.05)).toFixed(3)));
      ajustarCristal(el, ov); marcar(el); guardar(k, ov);
    };
    const tecla = e => {
      if (!sel || e.target.isContentEditable) return;
      const k = sel.dataset.k, ov = { dx: 0, dy: 0, s: 1, ...(vivoRef.current.cristales[k] || {}) }, p = e.shiftKey ? 10 : 1;
      const m = { ArrowLeft: [-p, 0], ArrowRight: [p, 0], ArrowUp: [0, -p], ArrowDown: [0, p] }[e.key];
      if (e.key === 'Escape') return marcar(null);
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { e.preventDefault(); ajustarCristal(sel, {}); marcar(sel); return guardar(k, null); }
      if (!m) return;
      e.preventDefault(); ov.dx += m[0]; ov.dy += m[1]; ajustarCristal(sel, ov); marcar(sel); guardar(k, ov);
    };
    // Doble clic: el texto se corrige ahí mismo, en el pliego. Al salir se guarda el bloque
    // completo (si está partido entre páginas, se unen sus partes) y los pliegos se recomponen.
    const doble = e => {
      if (e.target.closest('[data-k]')) return;
      const el = e.target.closest('[data-b],[data-id]'); if (!el || el.isContentEditable) return;
      const id = el.dataset.b || el.dataset.id, attr = el.dataset.b ? 'b' : 'id';
      const bloque = vivoRef.current.doc.blocks.find(b => b.id === id);
      const enLinea = bloque && bloque.html != null && /^(P|H[1-6])$/.test(el.tagName);
      if (!enLinea) { setEditor({ id }); return; }
      const partes = [...v.querySelectorAll(`[data-${attr}="${id}"]`)];
      partes.forEach(x => { x.contentEditable = 'true'; x.classList.add('editando-texto'); });
      el.focus();
      const salir = () => {
        setTimeout(() => {
          if (partes.includes(document.activeElement)) return;
          partes.forEach(x => { x.removeAttribute('contenteditable'); x.classList.remove('editando-texto'); x.removeEventListener('blur', salir); x.removeEventListener('keydown', tec); });
          const html = partes.map(x => x.innerHTML).join('');
          if (html !== bloque.html) vivoRef.current.onEditar?.(id, { html });
        }, 0);
      };
      const tec = k => { if (k.key === 'Escape' || (k.key === 'Enter' && !k.shiftKey)) { k.preventDefault(); document.activeElement.blur(); } };
      partes.forEach(x => { x.addEventListener('blur', salir); x.addEventListener('keydown', tec); });
    };
    v.addEventListener('pointerdown', abajo); v.addEventListener('wheel', rueda, { passive: false });
    v.addEventListener('dblclick', doble); window.addEventListener('keydown', tecla);
    return () => { marcar(null); v.removeEventListener('pointerdown', abajo); v.removeEventListener('wheel', rueda); v.removeEventListener('dblclick', doble); window.removeEventListener('keydown', tecla); };
  }, [editable, listo]);

  return (
    <div className="visor-pliegos">
      <div className="pliegos-estado lg-r">{estado}</div>
      <div className="pl pl-fuera" ref={fuera} aria-hidden="true" />
      <div className={'pl lista-pliegos' + (editable ? ' editando' : '')} ref={visor} style={{ zoom }} />
      {editor && <EditorTexto bloque={doc.blocks.find(b => b.id === editor.id)} cerrar={() => setEditor(null)} guardar={html => { onEditar?.(editor.id, html); setEditor(null); }} />}
    </div>
  );
});

export default Pliegos;

// Ventana para corregir un bloque desde los pliegos; al guardar se recomponen con el cambio
function EditorTexto({ bloque, cerrar, guardar }) {
  const caja = useRef(null);
  useEffect(() => { if (caja.current && bloque) { caja.current.innerHTML = (bloque.html != null ? bloque.html : bloque.title) || ''; caja.current.focus(); } }, [bloque]);
  if (!bloque) return null;
  const campo = bloque.html != null ? 'html' : 'title';
  return (
    <div className="editor-texto-fondo" onMouseDown={e => { if (e.target === e.currentTarget) cerrar(); }}>
      <div className="editor-texto lg">
        <div className="et-cab"><b>Editar texto</b><span>Ctrl+Enter guarda · Esc cancela</span></div>
        <div ref={caja} className="et-caja" contentEditable suppressContentEditableWarning
          onKeyDown={e => { if (e.key === 'Escape') cerrar(); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) guardar({ [campo]: caja.current.innerHTML }); }} />
        <div className="et-pie"><button onClick={cerrar}>Cancelar</button><button className="primario" onClick={() => guardar({ [campo]: caja.current.innerHTML })}>Guardar</button></div>
      </div>
    </div>
  );
}
