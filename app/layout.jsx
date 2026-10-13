import { Inter, Onest } from 'next/font/google';
import './estilos/base.css';
import './estilos/glass.css';
import Nav from '@/components/Nav';
import GlassRuntime from '@/components/GlassRuntime';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const onest = Onest({ subsets: ['latin'], variable: '--font-onest', display: 'swap' });

export const metadata = {
  title: { default: 'Sobre lo que no digo — Proyecto de Grado', template: '%s — Sobre lo que no digo' },
  description: 'Estrategia de diseño participativo para fomentar la elaboración emocional en jóvenes universitarios mediante una experiencia phygital: obras conceptuales y Realidad Aumentada.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${onest.variable}`} suppressHydrationWarning>
      <head>
        {/* Marca que hay JS antes de pintar, para que las apariciones al hacer scroll no parpadeen */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <Nav />
        {children}
        <GlassRuntime />
      </body>
    </html>
  );
}
