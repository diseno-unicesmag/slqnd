import Footer from '@/components/Footer';
import { Flecha } from '@/components/Iconos';
import { pub } from '@/lib/base';
import '../estilos/moodboard.css';

export const metadata = {
  title: 'Concepto de diseño',
  description: 'Concepto de diseño y moodboard del proyecto: silencio, metáfora y revelación, con sus referentes, colores y decisiones visuales.',
};

const img = n => pub('/Recursos/moodboard/' + n + '.jpg');

// Las tres ideas del concepto, tal como quedaron en el mapa mental hecho a mano.
const PILARES = [
  {
    id: 'silencio', n: '01', t: 'Silencio', lema: 'Lo que existe y se calla.',
    es: ['Represión y contención: «me aguanto y sigo».', 'No es vacío ni debilidad: es sensibilidad y humanidad.', 'Miedo, duelo, ansiedad, insomnio, cansancio: lo íntimo y lo privado.'],
    viene: [
      ['El sujeto que se autoexplota', 'Byung-Chul Han'],
      ['8 de 15 estudiantes casi nunca hablan de su agotamiento', 'CDPS'],
      ['«I’m fine». Detrás de la respuesta automática hay algo más', 'We Listen, Samaritans'],
      ['Es más seguro expresarse desde el anonimato', 'Taller «Sobre lo que no dices» y PostSecret'],
      ['Los estándares: lo que la gente espera de ti, lo que tus papás te piden y lo que tú te exiges', 'Mapa mental'],
    ],
    ve: [['Penumbra', 'violeta profundo, negro'], ['Dolor', 'rojo, vino tinto'], ['Vacío', 'transparencia'], ['Silencio', 'invisibilidad, lo oculto'], ['Fragilidad', 'cristal, porcelana, grietas'], ['Sufrimiento', 'oscuridad y poco contraste'], ['Quietud', 'nada se mueve… aún'], ['Tensión', 'difícil de ver, difícil de aceptar']],
    colores: [['#2b1759', 'Penumbra'], ['#120d1f', 'Lo oculto'], ['#7a1a2b', 'Dolor']],
    imgs: [['we-listen', 'We Listen (Samaritans)'], ['postsecret', 'PostSecret'], ['boceto4', 'Boceto del taller']],
  },
  {
    id: 'metafora', n: '02', t: 'Metáfora', lema: 'La figura que carga el silencio.',
    es: ['Decir sin decirlo.', 'Como en las figuras proyectivas: solo su autor puede explicarla, pero todos pueden interpretarla.', 'No hay una sola verdad: hay muchas interpretaciones.', 'Evita la primera persona, lo clínico, la explicación literal y la vergüenza.'],
    viene: [
      ['Nosotros pensamos en metáforas', 'Lakoff y Johnson'],
      ['La máscara libera la expresión', 'Carnaval de Negros y Blancos (Timaran)'],
      ['La grieta no debe ocultarse: debe mostrarse más', 'Kintsugi'],
      ['El dolor dicho desde el humor y la sátira', 'Bojack Horseman'],
      ['La ansiedad convertida en una montaña que se escala', 'Celeste'],
    ],
    ve: [['La obra física', 'impresa, a mano, como sea'], ['Formas orgánicas', 'con todas las libertades'], ['Trazo propio', 'cada creador, su sello'], ['Sin cánones', 'depende de la obra del creador real'], ['Sin límites', 'no hace falta saber dibujar, pero debe significar']],
    cita: ['Lo importante es lo que significa para el autor y que sea hecho con sinceridad.', '¡La verdad duele! Y hace ruido: no tiene que ser bonita.'],
    colores: [['#4a2a96', 'Figura'], ['#f3effb', 'Papel'], ['#8a8597', 'Trazo']],
    imgs: [['obra1', 'Obra piloto 01'], ['celeste', 'Celeste'], ['obra4', 'Obra piloto 04']],
  },
  {
    id: 'revelacion', n: '03', t: 'Revelación', lema: 'Lo que la Realidad Aumentada deja ver.',
    es: ['No añade información: deja ver la que la obra guardaba.', 'El lector la activa al apuntar.', 'El secreto revelado, la penumbra rompiéndose.', 'El candado abierto y el corazón sangrante al aire libre.'],
    viene: [
      ['La capa oculta está dentro de la obra', 'Artivive'],
      ['El sonido envuelve una experiencia emocional', 'Hellblade'],
      ['El espectador decide, en todo sentido', 'Black Mirror: Bandersnatch'],
      ['El diseño es reflexivo e impactante', 'Donald Norman'],
      ['La obra se interpreta de muchas maneras, como reflejo de quien decide visitarla y leerla', 'Figuras proyectivas'],
    ],
    ve: [['La lupa', 'el cristal que enfoca'], ['Luz sobre el violeta', 'amarillo, dorado'], ['Movimiento', 'animación y sonido desplegados'], ['La sorpresa', 'limpieza, color, viveza'], ['Vida', 'lo quieto por fin se mueve']],
    cita: ['La luz de la revelación acentúa la grieta de la metáfora: contrasta de la forma más fuerte posible, rompe la penumbra y brilla sobre la oscuridad.'],
    colores: [['#f5c542', 'Revelación'], ['#e88a7d', 'Lo vivo'], ['#fff6d6', 'Luz']],
    imgs: [['artivive', 'Artivive'], ['hellblade', 'Hellblade'], ['obra2', 'Obra piloto 02']],
  },
];

const PALABRAS = ['Desahogo', 'Resonancia', 'Expresión', 'Verdad', 'Seguridad', 'Descanso', 'Movimiento', 'Volumen', 'Luz', 'Color', 'Impacto', 'Contraste', 'Sonido', 'Estruendo', 'Calma', 'Ruido', 'Reflexión', 'Satisfacción'];
const NO = ['No es obvio', 'No es universal', 'No es literal'];
const NOMBRES = ['El silencio revelado', 'El silencio que se revela', 'La retórica del silencio', 'La metáfora silenciosa', 'El silencio en voz alta'];

export default function Pagina() {
  return (
    <main className="match-wrap mood">
      <header className="cab-simple">
        <span className="badge-live"><i />Concepto de diseño y moodboard</span>
        <h1>El silencio toma forma en una <em>metáfora</em></h1>
        <p>Y la Realidad Aumentada la revela. Tres ideas encadenadas ordenan el proyecto, de lo que se calla a lo que se deja ver: qué es cada una, de dónde viene y cómo se ve.</p>
      </header>

      <div className="concepto-cadena">
        {PILARES.map((p, i) => (
          <a className="concepto-paso lg reveal" href={'#' + p.id} key={p.id}>
            <span className="match-rot">{i + 1} de 3</span>
            <h2>{p.t}</h2>
            <p>{p.lema}</p>
            <span className="mood-mini">{p.colores.map(([c]) => <i key={c} style={{ background: c }} />)}</span>
            {i < 2 && <span className="concepto-flecha" aria-hidden="true"><Flecha /></span>}
          </a>
        ))}
      </div>

      {PILARES.map(p => (
        <section className={'mood-sec mood-' + p.id} id={p.id} key={p.id}>
          <header className="mood-cab">
            <span className="mood-n">{p.n}</span>
            <div><h2>{p.t}</h2><p>{p.lema}</p></div>
            <div className="mood-pal">{p.colores.map(([c, n]) => <span key={c}><i style={{ background: c }} />{n}<small>{c}</small></span>)}</div>
          </header>

          <div className="mood-grid">
            <figure className="mood-img a"><img src={img(p.imgs[0][0])} alt={p.imgs[0][1]} loading="lazy" /><figcaption>{p.imgs[0][1]}</figcaption></figure>

            <div className="mood-card es">
              <h3>Es</h3>
              <ul>{p.es.map(x => <li key={x}>{x}</li>)}</ul>
            </div>

            <div className="mood-card viene">
              <h3>Viene de</h3>
              {p.viene.map(([q, f]) => <blockquote key={q}><p>{q}</p><cite>{f}</cite></blockquote>)}
            </div>

            <figure className="mood-img b"><img src={img(p.imgs[1][0])} alt={p.imgs[1][1]} loading="lazy" /><figcaption>{p.imgs[1][1]}</figcaption></figure>

            <div className="mood-card ve">
              <h3>Se ve</h3>
              <dl>{p.ve.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            </div>

            <figure className="mood-img c"><img src={img(p.imgs[2][0])} alt={p.imgs[2][1]} loading="lazy" /><figcaption>{p.imgs[2][1]}</figcaption></figure>

            {p.cita && <div className="mood-cita">{p.cita.map(c => <p key={c}>«{c}»</p>)}</div>}
          </div>
        </section>
      ))}

      <section className="mood-sec mood-cierre">
        <div className="mood-cierre-in">
          <div>
            <span className="match-rot">Hacia la elaboración emocional</span>
            <h2>Infinitas formas de experimentación visual</h2>
            <p>Fácil de ver, pero puede ser extraño. Es impacto. Lo que la experiencia busca provocar en quien crea y en quien lee:</p>
          </div>
          <div className="mood-pal-final"><i style={{ background: '#2b1759' }} /><i style={{ background: '#f5c542' }} /><span>Violeta y dorado: el silencio y su revelación, uno sobre otro.</span></div>
        </div>
        <div className="mood-nube">
          {PALABRAS.map((w, i) => <span key={w} className={'w' + (i % 4)}>{w}</span>)}
          {NO.map(w => <span key={w} className="no">{w}</span>)}
        </div>
        <div className="mood-nombres">
          <span className="match-rot">Otras formas de nombrar el concepto</span>
          <div>{NOMBRES.map(n => <span key={n}>{n}</span>)}</div>
        </div>
      </section>

      <figure className="concepto-mapa lg reveal">
        <a href={img('mapa')} target="_blank" rel="noopener">
          <img src={img('mapa')} width="1400" height="771" loading="lazy" alt="Fotografía del mapa mental del concepto de diseño, hecho a mano en pliego: silencio, metáfora y revelación, cada uno con lo que es, de dónde viene y cómo se ve." />
        </a>
        <figcaption><span>Mapa mental del concepto de diseño, hecho a mano en pliego. Es la fuente de este moodboard.</span></figcaption>
      </figure>

      <p className="mood-creditos">Las imágenes de referentes pertenecen a sus autores (Samaritans, PostSecret, Maddy Makes Games, Ninja Theory, Artivive) y se usan con fines académicos.</p>

      <Footer />
    </main>
  );
}
