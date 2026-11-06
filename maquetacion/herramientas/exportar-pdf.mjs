// Exporta la maquetación publicada a un PDF de pliegos (17 × 11 in) con el cristal líquido visible.
// El cristal es un filtro del navegador (backdrop-filter) que la impresión a PDF descarta; por eso,
// antes de imprimir, cada pieza de cristal se fotografía en pantalla a alta resolución y esa imagen
// la reemplaza en su mismo lugar. El texto y las imágenes siguen siendo vectores y originales.
//
// Uso: node herramientas/exportar-pdf.mjs <url de la maquetación> <salida.pdf> [--pliegos]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const [url = 'http://localhost:8790/', salida = 'SLQND-maquetacion.pdf'] = process.argv.slice(2);
const ESCALA = 4;   // 96 px/in × 4 ≈ 384 ppp para cada pieza de cristal

const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 2400, height: 1400 }, deviceScaleFactor: ESCALA });
await p.goto(url, { waitUntil: 'load' });
await p.waitForFunction(() => /pliegos$|Error/.test(document.querySelector('.pliegos-estado')?.textContent || ''), null, { timeout: 300000 });
const estado = await p.textContent('.pliegos-estado');
if (/Error/.test(estado)) throw new Error(estado);
await p.evaluate(() => { document.querySelector('.lista-pliegos').style.zoom = 1; });
// Todas las imágenes del visor cargadas antes de fotografiar o imprimir
await p.evaluate(() => Promise.all([...document.querySelectorAll('.lista-pliegos img')].map(im => im.complete ? 0 : new Promise(ok => { im.onload = im.onerror = ok; }))));
await p.waitForTimeout(800);

// Piezas con filtro de fondo (cristal, lentes, cápsulas)
const n = await p.evaluate(() => {
  const els = [...document.querySelectorAll('.lista-pliegos *')].filter(e => { const f = getComputedStyle(e).backdropFilter; return f && f !== 'none'; });
  els.forEach((e, k) => { e.dataset.cristal = k; });
  return els.length;
});
for (let k = 0; k < n; k++) {
  const sel = `[data-cristal="${k}"]`;
  await p.locator(sel).scrollIntoViewIfNeeded();
  await p.waitForTimeout(60);
  // Se fotografía con margen: el cristal desplaza píxeles de su alrededor, y si la toma se recorta
  // al borde exacto, lo que queda fuera sale negro (la «barra negra» de las lentes)
  const r = await p.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left, y: b.top, width: b.width, height: b.height }; }, sel);
  const M = 48, cx = Math.max(0, r.x - M), cy = Math.max(0, r.y - M);
  const clip = { x: cx, y: cy, width: r.width + (r.x - cx) + M, height: r.height + (r.y - cy) + M };
  const foto = await p.screenshot({ clip, type: 'png' });
  const off = { l: r.x - cx, t: r.y - cy, w: clip.width, h: clip.height };
  await p.evaluate(([s, datos, off]) => {
    const e = document.querySelector(s), im = document.createElement('img');
    im.src = 'data:image/png;base64,' + datos;
    im.style.cssText = `position:absolute;left:${-off.l}px;top:${-off.t}px;width:${off.w}px;height:${off.h}px;max-width:none;pointer-events:none;z-index:1`;
    e.style.overflow = 'hidden'; e.style.filter = 'none';
    // Lo que tenía dentro (texto de una cápsula) ya está en la foto
    [...e.children].forEach(c => { c.style.visibility = 'hidden'; });
    e.style.backdropFilter = 'none'; e.style.webkitBackdropFilter = 'none'; e.style.background = 'transparent';
    if (getComputedStyle(e).position === 'static') e.style.position = 'relative';
    e.appendChild(im);
  }, [sel, foto.toString('base64'), off]);
}
await p.evaluate(() => Promise.all([...document.querySelectorAll('[data-cristal] > img')].map(im => im.decode().catch(() => 0))));

await p.emulateMedia({ media: 'print' });
// Página por página (carta), empezando por la portada sola; con --pliegos, por pliegos de 17 × 11 in
const porPliegos = process.argv.includes('--pliegos');
if (!porPliegos) await p.addStyleTag({ content: `@media print { @page { size: 8.5in 11in; margin: 0; }
  .lista-pliegos .pliego { display: contents !important; }
  .lista-pliegos .pliego::after, .lista-pliegos .pliego::before { display: none !important; }
  .lista-pliegos .pag { break-after: page; position: relative !important; overflow: hidden !important; }
  .lista-pliegos .pag.vacia { display: none !important; }  }` });
// Por pliegos: la portada va sola en una hoja carta y el lomo se marca con una línea que se ve
// sobre cualquier fondo (claro, oscuro o foto), para que se lea como maquetación a doble página
if (porPliegos) await p.addStyleTag({ content: `@media print { @page { size: 17in 11in; margin: 0; }
  @page portada { size: 8.5in 11in; margin: 0; }
  .lista-pliegos .pliego.solo-der { page: portada; width: 8.5in !important; }
  .lista-pliegos .pliego.solo-der > .pag.vacia { display: none !important; }
  .lista-pliegos .pliego.solo-der::after, .lista-pliegos .pliego.solo-der::before { display: none !important; }
  .lista-pliegos .pliego:not(.solo-der)::after { background: rgba(140, 140, 150, 0.6) !important; width: 1px !important; box-shadow: none !important; } }` });
// La última página no fuerza salto: así no sale una hoja en blanco de más al final
if (!porPliegos) await p.evaluate(() => { const ps = document.querySelectorAll('.lista-pliegos .pag:not(.vacia)'); const ultima = ps[ps.length - 1]; if (ultima) ultima.style.breakAfter = 'auto'; });
await p.pdf({ path: salida, width: porPliegos ? '17in' : '8.5in', height: '11in', printBackground: true, preferCSSPageSize: porPliegos, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await nav.close();
console.log(`PDF listo: ${salida} (${n} piezas de cristal fotografiadas)`);
