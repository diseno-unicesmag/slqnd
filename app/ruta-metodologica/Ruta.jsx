'use client';

import { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { FASES } from '@/data/ruta';
import { pub } from '@/lib/base';

const TIPOS = { Todas: 'Todas', Clase: 'Ejercicio de clase', Campo: 'Trabajo de campo', 'Creación': 'Creación' };
const ENLACES = { 'cadena-valor.html': '/cadena-valor/', 'cdps.html': '/cdps/', 'match-creativo.html': '/match-creativo/', 'lluvia-ideas.html': '/lluvia-ideas/' };
const todas = FASES.flatMap(f => f.acts);
const hechasTotal = todas.filter(a => a.ok).length;

export default function Ruta() {
  const [abierta, setAbierta] = useState(null);
  const [filtro, setFiltro] = useState('Todas');

  return (
    <div className="pg-ruta">
      <main className="wrap">
        <header className="cab">
          <div>
            <span className="badge-live"><i />Investigación-Creación · Procedimiento de las 3i</span>
            <h1>Ruta <em>metodológica</em></h1>
            <p>Indagar, idear e implementar: tres momentos recorridos en tres fases. Abre cualquier actividad para ver qué se hizo, con quién y qué dejó.</p>
          </div>
          <div className="avance lg">
            <b>{hechasTotal}<small> de {todas.length}</small></b>
            <span>actividades realizadas en las tres fases</span>
            <div className="seg">{todas.map((a, i) => <i key={i} className={a.ok ? 'ok' : ''} />)}</div>
          </div>
        </header>

        <div className="barra">
          <div className="chips" role="group" aria-label="Filtrar actividades por tipo">
            {Object.keys(TIPOS).map(k => (
              <button type="button" className="chip" key={k} aria-pressed={filtro === k} onClick={() => setFiltro(k)}>{TIPOS[k]}</button>
            ))}
          </div>
          <div className="leyenda"><span><i />Realizada</span><span><i className="p" />Por realizar</span></div>
        </div>

        <div className="tablero">
          {FASES.map((f, fi) => {
            const hechas = f.acts.filter(a => a.ok).length;
            return (
              <section className="col lg" data-estado={hechas === 0 ? 'pend' : 'ok'} key={f.fase}>
                <div className="fase-cab">
                  <div className="fase-i">{fi + 1} · {f.i.toUpperCase()}<em>{f.estado} · {hechas}/{f.acts.length}</em></div>
                  <h2>{f.fase}</h2>
                  <p>{f.sub} · {f.cuando}</p>
                </div>
                <div className="prop"><p className="rot">Propósito específico {fi + 1}</p><p>{f.proposito}</p></div>
                <ol className="acts">
                  {f.acts.map((a, k) => {
                    const id = fi + '-' + k, esta = abierta === id;
                    return (
                      <li key={id} className={'act' + (a.ok ? '' : ' pend') + (esta ? ' abierta' : '') + (filtro !== 'Todas' && a.tipo !== filtro ? ' dim' : '')}>
                        <button type="button" className="act-b" aria-expanded={esta} aria-controls={'det-' + id} onClick={() => setAbierta(esta ? null : id)}>
                          <span className="dot">{k + 1}</span>
                          <span><span className="act-t">{a.t}</span><span className="act-m">{a.ok ? a.cuando : 'Por realizar'}</span></span>
                          <span className={'tag ' + a.tipo}>{a.tipo}</span>
                        </button>
                        <div className="det" id={'det-' + id}>
                          <div>
                            <div className="det-in">
                              <p>{a.que}</p>
                              <dl className="kv"><dt>Con quién</dt><dd>{a.con}</dd><dt>Qué deja</dt><dd>{a.deja}</dd></dl>
                              {a.link && <Link href={ENLACES[a.link[0]]}>{a.link[1]} →</Link>}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <div className="res"><p className="rot">Resultado</p><p>{f.resultado}</p></div>
              </section>
            );
          })}
        </div>

        <div className="retorno" aria-hidden="true"><span>Proceso recursivo: lo que se valida regresa a la indagación y al prototipo</span></div>

        <div className="trans">
          <div className="lg">
            <p className="rot">Transversal · Plataforma web</p>
            <p>Memoria viva del proceso: cada actividad deja un artefacto digital navegable que sirve de análisis, registro y evidencia.</p>
          </div>
          <div className="lg">
            <p className="rot">Transversal · Marco ético</p>
            <p>Consentimiento informado, identidad flexible (nombre, seudónimo o código), lenguaje no clínico y devolución de los resultados a los participantes.</p>
          </div>
        </div>

        <div className="figura lg">
          <a href={pub('/Recursos/ruta-metodologica.png')} target="_blank" rel="noopener">
            <img src={pub('/Recursos/ruta-metodologica.svg')} alt="Esquema de la ruta metodológica: tres columnas con las fases de Cartografía, Prototipado y Validación, sus propósitos, actividades y resultados." loading="lazy" width="1600" height="1078" />
          </a>
          <div>
            <p className="rot">Versión para el documento</p>
            <h2>El mismo recorrido, en una sola figura</h2>
            <p>Esquema estático para el documento. La versión detallada describe cada actividad; la esquemática, más legible a tamaño de página, es la que va montada en el apartado de ruta metodológica.</p>
            <div className="dl">
              {['svg', 'png', 'pdf'].map(x => <a className="btn-pill" key={x} href={pub('/Recursos/ruta-metodologica.' + x)} download>{x.toUpperCase()}</a>)}
              {['svg', 'png'].map(x => <a className="btn-pill" key={'e' + x} href={pub('/Recursos/ruta-metodologica-esquema.' + x)} download>Esquema {x.toUpperCase()}</a>)}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
