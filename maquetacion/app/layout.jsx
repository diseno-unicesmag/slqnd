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
        <link rel="stylesheet" href={pub('/estilos/libro.css')} />
      </head>
      <body>{children}</body>
    </html>
  );
}
