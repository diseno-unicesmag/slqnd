import Footer from '@/components/Footer';
import Lienzo from './Lienzo';
import '../estilos/moodboard.css';

export const metadata = {
  title: 'Concepto de diseño',
  description: 'Moodboard navegable del concepto de diseño: silencio, metáfora y revelación, con sus referentes, notas y colores.',
};

export default function Pagina() {
  return (
    <>
      <main className="mb-pagina">
        <h1 className="sr-only">Concepto de diseño: el silencio toma forma en una metáfora y la Realidad Aumentada la revela</h1>
        <Lienzo />
      </main>
      <div className="match-wrap"><Footer /></div>
    </>
  );
}
