'use client';

import { useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer';
import { Flecha } from '@/components/Iconos';
import { CDPS } from '@/data/cdps';
import { CLAVE } from '@/data/acceso';
import { pub } from '@/lib/base';

const N = CDPS.n;
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
const pct = n => Math.round((n / N) * 100);
const coma = x => String(x).replace('.', ',');
const pregunta = id => CDPS.preguntas.find(p => p.id === id);
const votos = (id, ...ops) => pregunta(id).opciones.filter(o => ops.includes(o.id)).reduce((s, o) => s + o.n, 0);

const DESCRIPCION = {
  'Tu vida académica': 'Cuánto tiempo ocupa la carrera y cómo se vive.',
  'Tu exigencia': 'La relación de cada estudiante consigo mismo.',
  'Burnout': 'Qué tanto se conoce la palabra y qué tanto se ha vivido.',
  'Apoyo': 'Con quién se habla y a quién se acude.',
  'Identificación': 'Con qué mandatos de la hiperexigencia se reconocen.',
  'Cartografía': 'De dónde viene la presión, cuándo aprieta y qué deja.',
};
const BLOQUES = [...new Set(CDPS.preguntas.filter(p => p.opciones).map(p => p.bloque))];
const SECCIONES = [...BLOQUES, 'Lo que no digo', 'Perfil'];
const ABIERTAS = ['P19', 'P20'].map(pregunta).filter(p => p && p.textos.length);
const P0 = pregunta('P0');
// La paradoja del burnout: quién conocía el término frente a quién dice haberlo vivido.
const noConoce = votos('P8', 'c'), loVivio = votos('P9', 'a', 'c');

function Puntos({ n }) {
  return <div className="puntos" aria-hidden="true">{Array.from({ length: N }, (_, i) => <i key={i} className={i < n ? 's' : ''} />)}</div>;
}

function Barras({ datos, registro }) {
  const max = Math.max(...datos.map(d => d.n));
  return datos.map(d => (
    <div className={'fila' + (d.n === max && max > 0 ? ' top' : '') + (d.n === 0 ? ' cero' : '')} key={d.id || d.label}>
      <span>{registro === 'acad' && d.acad ? d.acad : d.label}</span>
      <b>{d.n}<small>{pct(d.n)} %</small></b>
      <div className="pista"><i style={{ width: (d.n / N) * 100 + '%' }} /></div>
    </div>
  ));
}

function Pregunta({ p, registro }) {
  return (
    <article className="q lg">
      <div className="q-id"><span>{p.id}</span>{p.media != null && <em>Media {coma(p.media)} / 5</em>}</div>
      <h3>{registro === 'acad' ? p.texto : p.jovial}</h3>
      <Barras datos={p.opciones} registro={registro} />
      <p className="nota-q">
        {p.tipo === 'multiple' ? `Selección múltiple: ${p.respuestas} marcas. El porcentaje es sobre los ${N} participantes.` : p.respuestas < N ? `Respondieron ${p.respuestas} de ${N}.` : `Respondieron los ${N} participantes.`}
      </p>
    </article>
  );
}

function Acceso({ cerrar }) {
  const [valor, setValor] = useState('');
  const [estado, setEstado] = useState('pedir');
  const input = useRef(null);
  useEffect(() => {
    input.current?.focus();
    const esc = e => { if (e.key === 'Escape') cerrar(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [cerrar]);
  const base = pub('/instrumentos/cdps/');
  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) cerrar(); }}>
      <div className="modal-caja lg-r" role="dialog" aria-modal="true" aria-label="Acceso al aplicativo CDPS">
        <button type="button" className="cerrar" onClick={cerrar} aria-label="Cerrar">×</button>
        <h2>Aplicativo CDPS</h2>
        {estado !== 'dentro' ? (
          <form onSubmit={e => { e.preventDefault(); setEstado(valor === CLAVE ? 'dentro' : 'error'); }}>
            <p>Ingresa la contraseña para abrir el instrumento.</p>
            <input ref={input} type="password" value={valor} onChange={e => setValor(e.target.value)} placeholder="Contraseña" aria-label="Contraseña" />
            {estado === 'error' && <p className="error">Contraseña incorrecta.</p>}
            <button type="submit" className="btn-pill primary">Acceder</button>
          </form>
        ) : (
          <div className="accesos">
            <a href={base + 'index.html'}>Usuario<small>Vista del participante</small></a>
            <a href={base + 'viewer.html'}>Visualizador<small>Proyección en sala</small></a>
            <a href={base + 'panel.html'}>Panel<small>Panel del investigador</small></a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Cdps() {
  const [registro, setRegistro] = useState('jovial');
  const [activo, setActivo] = useState(slug(SECCIONES[0]));
  const [modal, setModal] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(en => { en.forEach(e => { if (e.isIntersecting) setActivo(e.target.id); }); }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('.pg-cdps .bloque').forEach(s => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <div className="pg-cdps">
      <main className="wrap">
        <header className="cab">
          <div>
            <span className="badge-live"><i />Instrumento de indagación · Fase 1</span>
            <h1>Cartografía Digital de <em>Percepción Silenciosa</em></h1>
            <p>Una encuesta viva: cada estudiante vota de forma anónima moviendo un avatar sobre un lienzo compartido, y el grupo lee en vivo su propio mapa de calor. Estos son los resultados de la sesión.</p>
            <div className="acciones">
              <a className="btn-pill primary" href={pub('/instrumentos/cdps/infografia.html')}>Ver la infografía <Flecha /></a>
              <button type="button" className="btn-pill" onClick={() => setModal(true)}>Abrir el aplicativo</button>
            </div>
          </div>
          <dl className="ficha lg">
            <div><dt>Sesión</dt><dd>{CDPS.fecha}</dd></div>
            <div><dt>Lugar</dt><dd>{CDPS.lugar}</dd></div>
            <div><dt>Participantes</dt><dd>{N} estudiantes de Diseño Gráfico</dd></div>
            <div><dt>Instrumento</dt><dd>{CDPS.preguntas.length} preguntas en {new Set(CDPS.preguntas.map(p => p.bloque)).size} bloques</dd></div>
          </dl>
        </header>

        <p className="rot">El hallazgo central</p>
        <div className="paradoja">
          <div className="lado lg reveal">
            <b>{noConoce}<small> de {N}</small></b>
            <p>nunca habían escuchado la palabra <em>burnout</em>.</p>
            <Puntos n={noConoce} />
          </div>
          <div className="frente">y sin embargo</div>
          <div className="lado vive lg reveal d1">
            <b>{loVivio}<small> de {N}</small></b>
            <p>dicen haberlo vivido, sin duda o en picos de estrés.</p>
            <Puntos n={loVivio} />
          </div>
        </div>

        <div className="barra lg-r" data-lg-depth="6" data-lg-strength="50" data-lg-blur="6">
          <div className="bloques" role="navigation" aria-label="Bloques del instrumento">
            {SECCIONES.map(b => <a key={b} href={'#' + slug(b)} className={activo === slug(b) ? 'activo' : undefined}>{b}</a>)}
          </div>
          <div className="registro" role="group" aria-label="Registro del lenguaje">
            <button type="button" aria-pressed={registro === 'jovial'} onClick={() => setRegistro('jovial')}>Como se preguntó</button>
            <button type="button" aria-pressed={registro === 'acad'} onClick={() => setRegistro('acad')}>Académico</button>
          </div>
        </div>

        {BLOQUES.map(b => (
          <section className="bloque" id={slug(b)} key={b}>
            <h2>{b}</h2>
            <p>{DESCRIPCION[b]}</p>
            <div className="preguntas">
              {CDPS.preguntas.filter(p => p.bloque === b && p.opciones).map(p => <Pregunta key={p.id} p={p} registro={registro} />)}
            </div>
          </section>
        ))}

        <section className="bloque" id={slug('Lo que no digo')}>
          <h2>Lo que no digo</h2>
          <p>Respuestas abiertas, tal como se escribieron. Se muestran en orden alfabético, sin vínculo con quien las escribió.</p>
          {ABIERTAS.map(p => (
            <div className="abierta" key={p.id}>
              <h3>{registro === 'acad' ? p.texto : p.jovial}</h3>
              <p>{p.id} · {p.textos.length} respuestas</p>
              <div className="citas">{p.textos.map((t, i) => <blockquote className="lg" key={i}>{t}</blockquote>)}</div>
            </div>
          ))}
          {P0 && (
            <div className="abierta">
              <h3>{registro === 'acad' ? P0.texto : P0.jovial}</h3>
              <p>{P0.id} · rompehielo · {P0.textos.length} frases</p>
              <div className="nube">{P0.textos.map((t, i) => <span key={i}>{t}</span>)}</div>
            </div>
          )}
        </section>

        <section className="bloque" id={slug('Perfil')}>
          <h2>Perfil</h2>
          <p>Quiénes respondieron, en datos agrupados.</p>
          <div className="perfil">
            {CDPS.perfil.map(g => (
              <article className="q lg" key={g.titulo}><h3>{g.titulo}</h3><Barras datos={g.datos} registro="jovial" /></article>
            ))}
          </div>
          <p className="aviso">Resultados exploratorios de una sola sesión con {N} participantes; describen a este grupo y no se generalizan. La página muestra únicamente datos agregados.</p>
        </section>

        <Footer />
      </main>
      {modal && <Acceso cerrar={() => setModal(false)} />}
    </div>
  );
}
