'use client';

import { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { FASES } from '@/data/ruta';
import { ICONOS_RUTA } from '@/data/iconosRuta';
import { pub } from '@/lib/base';

const TIPOS = { Todas: 'Todas', Clase: 'Ejercicio de clase', Campo: 'Trabajo de campo', 'Creación': 'Creación' };
const ENLACES = { 'cadena-valor.html': '/cadena-valor/', 'cdps.html': '/cdps/', 'match-creativo.html': '/match-creativo/', 'lluvia-ideas.html': '/lluvia-ideas/' };
const ESTADO = { Completa: 'check', 'En curso': 'curso', 'Por iniciar': 'reloj' };
const todas = FASES.flatMap(f => f.acts);
const hechasTotal = todas.filter(a => a.ok).length;

const Ico = ({ n }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONOS_RUTA[n] }} />
);

export default function Ruta() {
  const [abierta, setAbierta] = useState(null);
  const [filtro, setFiltro] = useState('Todas');

  return (
    <div className="pg-ruta">
      <main className="wrap">
        <header className="cab">
          <div>
            <span className="badge-live"><i />Procedimiento de las 3i</span>
            <h1>Ruta <em>metodológica</em></h1>
            <p>El proyecto avanza en tres momentos: indagar, idear e implementar. Cada tarjeta resume una actividad; ábrela para ver cómo se hizo, con quién y qué dejó.</p>
          </div>
          <div className="avance lg">
            <b>{hechasTotal}<small> de {todas.length}</small></b>
            <span>Actividades realizadas en las tres fases</span>
            <div className="seg">{todas.map((a, i) => <i key={i} className={a.ok ? 'ok' : ''} />)}</div>
          </div>
        </header>

        <div className="barra">
          <div className="chips" role="group" aria-label="Filtrar actividades por tipo">
            {Object.keys(TIPOS).map(k => (
              <button type="button" className="chip" key={k} aria-pressed={filtro === k} onClick={() => setFiltro(k)}>{TIPOS[k]}</button>
            ))}
          </div>
          <div className="leyenda"><span><i><Ico n="check" /></i>Actividad realizada</span><span><i className="p"><Ico n="reloj" /></i>Actividad por realizar</span></div>
        </div>

        <div className="tablero">
          {FASES.map((f, fi) => {
            const hechas = f.acts.filter(a => a.ok).length;
            return (
              <section className="col lg" data-estado={hechas === 0 ? 'pend' : 'ok'} key={f.fase}>
                <div className="fase-cab">
                  <div className="fase-i">
                    <span className="fase-ico"><Ico n={f.icono} /></span>
                    <span className="fase-m">Momento {fi + 1}<b>{f.i}</b></span>
                    <em><Ico n={ESTADO[f.estado]} />{f.estado}</em>
                  </div>
                  <h2>{f.fase}</h2>
                  <p>{f.sub}</p>
                  <p className="fase-f"><Ico n="calendario" />{f.cuando}</p>
                </div>
                <div className="prop"><p className="rot"><Ico n="diana" />Propósito específico {fi + 1}</p><p>{f.proposito}</p></div>
                <ol className="acts">
                  {f.acts.map((a, k) => {
                    const id = fi + '-' + k, esta = abierta === id;
                    return (
                      <li key={id} className={'act' + (a.ok ? '' : ' pend') + (esta ? ' abierta' : '') + (filtro !== 'Todas' && a.tipo !== filtro ? ' dim' : '')}>
                        <button type="button" className="act-b" aria-expanded={esta} aria-controls={'det-' + id} onClick={() => setAbierta(esta ? null : id)}>
                          <span className="dot"><Ico n={a.icono} /></span>
                          <span>
                            <span className="act-t">{a.t}</span>
                            <span className="act-m">{a.resumen}</span>
                          </span>
                          <span className={'tag ' + a.tipo}>{a.tipo}</span>
                        </button>
                        <div className="det" id={'det-' + id}>
                          <div>
                            <div className="det-in">
                              <p>{a.que}</p>
                              <ul className="datos">
                                <li><Ico n="calendario" />{a.cuando}</li>
                                <li><Ico n="personas" />{a.con}</li>
                                <li><Ico n="bandera" />{a.deja}</li>
                              </ul>
                              {a.link && <Link href={ENLACES[a.link[0]]}>{a.link[1]} →</Link>}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <div className="res"><p className="rot"><Ico n="bandera" />Resultado</p><p>{f.resultado}</p></div>
              </section>
            );
          })}
        </div>

        <div className="trans">
          <div className="lg">
            <p className="rot"><Ico n="ciclo" />Proceso recursivo</p>
            <p>Lo que se valida regresa a la indagación y al prototipo.</p>
          </div>
          <div className="lg">
            <p className="rot"><Ico n="globo" />Plataforma web</p>
            <p>Es la memoria viva del proceso: cada actividad deja un artefacto digital que se puede recorrer.</p>
          </div>
          <div className="lg">
            <p className="rot"><Ico n="escudo" />Marco ético</p>
            <p>Consentimiento informado, identidad flexible, lenguaje no clínico y devolución de los resultados a los participantes.</p>
          </div>
        </div>

        <div className="figura lg">
          <a href={pub('/Recursos/ruta-metodologica.png')} target="_blank" rel="noopener">
            <img src={pub('/Recursos/ruta-metodologica.svg')} alt="Figura de la ruta metodológica: tres filas con las fases de Cartografía, Prototipado y Validación; cada una muestra su propósito, sus seis actividades con una frase que las explica y su resultado." loading="lazy" width="1200" height="1516" />
          </a>
          <div>
            <p className="rot">Versión para el documento</p>
            <h2>El mismo recorrido, en una sola figura</h2>
            <p>Es la figura que va montada en el apartado de ruta metodológica del documento. Usa los mismos iconos y las mismas frases que esta página.</p>
            <div className="dl">
              {['svg', 'png', 'pdf'].map(x => <a className="btn-pill" key={x} href={pub('/Recursos/ruta-metodologica.' + x)} download>{x.toUpperCase()}</a>)}
              {['png', 'pdf'].map(x => <a className="btn-pill" key={'v' + x} href={pub('/Recursos/ruta-metodologica-vertical.' + x)} download>En columnas, {x.toUpperCase()}</a>)}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
