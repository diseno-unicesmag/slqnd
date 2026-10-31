// Exporta la maquetación publicada a un PDF de pliegos (17 × 11 in) con el cristal líquido visible.
// El cristal es un filtro del navegador (backdrop-filter) que la impresión a PDF descarta; por eso,
// antes de imprimir, cada pieza de cristal se fotografía en pantalla a alta resolución y esa imagen
// la reemplaza en su mismo lugar. El texto y las imágenes siguen siendo vectores y originales.
//
// Uso: node herramientas/exportar-pdf.mjs <url de la maquetación> <salida.pdf>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const [url = 'http://localhost:8790/', salida = 'SLQND-maquetacion.pdf'] = process.argv.slice(2);
const ESCALA = 4;   // 96 px/in × 4 ≈ 384 ppp para cada pieza de cristal

const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: ESCALA });
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
  const r = await p.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left, y: b.top, width: b.width, height: b.height }; }, sel);
  const foto = await p.screenshot({ clip: r, type: 'jpeg', quality: 92 });
  await p.evaluate(([s, datos]) => {
    const e = document.querySelector(s), im = document.createElement('img');
    im.src = 'data:image/jpeg;base64,' + datos;
    im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border-radius:inherit;pointer-events:none;z-index:1';
    // Lo que tenía dentro (texto de una cápsula) ya está en la foto
    [...e.children].forEach(c => { c.style.visibility = 'hidden'; });
    e.style.backdropFilter = 'none'; e.style.webkitBackdropFilter = 'none'; e.style.background = 'transparent';
    if (getComputedStyle(e).position === 'static') e.style.position = 'relative';
    e.appendChild(im);
  }, [sel, foto.toString('base64')]);
}
await p.evaluate(() => Promise.all([...document.querySelectorAll('[data-cristal] > img')].map(im => im.decode().catch(() => 0))));

await p.emulateMedia({ media: 'print' });
await p.pdf({ path: salida, width: '17in', height: '11in', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await nav.close();
console.log(`PDF listo: ${salida} (${n} piezas de cristal fotografiadas)`);
