'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { MAPS, RATINGS, SINTESIS } from '@/data/lluvia';
import { pub } from '@/lib/base';

// star = prioritaria, check = buena idea, cross = inviable
const NIVEL = { star: ['Prioritarias', '★'], check: ['Buenas ideas', '✓'], cross: ['Inviables', '✕'] };
const VEREDICTO = { star: 'Finalista', check: 'Buena idea, no finalista', cross: 'Descartada en la síntesis' };
const ORDEN = ['star', 'check', 'cross'];
const titulo = m => m.title.replace('+ ', '');

const total = MAPS.reduce((s, m) => s + m.ideas.length, 0);
const calificadas = Object.values(RATINGS).reduce((n, r) => n + Object.keys(r).length, 0);
const prioritarias = MAPS.flatMap(m => m.ideas.map((text, i) => ({ id: m.id + '_' + i, text, de: titulo(m), nivel: (RATINGS[m.id] || {})[i] }))).filter(x => x.nivel === 'star');
const finalistas = prioritarias.filter(p => SINTESIS[p.id] === 'star');
const TABS = [...MAPS.map(m => ({ id: m.id, label: titulo(m), n: m.ideas.length })), { id: 'sintesis', label: 'Síntesis', n: prioritarias.length, sint: true }];
const EMBUDO = [
  [total, `ideas en ${MAPS.length} industrias`],
  [prioritarias.length, `prioritarias entre las ${calificadas} ideas calificadas`],
  [finalistas.length, 'finalistas en la matriz de síntesis'],
  [1, 'propuesta: el ecosistema phygital', 'fin'],
];

function Industria({ m }) {
  const r = RATINGS[m.id];
  return (
    <>
      <div className="panel-cab">
        <div>
          <h2>Proyecto <span>+ {titulo(m)}</span></h2>
          {!r && <p>Tema asignado en la sesión de clase. La calificación de estas ideas no quedó registrada en la plataforma.</p>}
        </div>
        {m.image && <a href={pub('/' + m.image)} target="_blank" rel="noopener">Ver el registro del ejercicio (imagen, 33 MB) →</a>}
      </div>
      {!r ? (
        <div className="rejilla">{m.ideas.map(t => <div className="idea" key={t}>{t}</div>)}</div>
      ) : (
        <div className="cols">
          {ORDEN.map(k => {
            const ideas = m.ideas.filter((_, i) => r[i] === k);
            return (
              <div className={'colu lg ' + k} key={k}>
                <div className="colu-h"><i>{NIVEL[k][1]}</i>{NIVEL[k][0]}<span>{ideas.length}</span></div>
                {ideas.length === 0 && <p className="colu-vacia">Ninguna idea en este nivel.</p>}
                {ideas.map(t => <div className="idea" key={t}>{t}</div>)}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Sintesis() {
  return (
    <>
      <div className="panel-cab">
        <div><h2>Matriz de síntesis</h2><p>Las {prioritarias.length} ideas prioritarias de todas las industrias, comparadas entre sí.</p></div>
      </div>
      <div className="sint-grid">
        <div>
          {ORDEN.flatMap(k => prioritarias.filter(x => SINTESIS[x.id] === k).map(x => (
            <div className={'sint-fila ' + k} key={x.id}>
              <i>{NIVEL[k][1]}</i>
              <div>{x.text}<small>{x.de}: {VEREDICTO[k]}</small></div>
            </div>
          )))}
        </div>
        <aside className="propuesta">
          <p className="rot">Lo que emergió</p>
          <h3>Un ecosistema phygital: obras conceptuales físicas y una aplicación de Realidad Aumentada que actúa como lente reveladora.</h3>
          <p>De la matriz de síntesis emergió la propuesta central del proyecto.</p>
          <Link className="btn-pill primary" href="/#como-funciona">Ver cómo funciona</Link>
        </aside>
      </div>
    </>
  );
}

export default function Lluvia() {
  const [tab, setTab] = useState(MAPS[0].id);
  useEffect(() => { const h = window.location.hash.slice(1); if (TABS.some(t => t.id === h)) setTab(h); }, []);

  return (
    <div className="pg-lluvia">
      <main className="wrap">
        <header className="cab">
          <span className="badge-live"><i />Lluvia de ideas: industrias culturales y creativas</span>
          <h1>Lluvia de <em>ideas</em></h1>
          <p>El proyecto cruzado con cinco industrias culturales y creativas. Cada idea se calificó como prioritaria, buena o inviable, y las prioritarias pasaron a una matriz de síntesis.</p>
          <p className="nota-version">Ejercicio de clase de la Fase 1. Las ideas conservan la formulación con la que se escribieron, cuando el proyecto todavía era un libro ilustrado con Realidad Aumentada.</p>
        </header>

        <div className="embudo">
          {EMBUDO.map(([n, t, c]) => <div className={'paso lg ' + (c || '')} key={t}><b>{n}</b><span>{t}</span></div>)}
        </div>

        <div className="tabs" role="tablist" aria-label="Industrias">
          {TABS.map(t => (
            <button type="button" role="tab" key={t.id} className={t.sint ? 'sint' : undefined} aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}<small>{t.n}</small>
            </button>
          ))}
        </div>
        <section role="tabpanel" aria-live="polite">
          {tab === 'sintesis' ? <Sintesis /> : <Industria m={MAPS.find(m => m.id === tab)} />}
        </section>

        <Footer />
      </main>
    </div>
  );
}
