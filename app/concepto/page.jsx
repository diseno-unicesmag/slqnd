import Footer from '@/components/Footer';
import { Flecha } from '@/components/Iconos';
import { pub } from '@/lib/base';

export const metadata = {
  title: 'Concepto de diseño',
  description: 'El concepto de diseño del proyecto en tres ideas encadenadas: silencio, metáfora y revelación.',
};

const CADENA = [
  ['Silencio', 'Lo que existe y se calla.', 'Violeta profundo, penumbra y vidrio esmerilado: se intuye, no se ve.'],
  ['Metáfora', 'La figura que carga el silencio sin decirlo en primera persona.', 'La obra física: formas orgánicas y el trazo propio de cada creador.'],
  ['Revelación', 'Lo que la Realidad Aumentada hace con la metáfora: dejar ver lo que guardaba.', 'Dorado y luz, la lente, animación y sonido que se despliegan.'],
];

export default function Pagina() {
  return (
    <main className="match-wrap">
      <header className="cab-simple">
        <span className="badge-live"><i />Concepto de diseño · MetafoRA</span>
        <h1>El silencio toma forma en una <em>metáfora</em></h1>
        <p>Y la Realidad Aumentada la revela. Tres ideas encadenadas ordenan el proyecto, de lo que se calla a lo que se deja ver.</p>
      </header>

      <div className="concepto-cadena">
        {CADENA.map(([n, que, ve], i) => (
          <div className="concepto-paso lg reveal" key={n}>
            <span className="match-rot">{i + 1} de 3</span>
            <h2>{n}</h2>
            <p>{que}</p>
            <p className="concepto-ve"><b>Cómo se ve.</b> {ve}</p>
            {i < 2 && <span className="concepto-flecha" aria-hidden="true"><Flecha /></span>}
          </div>
        ))}
      </div>

      <figure className="concepto-mapa lg reveal">
        <a href={pub('/Recursos/concepto-diseno.png')} target="_blank" rel="noopener">
          <img src={pub('/Recursos/concepto-diseno.svg')} width="2000" height="1230" loading="lazy"
            alt="Mapa mental del concepto de diseño. Al centro: el silencio toma forma en una metáfora, y la Realidad Aumentada la revela. De ahí salen tres ramas, silencio, metáfora y revelación, cada una con qué es, de dónde viene y cómo se ve." />
        </a>
        <figcaption>
          <span>Mapa mental del concepto, con sus referentes y decisiones visuales.</span>
          <span className="dl">
            {['svg', 'png', 'pdf'].map(x => <a className="btn-pill" key={x} href={pub('/Recursos/concepto-diseno.' + x)} download>{x.toUpperCase()}</a>)}
          </span>
        </figcaption>
      </figure>

      <Footer />
    </main>
  );
}
