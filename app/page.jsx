import Link from 'next/link';
import './estilos/inicio.css';
import Lente from '@/components/Lente';
import Footer from '@/components/Footer';
import { Flecha, FlechaDiag, ICONOS } from '@/components/Iconos';
import { FASES } from '@/data/ruta';

const CIFRAS = [
  ['15', ' de 15', 'siguen trabajando en casa por la noche; nadie logra desconectarse.'],
  ['4,07', ' / 5', 'de autoexigencia promedio. Siete se describen como «mi peor enemigo».'],
  ['14', ' de 15', <>nunca habían oído la palabra <em>burnout</em>, y 13 dicen haberlo vivido.</>],
  ['8', ' de 15', 'casi nunca hablan de su agotamiento o prefieren guardárselo.'],
];
const PASOS = [
  ['Un creador calla algo', 'En un taller de cocreación convierte ese silencio en una metáfora visual.'],
  ['La obra lo guarda', 'La pieza física porta el mensaje visible, sin tener que decirlo con palabras directas.'],
  ['MetafoRA lo revela', 'Al escanearla, la capa de Realidad Aumentada despliega la animación y el sonido que completan el mensaje.'],
  ['Un lector se reconoce', 'Descubre en la obra de otro el reflejo de lo que también calla. No está solo.'],
];
const RESUMEN = [
  'Identificar patrones de causas, dinámicas y consecuencias en las vivencias silenciadas.',
  'Diseñar la estrategia: talleres de cocreación artística y experiencia phygital interactiva.',
  'Evaluar la incidencia en la elaboración emocional de creadores y lectores.',
];
const BENTO = [
  ['/cdps/', 'cdps', 'CDPS', 'Cartografía Digital de Percepción Silenciosa: la encuesta viva donde el grupo vota de forma anónima y lee su propio mapa de calor.', true],
  ['/cadena-valor/', 'cadena', 'Cadena de valor', 'Red de conceptos y autores que sostienen el proyecto.'],
  ['/match-creativo/', 'match', 'Match creativo', 'La matriz que descartó las soluciones convencionales.'],
  ['/lluvia-ideas/', 'lluvia', 'Lluvia de ideas', 'Cinco industrias creativas cruzadas con el proyecto.'],
  ['/ruta-metodologica/', 'ruta', 'Ruta metodológica', 'El recorrido completo, fase por fase.'],
];
const FICHA = [
  ['Autor', 'Shamuel Woodcock Salomón'], ['Asesor', 'Edward Mauricio Montenegro Córdoba'], ['Modalidad', 'Investigación-Creación'],
  ['Programa', 'Diseño Gráfico · Universidad CESMAG'], ['Línea de investigación', 'Diseño, innovación, cultura y sociedad'], ['Lugar', 'San Juan de Pasto · 2026'],
];
const D = ['', ' d1', ' d2', ' d3'];

export default function Inicio() {
  return (
    <div className="pg-inicio"><main className="wrap">
      <header className="hero">
        <div>
          <span className="badge-live"><i />Proyecto de grado · Investigación-Creación</span>
          <h1>Sobre lo que <em>no digo</em></h1>
          <p className="sub">Una estrategia de diseño participativo para fomentar la elaboración emocional en jóvenes universitarios. Obras conceptuales que guardan lo que se calla, y una capa de Realidad Aumentada que lo revela.</p>
          <div className="cta">
            <Link className="btn-pill primary" href="/ruta-metodologica/">Recorrer la ruta metodológica <Flecha /></Link>
            <a className="btn-pill" href="#como-funciona">Cómo funciona</a>
          </div>
        </div>
        <Lente />
      </header>

      <section className="sec">
        <p className="kicker reveal">Lo que encontró la indagación</p>
        <h2 className="reveal">No les falta el malestar. Les faltan canales para nombrarlo.</h2>
        <p className="lead reveal">Quince estudiantes de Diseño Gráfico respondieron de forma anónima una cartografía digital de su vida académica.</p>
        <div className="cifras">
          {CIFRAS.map(([n, de, texto], i) => (
            <div className={'cifra lg reveal' + D[i]} key={n + de}><b>{n}<small>{de}</small></b><span>{texto}</span></div>
          ))}
        </div>
        <p className="fuente reveal">CDPS · 24 de abril de 2026 · Universidad CESMAG · resultados exploratorios. <Link href="/cdps/" style={{ color: 'var(--accent)' }}>Ver los resultados</Link></p>
      </section>

      <section className="sec">
        <div className="proposito lg reveal">
          <p className="kicker">Propósito general</p>
          <p>Diseñar una estrategia de diseño participativo para fomentar la <mark>elaboración emocional</mark> en jóvenes universitarios de 18 a 25 años en San Juan de Pasto mediante una <mark>experiencia phygital</mark>.</p>
        </div>
      </section>

      <section className="sec" id="como-funciona">
        <p className="kicker reveal">El ecosistema phygital</p>
        <h2 className="reveal">La Realidad Aumentada no añade: revela.</h2>
        <p className="lead reveal">Dos actores, creadores y lectores, se encuentran a través de una obra física y de MetafoRA, la aplicación que actúa como lente.</p>
        <div className="pasos">
          {PASOS.map(([t, d], i) => <div className={'paso lg reveal' + D[i]} key={t}><h3>{t}</h3><p>{d}</p></div>)}
        </div>
      </section>

      <section className="sec">
        <p className="kicker reveal">Ruta metodológica · procedimiento de las 3i</p>
        <h2 className="reveal">Indagar, idear, implementar.</h2>
        <p className="lead reveal">Tres fases, cada una con su propósito, sus actividades y su resultado.</p>
        <div className="fases">
          {FASES.map((f, i) => {
            const hechas = f.acts.filter(a => a.ok).length;
            return (
              <Link className={'fase lg reveal' + D[i]} href="/ruta-metodologica/" key={f.fase}>
                <span className="i">{i + 1} · {f.i.toUpperCase()}</span><h3>{f.fase}</h3>
                <p>{RESUMEN[i]}</p>
                <div className="prog"><div><span style={{ width: (hechas / f.acts.length * 100) + '%' }} /></div>{f.estado} · {hechas}/{f.acts.length}</div>
              </Link>
            );
          })}
        </div>
        <Link className="btn-pill reveal" href="/ruta-metodologica/">Ver la ruta completa <Flecha /></Link>
      </section>

      <section className="sec">
        <p className="kicker reveal">Memoria viva del proceso</p>
        <h2 className="reveal">Cada actividad dejó un artefacto navegable.</h2>
        <div className="bento" style={{ marginTop: 36 }}>
          {BENTO.map(([href, icono, titulo, texto, ancho], i) => (
            <Link className={'bento-card lg reveal' + (ancho ? ' span-2' : '') + D[i % 3]} href={href} key={href}>
              <div className="bento-top"><span className="bento-icon">{ICONOS[icono]}</span><span className="bento-arrow"><FlechaDiag /></span></div>
              <div><h3>{titulo}</h3><p>{texto}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="sec">
        <p className="kicker reveal">Ficha del proyecto</p>
        <dl className="ficha lg reveal">
          {FICHA.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </section>

      <Footer />
    </main></div>
  );
}
