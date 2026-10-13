import Footer from '@/components/Footer';
import { Descarga, Flecha } from '@/components/Iconos';
import { MATCH, FASE } from '@/data/match';
import { pub } from '@/lib/base';

export const metadata = {
  title: 'Match creativo',
  description: 'Contraposición entre los productos académicos genéricos y las propuestas del proyecto.',
};

export default function Pagina() {
  const fases = Object.keys(FASE).map(k => ({ k, items: MATCH.filter(m => m.fase === k) })).filter(g => g.items.length);
  return (
    <main className="match-wrap">
      <header className="cab-simple">
        <span className="badge-live"><i />Match creativo · Propuesta de productos</span>
        <h1>De lo genérico a <em>lo propio</em></h1>
        <p>Cada producto académico convencional, frente a la resolución interactiva que el proyecto propuso en su lugar.</p>
        <p className="nota-version">Ejercicio de clase de la Fase 1. Conserva la formulación con la que se hizo, anterior a la versión actual del proyecto.</p>
        <a className="btn-pill" href={pub('/Recursos/Match Creativo.xlsx')} download><Descarga />Descargar la matriz en Excel</a>
      </header>
      {fases.map(g => (
        <section key={g.k}>
          <div className="match-fase reveal"><span>{FASE[g.k][0]}</span><h2>{FASE[g.k][1]}</h2></div>
          {g.items.map(m => (
            <div className="match-par reveal" key={m.cliche}>
              <div className="match-de"><span className="match-rot">Producto genérico</span><h3>{m.cliche}</h3><p>{m.porque}</p></div>
              <div className="match-flecha"><Flecha /></div>
              <div className="match-a lg"><span className="match-rot">Propuesta</span><h3>{m.innovador}</h3><p>{m.desc}</p></div>
            </div>
          ))}
        </section>
      ))}
      <Footer />
    </main>
  );
}
