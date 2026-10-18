'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pub } from '@/lib/base';
import { IMAGENES } from '@/data/moodboard';
import { W, H, ZONAS, ELEMENTOS, ENLACES, PALABRAS, NO, NOMBRES } from '@/data/moodboardLienzo';

const src = n => pub('/Recursos/moodboard/' + n + '.jpg');
const alto = e => (e.tipo === 'img' ? Math.round(e.w * IMAGENES[e.src].h / IMAGENES[e.src].w) + 44 : e.h);
const POR_ID = Object.fromEntries(ELEMENTOS.map(e => [e.id, e]));
const MIN = 0.12, MAX = 2.4;

function centro(e) { return [e.x + e.w / 2, e.y + alto(e) / 2]; }

function Enlace({ a, b, tipo }) {
  const [x1, y1] = centro(POR_ID[a]);
  const [x2, y2] = centro(POR_ID[b]);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const cx = mx + (y2 - y1) * 0.12, cy = my - (x2 - x1) * 0.12;
  return <path className={'enl ' + (tipo || 'fino')} d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`} markerEnd={tipo === 'flecha' ? 'url(#mb-flecha)' : undefined} />;
}

function Elemento({ e, abrir }) {
  const st = { left: e.x, top: e.y, width: e.w, minHeight: e.tipo === 'img' ? undefined : e.h, '--rot': (e.rot || 0) + 'deg' };
  switch (e.tipo) {
    case 'centro':
      return (
        <div className="mb-el mb-centro" style={st}>
          <span className="mb-k">Concepto de diseño</span>
          <h2>El silencio toma forma en una <em>metáfora</em> y la Realidad Aumentada la <em>revela</em></h2>
          <div className="mb-tres"><span>Silencio</span><i>→</i><span>Metáfora</span><i>→</i><span>Revelación</span></div>
        </div>
      );
    case 'cab':
      return <div className={'mb-el mb-cab ' + e.tono} style={st}><b>{e.n}</b><div><h3>{e.t}</h3><p>{e.lema}</p></div></div>;
    case 'img': {
      const d = IMAGENES[e.src];
      return (
        <figure className="mb-el mb-img" style={st}>
          <button type="button" onClick={() => abrir(e)} aria-label={'Ampliar ' + e.t}>
            <img src={src(e.src)} alt={e.t} width={d.w} height={d.h} loading="lazy" draggable={false} />
          </button>
          <figcaption>{e.t}{e.pal && <span className="mb-pal">{d.pal.map(c => <i key={c} style={{ background: c }} title={c} />)}</span>}</figcaption>
        </figure>
      );
    }
    case 'nota':
      return <div className={'mb-el mb-nota ' + e.color} style={st}>{e.tit && <b>{e.tit}</b>}<p>{e.txt}</p>{e.autor && <small>{e.autor}</small>}</div>;
    case 'cita':
      return <blockquote className={'mb-el mb-cita' + (e.grande ? ' grande' : '') + (e.oro ? ' oro' : '')} style={st}><p>{e.grande ? '«' + e.txt + '»' : e.txt}</p>{e.autor && <cite>{e.autor}</cite>}</blockquote>;
    case 'dato':
      return <div className="mb-el mb-dato" style={st}><b>{e.num}</b><p>{e.txt}</p><small>{e.autor}</small></div>;
    case 'lista':
      return <div className="mb-el mb-lista" style={st}><span className="mb-k">{e.t}</span><ul>{e.items.map(x => <li key={x}>{x}</li>)}</ul></div>;
    case 'se-ve':
      return (
        <div className="mb-el mb-seve" style={st}>
          <span className="mb-k">{e.t}</span>
          {e.items.map(([k, v, cs]) => (
            <div key={k}><span>{cs ? cs.map(c => <i key={c} style={{ background: c }} title={c} />) : <i className="vacio" />}</span><p><b>{k}</b> {v}</p></div>
          ))}
        </div>
      );
    case 'paleta':
      return (
        <div className="mb-el mb-paleta" style={st}>
          <div className="mb-circ"><i style={{ background: '#2b1759' }} /><i style={{ background: '#f5c542' }} /></div>
          <div><b>Violeta y dorado</b><p>El silencio y su revelación, uno sobre otro.</p><small>#2b1759 · #f5c542</small></div>
        </div>
      );
    case 'bouba':
      return (
        <div className="mb-el mb-bouba" style={st}>
          <svg viewBox="0 0 300 140" aria-hidden="true">
            <path d="M70 18c32-6 58 18 52 48s-10 54-46 58-58-14-60-46S38 24 70 18z" fill="#7455c2" />
            <path d="M190 20l22 40 44-14-24 38 40 30-48 4-6 22-26-34-30 16 10-38-30-22 40-6z" fill="#f5c542" />
          </svg>
          <p><b>Bouba y Kiki.</b> La forma también comunica, antes que la palabra.</p>
        </div>
      );
    case 'palabras':
      return (
        <div className="mb-el mb-palabras" style={st}>
          <span className="mb-k">Lo que busca provocar</span>
          <div>{PALABRAS.map((w, i) => <span key={w} className={'w' + (i % 4)}>{w}</span>)}{NO.map(w => <span key={w} className="no">{w}</span>)}</div>
        </div>
      );
    case 'nombres':
      return <div className="mb-el mb-nombres" style={st}><span className="mb-k">¿Cuál es mi concepto? Otras formas de nombrarlo</span><div>{NOMBRES.map(n => <span key={n}>{n}</span>)}</div></div>;
    default:
      return null;
  }
}

export default function Lienzo() {
  const caja = useRef(null);
  const [vista, setVista] = useState({ x: 0, y: 0, s: 0.2 });
  const [anim, setAnim] = useState(false);
  const [zona, setZona] = useState('todo');
  const [foto, setFoto] = useState(null);
  const ptrs = useRef(new Map());
  const gesto = useRef(null);
  const movio = useRef(false);

  const ir = useCallback((z, animar = true) => {
    const el = caja.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 40, top = 90;
    const s = Math.min((r.width - 2 * pad) / z.w, (r.height - top - pad) / z.h);
    setAnim(animar);
    setVista({ s, x: (r.width - z.w * s) / 2 - z.x * s, y: top + (r.height - top - pad - z.h * s) / 2 - z.y * s });
    setZona(z.id);
  }, []);

  useEffect(() => {
    const inicial = () => ZONAS.find(z => '#' + z.id === window.location.hash) || ZONAS[0];
    ir(inicial(), false);
    const f = () => ir(inicial(), false);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, [ir]);

  const zoomEn = useCallback((px, py, factor) => {
    setAnim(false);
    setVista(v => {
      const s = Math.min(MAX, Math.max(MIN, v.s * factor));
      const k = s / v.s;
      return { s, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  }, []);

  useEffect(() => {
    const el = caja.current;
    const rueda = ev => {
      ev.preventDefault();
      const r = el.getBoundingClientRect();
      zoomEn(ev.clientX - r.left, ev.clientY - r.top, Math.exp(-ev.deltaY * (ev.ctrlKey ? 0.01 : 0.0015)));
    };
    el.addEventListener('wheel', rueda, { passive: false });
    return () => el.removeEventListener('wheel', rueda);
  }, [zoomEn]);

  const abajo = ev => {
    if (ev.target.closest('.mb-ui')) return;
    caja.current.setPointerCapture(ev.pointerId);
    ptrs.current.set(ev.pointerId, [ev.clientX, ev.clientY]);
    movio.current = false;
    setAnim(false);
    gesto.current = null;
  };
  const mover = ev => {
    if (!ptrs.current.has(ev.pointerId)) return;
    const prev = ptrs.current.get(ev.pointerId);
    ptrs.current.set(ev.pointerId, [ev.clientX, ev.clientY]);
    const p = [...ptrs.current.values()];
    if (p.length === 1) {
      const dx = ev.clientX - prev[0], dy = ev.clientY - prev[1];
      if (Math.abs(dx) + Math.abs(dy) > 2) movio.current = true;
      setVista(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (p.length === 2) {
      const d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]);
      const r = caja.current.getBoundingClientRect();
      const mx = (p[0][0] + p[1][0]) / 2 - r.left, my = (p[0][1] + p[1][1]) / 2 - r.top;
      if (gesto.current) zoomEn(mx, my, d / gesto.current);
      gesto.current = d;
      movio.current = true;
    }
  };
  const arriba = ev => { ptrs.current.delete(ev.pointerId); gesto.current = null; };
  const abrir = e => { if (!movio.current) setFoto(e); };
  const boton = f => { const r = caja.current.getBoundingClientRect(); zoomEn(r.width / 2, r.height / 2, f); };

  return (
    <div className="mb-caja" ref={caja} onPointerDown={abajo} onPointerMove={mover} onPointerUp={arriba} onPointerCancel={arriba}>
      <div className={'mb-mundo' + (anim ? ' anim' : '')} style={{ width: W, height: H, transform: `translate(${vista.x}px,${vista.y}px) scale(${vista.s})` }}>
        <svg className="mb-enlaces" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs><marker id="mb-flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#b9a8f0" /></marker></defs>
          {ENLACES.map(([a, b, t]) => <Enlace key={a + b} a={a} b={b} tipo={t} />)}
        </svg>
        {ELEMENTOS.map(e => <Elemento key={e.id} e={e} abrir={abrir} />)}
      </div>

      <div className="mb-ui mb-titulo">
        <span className="badge-live"><i />Concepto de diseño · moodboard</span>
        <p>Arrastra para moverte, usa la rueda o pellizca para acercarte y toca una imagen para verla.</p>
      </div>
      <div className="mb-ui mb-zonas lg-r" role="group" aria-label="Ir a una zona del lienzo">
        {ZONAS.map(z => <button type="button" key={z.id} aria-pressed={zona === z.id} onClick={() => ir(z)}>{z.t}</button>)}
      </div>
      <div className="mb-ui mb-zoom lg-r">
        <button type="button" onClick={() => boton(1.3)} aria-label="Acercar">+</button>
        <button type="button" onClick={() => boton(1 / 1.3)} aria-label="Alejar">−</button>
      </div>

      {foto && (
        <div className="mb-ui mb-foto" role="dialog" aria-label={foto.t} onClick={() => setFoto(null)}>
          <figure onClick={ev => ev.stopPropagation()}>
            <img src={src(foto.src)} alt={foto.t} />
            <figcaption>
              <b>{foto.t}</b>
              <span className="mb-pal">{IMAGENES[foto.src].pal.map(c => <span key={c}><i style={{ background: c }} />{c}</span>)}</span>
              <button type="button" onClick={() => setFoto(null)}>Cerrar</button>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
