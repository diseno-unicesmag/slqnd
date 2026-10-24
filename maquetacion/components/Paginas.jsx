'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Documento from './Documento';
import { cssVarsTexto, urlFuentes } from '@/lib/doc';
import { pub } from '@/lib/base';

/* Reglas de página para Paged.js. Van como texto porque @page no acepta variables CSS. */
function reglasPagina(e) {
  return `
@page { size: 215.9mm 279.4mm; margin: ${e.margenSup}cm ${e.margenExt}cm ${e.margenInf}cm ${e.margenInt}cm;
  @bottom-center { content: counter(page); font-family: '${e.fuenteTitulos}', sans-serif; font-size: 8.5pt; color: #7c7690; letter-spacing: .06em; }
  ${e.cabecera ? `@top-right { content: string(capitulo); font-family: '${e.fuenteTitulos}', sans-serif; font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: #9b93b8; }` : ''}
}
@page :left { margin-left: ${e.margenExt}cm; margin-right: ${e.margenInt}cm; }
@page :right { margin-left: ${e.margenInt}cm; margin-right: ${e.margenExt}cm; }
@page oscura { margin: 0; background: ${e.fondoOscuro}; @bottom-center { content: none; } @top-right { content: none; } }
@page :first { margin: 0; background: ${e.fondoOscuro}; @bottom-center { content: none; } @top-right { content: none; } }
.libro .sec-apertura { page: oscura; }
.libro .sec-portada, .libro .sec-apertura { height: 279.4mm; box-sizing: border-box; }
.libro .seccion { break-before: page; }
.libro .seccion:first-child { break-before: auto; }
.libro .sec-portadilla { min-height: 100%; }
.libro .cab-cap { string-set: capitulo content(text); position: absolute; visibility: hidden; height: 0; overflow: hidden; }
html, body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media screen {
  body { background: #1a1730; }
  .pagedjs_pages { display: flex; flex-wrap: wrap; justify-content: center; gap: 28px; padding: 28px 0 80px; }
  .pagedjs_page { background: #fff; box-shadow: 0 0 0 1px rgba(255,255,255,.06), 0 18px 50px rgba(0,0,0,.45); border-radius: 2px; }
}
`;
}

const Paginas = forwardRef(function Paginas({ doc, resolver }, ref) {
  const marco = useRef(null);
  const [estado, setEstado] = useState('Componiendo páginas…');

  useImperativeHandle(ref, () => ({ imprimir: () => marco.current?.contentWindow?.print() }));

  useEffect(() => {
    setEstado('Componiendo páginas…');
    const origen = location.origin;
    const absoluto = src => { const u = resolver(src); return u.startsWith('http') || u.startsWith('data:') || u.startsWith('blob:') ? u : origen + u; };
    const cuerpo = renderToStaticMarkup(<Documento doc={doc} editable={false} resolver={absoluto} paraImprimir />);
    const e = doc.estilo;
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<link rel="stylesheet" href="${urlFuentes(e)}">
<link rel="stylesheet" href="${origen}${pub('/estilos/libro.css')}">
<style>:root{${cssVarsTexto(e)}}${reglasPagina(e)}</style>
<script>window.PagedConfig = { auto: false };</script>
<script src="${origen}${pub('/vendor/paged.polyfill.min.js')}"></script>
<script>window.addEventListener('load', () => document.fonts.ready.then(() => window.PagedPolyfill.preview()).then(f => parent.postMessage({ paginas: f.total }, '*')).catch(e => parent.postMessage({ paginas: null, error: String(e) }, '*')));</script>
</head><body><div class="libro" style="${cssVarsTexto(e)}">${cuerpo}</div></body></html>`;
    const f = marco.current; f.srcdoc = html;
    const oir = ev => { if (ev.source !== f.contentWindow) return; setEstado(ev.data?.error ? 'Error al componer: ' + ev.data.error : ev.data.paginas + ' páginas'); };
    window.addEventListener('message', oir);
    return () => window.removeEventListener('message', oir);
  }, [doc, resolver]);

  return (
    <div className="paginas">
      <div className="paginas-estado lg">{estado}</div>
      <iframe ref={marco} title="Vista de páginas" className="paginas-marco" />
    </div>
  );
});

export default Paginas;
