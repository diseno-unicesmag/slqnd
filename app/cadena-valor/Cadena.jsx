'use client';

import { useEffect, useMemo, useState } from 'react';
import Footer from '@/components/Footer';
import { Descarga, Lupa } from '@/components/Iconos';
import { BLOCKS as BLOQUES_BASE, NODES as NODOS_BASE } from '@/data/cadena';
import { pub } from '@/lib/base';

/* ── Geometría: árbol radial centro → bloque → tema → concepto ── */
const COLOR = { B1: '#f0c24b', B2: '#8fb8e8', B3: '#8ed1b1', B4: '#b9a8f0', B5: '#f0a3c4', B6: '#f2b48a' };
const RB = 176, RT = 276, RL = 344, RTXT = 358, GAP = 5, V = 625;
const r2 = x => Math.round(x * 100) / 100;
const pt = (r, a) => [r2(r * Math.cos(a * Math.PI / 180)), r2(r * Math.sin(a * Math.PI / 180))];
const curva = (r1, a1, r2, a2) => { const m = (r1 + r2) / 2; return `M${pt(r1, a1)} C${pt(m, a1)} ${pt(m, a2)} ${pt(r2, a2)}`; };
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const media = xs => xs.reduce((s, x) => s + x, 0) / xs.length;

function construir() {
  const paso = (360 - GAP * BLOQUES_BASE.length) / NODOS_BASE.length;
  let ang = -90 - (NODOS_BASE.filter(n => n.block === 'B1').length * paso) / 2;
  const nodos = [], temas = [], bloques = [];
  BLOQUES_BASE.forEach(b => {
    const hojas = NODOS_BASE.filter(n => n.block === b.id).map(n => { const h = { ...n, a: r2(ang + paso / 2) }; ang += paso; return h; });
    [...new Set(hojas.map(h => h.label))].forEach(t => {
      const hs = hojas.filter(h => h.label === t), id = b.id + '|' + t;
      hs.forEach(h => { h.tema = id; });
      temas.push({ id, block: b.id, label: t, a: media(hs.map(h => h.a)) });
    });
    bloques.push({ ...b, color: COLOR[b.id], nombre: b.label.replace('\n', ' '), lineas: b.label.split('\n'), a: media(hojas.map(h => h.a)), n: hojas.length });
    nodos.push(...hojas);
    ang += GAP;
  });
  return { nodos, temas, bloques };
}
const { nodos: NODOS, temas: TEMAS, bloques: BLOQUES } = construir();
const bloque = id => BLOQUES.find(b => b.id === id);
const tema = id => TEMAS.find(t => t.id === id);
const hojasDe = s => !s ? [] : s.hoja ? NODOS.filter(n => n.id === s.hoja) : s.tema ? NODOS.filter(n => n.tema === s.tema) : NODOS.filter(n => n.block === s.bloque);
const igual = (a, b) => !!a && !!b && a.hoja === b.hoja && a.bloque === b.bloque && a.tema === b.tema;
const tecla = fn => e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };

function Fuente({ n }) { return <div className="fuente"><b>{n.author}</b><i>{n.obra}</i></div>; }
function Chip({ b }) { return <span className="chipb" style={{ color: b.color, borderColor: b.color + '66' }}>{b.nombre}</span>; }

function Panel({ sel, fijar }) {
  if (sel?.hoja) {
    const n = NODOS.find(x => x.id === sel.hoja);
    return <><Chip b={bloque(n.block)} /><p className="rot">{n.label}</p><h2>{n.sub}</h2><p>{n.resumen}</p><Fuente n={n} /></>;
  }
  if (sel?.bloque || sel?.tema) {
    const b = bloque(sel.bloque || tema(sel.tema).block), hs = hojasDe(sel);
    return (
      <>
        <Chip b={b} />
        <h2>{sel.tema ? tema(sel.tema).label : b.nombre}</h2>
        <p>{hs.length} {hs.length === 1 ? 'concepto' : 'conceptos'}</p>
        <ul className="lista-h">
          {hs.map(n => <li key={n.id}><button type="button" onClick={() => fijar({ hoja: n.id })}>{n.sub}<small>{n.label} · {n.author}</small></button></li>)}
        </ul>
      </>
    );
  }
  return (
    <>
      <p className="rot">Cómo leer la red</p>
      <h2>{NODOS.length} conceptos en {BLOQUES.length} bloques</h2>
      <p>Del centro salen los bloques; de cada bloque, sus temas; de cada tema, los conceptos con su autor.</p>
      <ul className="leyenda">
        {BLOQUES.map(b => <li key={b.id}><button type="button" onClick={() => fijar({ bloque: b.id })}><i style={{ background: b.color }} />{b.nombre}<span>{b.n}</span></button></li>)}
      </ul>
    </>
  );
}

export default function Cadena() {
  const [hover, setHover] = useState(null);
  const [fijo, setFijo] = useState(null);
  const [q, setQ] = useState('');
  const [vista, setVista] = useState('red');

  useEffect(() => { try { const v = localStorage.getItem('cv_vista'); if (v === 'lista') setVista('lista'); } catch {} }, []);
  const cambiarVista = v => { setVista(v); try { localStorage.setItem('cv_vista', v); } catch {} };
  const fijar = s => setFijo(f => (igual(f, s) ? null : s));

  const sel = hover || fijo;
  const on = useMemo(() => {
    const s = new Set();
    hojasDe(sel).forEach(n => { s.add(n.id); s.add(n.tema); s.add(n.block); });
    return s;
  }, [sel]);
  const coincide = useMemo(() => {
    const k = norm(q.trim());
    return new Set(NODOS.filter(n => !k || norm([n.label, n.sub, n.author, n.obra, n.resumen].join(' ')).includes(k)).map(n => n.id));
  }, [q]);
  const cls = (base, id, extra = '') => base + (on.has(id) ? ' on' : '') + extra;
  const eventos = s => ({ onMouseEnter: () => setHover(s), onMouseLeave: () => setHover(null), onFocus: () => setHover(s), onBlur: () => setHover(null), onClick: () => fijar(s), onKeyDown: tecla(() => fijar(s)) });

  return (
    <div className={'pg-cadena' + (vista === 'lista' ? ' v-lista' : '')}>
      <main className="wrap">
        <header className="cab">
          <div>
            <span className="badge-live"><i />Cadena de valor · Marco teórico</span>
            <h1>Red de <em>conceptos</em></h1>
            <p>Seis bloques, sus temas y los autores que sostienen el proyecto. Pasa por un concepto para seguir su hilo hasta el centro; haz clic para fijarlo.</p>
          </div>
          <a className="btn-pill" href={pub('/Recursos/Cadena de Valor.xlsx')} download><Descarga />Descargar la matriz en Excel</a>
        </header>

        <div className="barra">
          <div className="seg-ctl" role="group" aria-label="Cambiar de vista">
            <button type="button" aria-pressed={vista === 'red'} onClick={() => cambiarVista('red')}>Red</button>
            <button type="button" aria-pressed={vista === 'lista'} onClick={() => cambiarVista('lista')}>Lista</button>
          </div>
          <label className="buscar">
            <Lupa />
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar concepto, autor u obra" aria-label="Buscar concepto, autor u obra" />
          </label>
          <span className="cuenta" aria-live="polite">{q.trim() ? `${coincide.size} de ${NODOS.length} conceptos` : ''}</span>
        </div>

        <div className="lienzo">
          <div className="mapa lg">
            <svg viewBox={`${-V} ${-V} ${V * 2} ${V * 2}`} className={sel ? 'sel' : undefined} role="group" aria-label="Red de conceptos del marco teórico" onClick={e => { if (e.target === e.currentTarget) setFijo(null); }}>
              <g>
                {BLOQUES.map(b => <path key={b.id} className={cls('link', b.id)} d={`M0,0 L${pt(RB, b.a)}`} stroke={b.color} />)}
                {TEMAS.map(t => <path key={t.id} className={cls('link', t.id)} d={curva(RB, bloque(t.block).a, RT, t.a)} stroke={bloque(t.block).color} />)}
                {NODOS.map(n => <path key={n.id} className={cls('link', n.id)} d={curva(RT, tema(n.tema).a, RL, n.a)} stroke={bloque(n.block).color} />)}
              </g>
              <g>
                {BLOQUES.map(b => {
                  const w = Math.max(...b.lineas.map(l => l.length)) * 9.6 + 30;
                  return (
                    <g key={b.id} className={cls('bloque', b.id)} transform={`translate(${pt(RB, b.a)})`} tabIndex={0} role="button" aria-label={'Bloque ' + b.nombre} {...eventos({ bloque: b.id })}>
                      <rect x={-w / 2} y={-25} width={w} height={50} rx={25} stroke={b.color} />
                      {b.lineas.map((l, i) => <text key={l} textAnchor="middle" y={(i - (b.lineas.length - 1) / 2) * 17 + 5} fill={b.color}>{l}</text>)}
                    </g>
                  );
                })}
                {TEMAS.map(t => (
                  <g key={t.id} className={cls('tema', t.id)} transform={`translate(${pt(RT, t.a)})`} onMouseEnter={() => setHover({ tema: t.id })} onMouseLeave={() => setHover(null)} onClick={() => fijar({ tema: t.id })}>
                    <circle r={6} fill={bloque(t.block).color} /><title>{t.label}</title>
                  </g>
                ))}
                {NODOS.map(n => {
                  const izq = Math.cos(n.a * Math.PI / 180) < 0, anc = izq ? 'end' : 'start';
                  return (
                    <g key={n.id} className={cls('hoja', n.id, (fijo?.hoja === n.id ? ' fija' : '') + (coincide.has(n.id) ? '' : ' fuera'))} transform={`rotate(${n.a})`} tabIndex={0} role="button" aria-label={`${n.label}: ${n.sub}. ${n.author}`} {...eventos({ hoja: n.id })}>
                      <circle cx={RL} r={5.5} fill={bloque(n.block).color} />
                      <g transform={izq ? `translate(${RTXT},0) rotate(180)` : `translate(${RTXT},0)`}>
                        <text className="t" textAnchor={anc} y={-8}>{n.label}</text>
                        <text className="s" textAnchor={anc} y={12}>{n.sub}</text>
                        <rect x={izq ? -250 : -16} y={-20} width={266} height={40} fill="transparent" />
                      </g>
                    </g>
                  );
                })}
                <g className="centro">
                  <circle r={62} />
                  <text textAnchor="middle" y={-4}>Sobre lo que</text>
                  <text className="a" textAnchor="middle" y={15}>no digo</text>
                </g>
              </g>
            </svg>
          </div>
          <aside className="panel lg" aria-live="polite"><Panel sel={sel} fijar={fijar} /></aside>
        </div>

        <div className="lista">
          {BLOQUES.map(b => {
            const hs = NODOS.filter(n => n.block === b.id && coincide.has(n.id));
            if (!hs.length) return null;
            return (
              <section className="bloque-sec" key={b.id}>
                <h2><i style={{ background: b.color }} />{b.nombre}<span>{b.n} conceptos</span></h2>
                <div className="tarjetas">
                  {hs.map(n => (
                    <article className="tarjeta lg" key={n.id} style={{ borderTopColor: b.color }}>
                      <p className="rot">{n.label}</p><h3>{n.sub}</h3><p>{n.resumen}</p><Fuente n={n} />
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        {coincide.size === 0 && <div className="vacio lg" style={{ display: 'block' }}>Ningún concepto coincide con la búsqueda.</div>}

        <Footer />
      </main>
    </div>
  );
}
