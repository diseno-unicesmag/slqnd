import './estilos/editor.css';
import { pub } from '@/lib/base';

export const metadata = {
  title: 'Maquetación — Sobre lo que no digo',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&family=Montserrat:ital,wght@0,400..900;1,400..900&display=swap" />
        <link rel="stylesheet" href={pub('/estilos/libro.css')} />
        <link rel="stylesheet" href={pub('/estilos/pliegos.css')} />
      </head>
      <body>{children}</body>
    </html>
  );
}
