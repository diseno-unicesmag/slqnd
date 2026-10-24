// Exporta la maquetación a InDesign: un .zip con un script (.jsx) que arma el documento con
// estilos de párrafo y carácter, páginas carta enfrentadas, imágenes enlazadas, tablas reales
// y fondos oscuros en portada y aperturas. Todo queda editable en InDesign.
import JSZip from 'jszip';
import { renderToStaticMarkup } from 'react-dom/server';
import Grafico from '@/components/Grafico';
import { secciones } from '@/components/Documento';
import { esCapitulo, partesCapitulo, textoPlano } from '@/lib/doc';

const ESTILO_P = { '': 'Cuerpo', 'sin-sangria': 'Cuerpo sin sangría', centrado: 'Centrado', destacado: 'Destacado', entradilla: 'Entradilla', referencia: 'Referencia', pequeno: 'Pequeño', 'portadilla-titulo': 'Portadilla título', 'portada-titulo': 'Portada título' };

// HTML en línea → tramos con negrita/cursiva/superíndice.
function tramos(html) {
  const out = [], raiz = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html').body.firstChild;
  const andar = (n, f) => {
    if (n.nodeType === 3) { if (n.nodeValue) out.push({ t: n.nodeValue.replace(/\s+/g, ' '), ...f }); return; }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase();
    if (tag === 'br') { out.push({ t: '\n' }); return; }
    const g = { ...f };
    if (tag === 'strong' || tag === 'b') g.b = 1;
    if (tag === 'em' || tag === 'i') g.i = 1;
    if (tag === 'sup') g.s = 1;
    n.childNodes.forEach(c => andar(c, g));
  };
  raiz.childNodes.forEach(c => andar(c, {}));
  if (out.length) { out[0].t = out[0].t.replace(/^ +/, ''); out[out.length - 1].t = out[out.length - 1].t.replace(/ +$/, ''); }
  return out.filter(r => r.t);
}

const CSS_GRAFICO = `.g-cat{font:12px Inter,Arial,sans-serif;fill:#1d1a2e}.g-cat-s{font-size:10.5px;fill:#5d5873}.g-val{font:700 12px Inter,Arial,sans-serif;fill:#7c3aed}.g-pista{fill:rgba(124,58,237,.07)}.g-eje,.g-red{stroke:rgba(29,26,46,.14);fill:none}.g-centro{fill:#fff}.g-total{font:750 26px Inter,Arial,sans-serif;fill:#1d1a2e}`;

async function graficoPNG(chart) {
  let svg = renderToStaticMarkup(<Grafico chart={chart} />);
  svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/(<svg[^>]*>)/, `$1<style>${CSS_GRAFICO}</style>`);
  const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/), w = +vb[1], h = +vb[2], k = 4;
  const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const c = document.createElement('canvas'); c.width = w * k; c.height = h * k;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
  return { blob: await new Promise(ok => c.toBlob(ok, 'image/png')), w, h };
}

export async function exportarInDesign(doc, resolver) {
  const zip = new JSZip(), carpeta = zip.folder('img'), parrafos = [];
  let n = 0;
  const imagen = async src => {
    const r = await fetch(resolver(src)); const blob = await r.blob();
    const bmp = await createImageBitmap(blob);
    let nombre = /^img\//.test(src) ? src.slice(4) : `subida-${++n}.${(blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg')}`;
    carpeta.file(nombre, blob);
    return { img: nombre, w: bmp.width, h: bmp.height };
  };
  const P = (e, html, extra = {}) => parrafos.push({ e, r: tramos(html), ...extra });

  for (const s of secciones(doc.blocks)) {
    for (const b of s.bloques) {
      const salto = b.breakBefore ? { brk: 1 } : {};
      if (s.tipo === 'portada' && b.style !== 'portada-titulo') { P('Portada datos', b.html, salto); continue; }
      switch (b.type) {
        case 'heading':
          if (esCapitulo(b)) { const { num, nombre } = partesCapitulo(b); parrafos.push({ e: 'Capítulo', r: [{ t: 'Capítulo ' + num + '\n' }, { t: nombre, b: 1 }], cap: 1 }); }
          else P(b.level === 1 ? 'Título 1' : 'Título ' + Math.min(b.level, 5), b.html, salto);
          break;
        case 'p': P(ESTILO_P[b.style || ''] || 'Cuerpo', b.html, { ...salto, ...(b.style === 'portada-titulo' ? { cap: 1 } : {}) }); break;
        case 'quote': P('Cita', b.html, salto); break;
        case 'list': b.items.forEach((it, i) => P('Lista', it, i === 0 ? salto : {})); break;
        case 'figure': {
          P('Rótulo', b.label, salto); P('Título figura', b.title);
          if (b.chart) {
            const g = await graficoPNG(b.chart), nombre = `grafico-${b.label.replace(/\W+/g, '-').toLowerCase()}.png`;
            carpeta.file(nombre, g.blob); parrafos.push({ e: 'Imagen', img: nombre, w: g.w, h: g.h });
          } else {
            const fuentes = (b.images?.length ? b.images : [b.src]).filter(Boolean);
            if (!fuentes.length) P('Nota', '[Imagen pendiente]');
            for (const f of fuentes) { try { parrafos.push({ e: 'Imagen', ...(await imagen(f)) }); } catch { P('Nota', '[No se pudo exportar la imagen ' + f + ']'); } }
          }
          if (b.note) P('Nota', b.note);
          break;
        }
        case 'table':
          P('Rótulo', b.label, salto); P('Título figura', b.title);
          parrafos.push({ e: 'Tabla', tabla: { head: (b.head || []).map(r => r.map(textoPlano)), rows: b.rows.map(r => r.map(textoPlano)) } });
          if (b.note) P('Nota', b.note);
          break;
        case 'image': try { parrafos.push({ e: 'Imagen', ...(await imagen(b.src)) }); } catch {} break;
      }
    }
  }

  const ascii = s => s.replace(/[\u007f-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  const datos = ascii(JSON.stringify({ estilo: doc.estilo, meta: doc.meta, p: parrafos }));
  zip.file('Armar-maquetacion.jsx', '\uFEFF' + ascii(SCRIPT).replace('/*DATOS*/', datos));
  zip.file('LEEME.txt', LEEME);
  return zip.generateAsync({ type: 'blob' });
}

const LEEME = `Cómo abrir la maquetación en InDesign

1. Descomprime este .zip en una carpeta (deja la carpeta img junto al script).
2. En InDesign: Ventana > Utilidades > Scripts. En el panel, clic derecho en «Usuario» > Mostrar en el Explorador.
3. Copia «Armar-maquetacion.jsx» y la carpeta img a esa carpeta de scripts (o ejecuta el script con doble clic desde el panel).
4. Doble clic en «Armar-maquetacion.jsx». El documento se arma solo: tarda uno o dos minutos.
5. Si faltan fuentes (Inter, Onest), instálalas desde Google Fonts o cámbialas en los estilos de párrafo.

Todo queda en estilos de párrafo y de carácter: si cambias «Cuerpo», cambia todo el texto.
`;

// Script de InDesign (ExtendScript). Los datos van incrustados en /*DATOS*/.
const SCRIPT = `#target indesign
// Arma la maquetación de «Sobre lo que no digo» a partir de la exportación web.
(function () {
var D = /*DATOS*/;
var E = D.estilo;
var CARPETA = File($.fileName).parent;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;

var doc = app.documents.add();
doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.MILLIMETERS;
doc.documentPreferences.facingPages = true;
doc.documentPreferences.pageWidth = 215.9;
doc.documentPreferences.pageHeight = 279.4;
var M = { t: E.margenSup * 10, b: E.margenInf * 10, i: E.margenInt * 10, o: E.margenExt * 10 };
function margenes(p) { with (p.marginPreferences) { top = M.t; bottom = M.b; left = M.i; right = M.o; } }
for (var k = 0; k < doc.masterSpreads[0].pages.length; k++) margenes(doc.masterSpreads[0].pages[k]);
margenes(doc.pages[0]);

function hex(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
function color(nombre, h) {
  var c = doc.colors.itemByName(nombre);
  if (!c.isValid) c = doc.colors.add({ name: nombre, model: ColorModel.PROCESS, space: ColorSpace.RGB, colorValue: hex(h) });
  return c;
}
var C = { acento: color('Acento', E.acento), dorado: color('Dorado', E.dorado), lavanda: color('Lavanda', E.lavanda), oscuro: color('Fondo oscuro', E.fondoOscuro), tinta: color('Tinta', '#1d1a2e'), suave: color('Tinta suave', '#5d5873'), claro: color('Claro', '#edeaf6') };

function fuente(st, fam, estilo) { try { st.appliedFont = fam; st.fontStyle = estilo; } catch (e) {} }
function ps(nombre, base, props, fam, estiloF) {
  var s = doc.paragraphStyles.itemByName(nombre);
  if (!s.isValid) s = doc.paragraphStyles.add({ name: nombre });
  if (base) s.basedOn = base;
  fuente(s, fam || E.fuenteTexto, estiloF || 'Regular');
  for (var p in props) { try { s[p] = props[p]; } catch (e) {} }
  return s;
}
function cs(nombre, props, estiloF) {
  var s = doc.characterStyles.itemByName(nombre);
  if (!s.isValid) s = doc.characterStyles.add({ name: nombre });
  if (estiloF) s.fontStyle = estiloF;
  for (var p in props) { try { s[p] = props[p]; } catch (e) {} }
  return s;
}
var T = E.tamTexto, L = E.tamTexto * E.interlineado, TF = E.fuenteTitulos;
var J = E.justificado ? Justification.LEFT_JUSTIFIED : Justification.LEFT_ALIGN;
var cuerpo = ps('Cuerpo', null, { pointSize: T, leading: L, justification: J, firstLineIndent: E.sangria ? 6 : 0, spaceAfter: T * 0.2, hyphenation: true, fillColor: C.tinta });
var S = {
  'Cuerpo': cuerpo,
  'Cuerpo sin sangría': ps('Cuerpo sin sangría', cuerpo, { firstLineIndent: 0 }),
  'Centrado': ps('Centrado', cuerpo, { firstLineIndent: 0, justification: Justification.CENTER_ALIGN }),
  'Destacado': ps('Destacado', cuerpo, { firstLineIndent: 0, leftIndent: 5, rightIndent: 5, spaceBefore: 3, spaceAfter: 3 }),
  'Entradilla': ps('Entradilla', cuerpo, { firstLineIndent: 0, pointSize: T * 1.18, leading: T * 1.18 * 1.5, fillColor: C.suave }, null, 'Light'),
  'Pequeño': ps('Pequeño', cuerpo, { firstLineIndent: 0, pointSize: T * 0.86, leading: T * 0.86 * 1.45, fillColor: C.suave }),
  'Referencia': ps('Referencia', cuerpo, { firstLineIndent: -12.7, leftIndent: 12.7, justification: Justification.LEFT_ALIGN, pointSize: T * 0.94, leading: T * 0.94 * 1.5 }),
  'Cita': ps('Cita', cuerpo, { firstLineIndent: 0, leftIndent: 8, pointSize: T * 1.06, spaceBefore: 4, spaceAfter: 4, ruleBelow: false }),
  'Lista': ps('Lista', cuerpo, { firstLineIndent: -4.5, leftIndent: 4.5, bulletsAndNumberingListType: ListType.BULLET_LIST }),
  'Título 1': ps('Título 1', null, { pointSize: T * 2.3, leading: T * 2.5, startParagraph: StartParagraph.NEXT_PAGE, spaceBefore: 14, spaceAfter: 8, fillColor: C.tinta, keepWithNext: 2 }, TF, 'Bold'),
  'Título 2': ps('Título 2', null, { pointSize: T * 1.5, leading: T * 1.75, spaceBefore: 8, spaceAfter: 3, fillColor: C.tinta, keepWithNext: 2 }, TF, 'Bold'),
  'Título 3': ps('Título 3', null, { pointSize: T * 1.18, leading: T * 1.5, spaceBefore: 6, spaceAfter: 2, fillColor: C.acento, keepWithNext: 2 }, TF, 'SemiBold'),
  'Título 4': ps('Título 4', null, { pointSize: T * 1.04, leading: T * 1.4, spaceBefore: 5, spaceAfter: 1.5, fillColor: C.tinta, keepWithNext: 2 }, TF, 'SemiBold'),
  'Título 5': ps('Título 5', null, { pointSize: T * 0.96, leading: T * 1.35, spaceBefore: 5, spaceAfter: 2, fillColor: C.acento, keepWithNext: 2 }, TF, 'SemiBold'),
  'Capítulo': ps('Capítulo', null, { pointSize: T * 4.2, leading: T * 4.3, startParagraph: StartParagraph.NEXT_PAGE, spaceBefore: 150, fillColor: C.claro }, TF, 'Bold'),
  'Portada título': ps('Portada título', null, { pointSize: T * 2.6, leading: T * 2.9, spaceBefore: 60, spaceAfter: 18, fillColor: C.claro }, TF, 'Bold'),
  'Portada datos': ps('Portada datos', null, { pointSize: T, leading: T * 1.5, fillColor: C.claro }, TF, 'Regular'),
  'Portadilla título': ps('Portadilla título', null, { pointSize: T * 1.5, leading: T * 1.9, startParagraph: StartParagraph.NEXT_PAGE, justification: Justification.CENTER_ALIGN, spaceBefore: 50, spaceAfter: 14, fillColor: C.tinta }, TF, 'Bold'),
  'Rótulo': ps('Rótulo', null, { pointSize: T * 0.82, leading: T * 1.2, spaceBefore: 6, capitalization: Capitalization.ALL_CAPS, tracking: 80, fillColor: C.acento, keepWithNext: 3 }, TF, 'Bold'),
  'Título figura': ps('Título figura', cuerpo, { firstLineIndent: 0, justification: Justification.LEFT_ALIGN, spaceAfter: 3, keepWithNext: 2 }, null, 'Italic'),
  'Nota': ps('Nota', cuerpo, { firstLineIndent: 0, justification: Justification.LEFT_ALIGN, pointSize: T * 0.82, leading: T * 0.82 * 1.45, spaceAfter: 8, fillColor: C.suave }),
  'Imagen': ps('Imagen', cuerpo, { firstLineIndent: 0, justification: Justification.LEFT_ALIGN, spaceBefore: 2, spaceAfter: 2, keepWithNext: 1 }),
  'Tabla': ps('Tabla', cuerpo, { firstLineIndent: 0, justification: Justification.LEFT_ALIGN, pointSize: T * 0.84, leading: T * 0.84 * 1.38 }),
};
S['Portada título'].justification = Justification.LEFT_ALIGN;
var CH = { b: cs('Negrita', {}, 'Bold'), i: cs('Cursiva', {}, 'Italic'), bi: cs('Negrita cursiva', {}, 'Bold Italic'), s: cs('Superíndice', { position: Position.SUPERSCRIPT }) };
var NADA = doc.characterStyles.item(0);

// Número de página en las maestras
var ms = doc.masterSpreads[0];
for (var k = 0; k < ms.pages.length; k++) {
  var mp = ms.pages[k], b0 = mp.bounds;
  var nf = mp.textFrames.add({ geometricBounds: [b0[2] - M.b + 6, b0[1] + 20, b0[2] - M.b + 12, b0[3] - 20] });
  nf.contents = SpecialCharacters.AUTO_PAGE_NUMBER;
  nf.paragraphs[0].justification = Justification.CENTER_ALIGN;
  fuente(nf.paragraphs[0], TF, 'Regular');
  nf.paragraphs[0].pointSize = 8.5; nf.paragraphs[0].fillColor = C.suave;
}

function caja(p) {
  var b = p.bounds, mp = p.marginPreferences, izq = p.side == PageSideOptions.LEFT_HAND;
  return [b[0] + mp.top, b[1] + (izq ? mp.right : mp.left), b[2] - mp.bottom, b[3] - (izq ? mp.left : mp.right)];
}
var marco = doc.pages[0].textFrames.add({ geometricBounds: caja(doc.pages[0]) });
var hist = marco.parentStory;
var ancho = 215.9 - M.i - M.o;

for (var n = 0; n < D.p.length; n++) {
  var q = D.p[n], st = S[q.e] || cuerpo, ip = hist.insertionPoints[-1];
  ip.appliedParagraphStyle = st; ip.appliedCharacterStyle = NADA;
  if (q.img) {
    var w = ancho, h = ancho * q.h / q.w;
    if (h > 170) { h = 170; w = 170 * q.w / q.h; }
    var r = ip.rectangles.add({ geometricBounds: [0, 0, h, w], strokeWeight: 0 });
    try { r.place(File(CARPETA + '/img/' + q.img)); r.fit(FitOptions.PROPORTIONALLY); r.fit(FitOptions.CENTER_CONTENT); } catch (e) {}
  } else if (q.tabla) {
    var hd = q.tabla.head, rw = q.tabla.rows, cols = (rw[0] || hd[0]).length;
    var tb = ip.tables.add({ headerRowCount: hd.length, bodyRowCount: Math.max(rw.length, 1), columnCount: cols });
    tb.width = ancho;
    var todas = hd.concat(rw);
    for (var i = 0; i < todas.length; i++) for (var j = 0; j < cols; j++) {
      var cel = tb.rows[i].cells[j]; cel.contents = todas[i][j] || '';
      cel.texts[0].appliedParagraphStyle = S['Tabla'];
      if (i < hd.length) { cel.fillColor = C.lavanda; cel.fillTint = 35; try { cel.texts[0].appliedCharacterStyle = CH.b; } catch (e) {} }
      cel.topInset = cel.bottomInset = 1.2; cel.leftInset = cel.rightInset = 1.8;
    }
  } else {
    for (var t = 0; t < q.r.length; t++) {
      var tr = q.r[t], a = hist.characters.length;
      hist.insertionPoints[-1].contents = tr.t;
      var z = hist.characters.length - 1;
      if (z >= a && (tr.b || tr.i || tr.s)) {
        var rango = hist.characters.itemByRange(a, z);
        rango.appliedCharacterStyle = tr.s ? CH.s : tr.b && tr.i ? CH.bi : tr.b ? CH.b : CH.i;
      }
    }
  }
  var par = hist.insertionPoints[-1].paragraphs[0];
  if (q.brk) par.startParagraph = StartParagraph.NEXT_PAGE;
  if (q.cap) par.label = 'oscura';
  if (n < D.p.length - 1) hist.insertionPoints[-1].contents = '\\r';
}

// Encadena marcos y agrega páginas hasta que no sobre texto
var guarda = 0;
doc.recompose();
while (marco.overflows && guarda++ < 600) {
  var pg = doc.pages.add(LocationOptions.AT_END);
  var nuevo = pg.textFrames.add({ geometricBounds: caja(pg) });
  marco.nextTextFrame = nuevo; marco = nuevo;
  doc.recompose();
}

// Portada y aperturas: fondo oscuro a sangre y sin número de página
var oscura = [];
for (var k = 0; k < hist.paragraphs.length; k++) { var pa = hist.paragraphs[k]; if (pa.label == 'oscura' || pa.appliedParagraphStyle.name == 'Capítulo' || pa.appliedParagraphStyle.name == 'Portada título') oscura.push(pa); }
for (var k = 0; k < oscura.length; k++) {
  var fr = oscura[k].parentTextFrames[0]; if (!fr || !fr.isValid) continue;
  var pg = fr.parentPage; if (!pg) continue;
  var fondo = pg.rectangles.add({ geometricBounds: [pg.bounds[0] - 3, pg.bounds[1] - 3, pg.bounds[2] + 3, pg.bounds[3] + 3], fillColor: C.oscuro, strokeWeight: 0 });
  fondo.sendToBack();
  try { pg.appliedMaster = NothingEnum.NOTHING; } catch (e) {}
}

app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
alert('Maquetación lista: ' + doc.pages.length + ' páginas. Revisa las fuentes faltantes (Texto > Buscar fuente) si aparecen resaltadas.');
})();
`;
