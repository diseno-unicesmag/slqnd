// Motor de pliegos: compone el documento en páginas carta enfrentadas, como en InDesign.
// Trabaja sobre el DOM real (fuera de pantalla, a escala 1) para medir: llena bandas de texto
// a dos columnas, parte párrafos donde se acaba la página, coloca figuras y tablas a lo ancho
// (o las pasa a la página siguiente sin cortar el texto) y arma portada, preliminares,
// índice, aperturas de capítulo y referencias.
import { renderToStaticMarkup } from 'react-dom/server';
import Grafico from '@/components/Grafico';
import { esCapitulo, partesCapitulo, textoPlano } from '@/lib/doc';
import { vidrio } from '@/lib/vidrio';
import { pictograma } from '@/lib/pictos';
import { CADENA } from '@/lib/cadena';
import { redCadena } from '@/lib/redCadena';
import { FASES } from '@/lib/rutaWeb';
import { ICONOS_RUTA } from '@/lib/iconosRuta';

// Lema de cada fase de las 3i: el nombre de la fase se mantiene y el lema lo acompaña
const TITULOS = { indagar: 'Cartografiar', idear: 'Diseñar', implementar: 'Validar' };
const LEMAS = { indagar: 'Cartografiar el silencio', idear: 'Diseñar la metáfora', implementar: 'Validar la revelación' };

const PX = 96;                      // px por pulgada
const L = 0.2 * PX;                 // renglón: todo lo que se apila cae en múltiplos de esta altura
const ALTO_CAJA = 46 * L;           // 9,2 in de caja = 46 renglones
const ANCHO_CAJA = 7 * PX;          // 4 columnas + 3 medianiles
const ESPACIO = 2 * L;              // aire bajo figuras y tablas
const AIRE = L;                     // aire entre el texto y la figura que sigue
const enRenglon = v => Math.ceil(v / L - 0.02) * L;   // redondea hacia arriba al siguiente renglón
const PPI_MAX = 60;   // solo se frena lo que quedaría pixelado de verdad
const AIRE_SECCION = 3 * L;          // blanco sobre el título de cada apartado
const SANGRE = new Set(['Figura 18', 'Figura 31', 'Figura 41']);   // fotografías de campo a página completa
// Citas destacadas: salen junto al párrafo de donde vienen, si hace rato que no hay una
const CITAS = [
  ['si descanso, siento culpa', 'Si descanso, siento culpa', 'Respuesta de la CDPS (P14)'],
  ['ya contó su historia primero', 'Es más fácil abrirse cuando alguien más ya contó su historia primero', ''],
  ['no desaparecen, sino que se pudren', 'Al ser ignorados, no desaparecen: se pudren bajo la superficie', ''],
  ['no añade información ajena a la obra', 'La realidad aumentada no añade: revela', 'MetafoRA'],
];
const A_LO_ANCHO = new Set(['Figura 1', 'Figura 2', 'Figura 3', 'Figura 36', 'Figura 37', 'Figura 42', 'Figura 44', 'Figura 45']);
const PAGINA_SOLA = new Set(['Figura 36']);   // van solas, centradas en su página
const MIN_TABLA = 1.4 * PX;         // menos que esto no vale la pena empezar una tabla

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const partirNum = (t, re) => { const m = t.match(re); return m ? [m[1], m[2]] : ['', t]; };

export function separarTitulo(b) {
  const t = textoPlano(b.html);
  if (b.level === 2 || b.level === 3) return partirNum(t, /^(\d+(?:\.\d+)+)\s*[-–]\s*(.+)$/);
  if (b.level === 4) return partirNum(t, /^(Fase\s+\d+)\s*[-–]\s*(.+)$/i);
  if (b.level === 5) return partirNum(t, /^([A-Z])\.\s*(.+)$/);
  return ['', t];
}

// Divide el documento en las partes que el motor compone de forma distinta.
export function planificar(doc) {
  const B = doc.blocks, partes = [];
  let i = 0;
  const hasta = pred => { const out = []; while (i < B.length && !pred(B[i])) out.push(B[i++]); return out; };
  const esH1 = b => b.type === 'heading' && b.level === 1;
  // Portada: del título hasta la portadilla
  if (B[0]?.style === 'portada-titulo') { const tit = B[i++]; partes.push({ tipo: 'portada', titulo: tit, datos: hasta(b => b.style === 'portadilla-titulo') }); }
  if (B[i]?.style === 'portadilla-titulo') { const tit = B[i++]; partes.push({ tipo: 'portadilla', titulo: tit, datos: hasta(esH1) }); }
  let capitulo = null;
  while (i < B.length) {
    const b = B[i++];
    if (esCapitulo(b)) {
      capitulo = { tipo: 'capitulo', titulo: b, ...partesCapitulo(b), secciones: [] };
      partes.push(capitulo);
      const intro = hasta(x => esH1(x) || (x.type === 'heading' && x.level === 2));
      if (intro.length) capitulo.secciones.push({ titulo: null, bloques: intro });
      while (i < B.length && B[i].type === 'heading' && B[i].level === 2) {
        const t = B[i++]; capitulo.secciones.push({ titulo: t, bloques: hasta(x => esH1(x) || (x.type === 'heading' && x.level === 2)) });
      }
      continue;
    }
    if (esH1(b)) {
      const t = textoPlano(b.html);
      if (/^Referencias/i.test(t)) { partes.push({ tipo: 'referencias', titulo: b, bloques: hasta(esH1) }); continue; }
      partes.push({ tipo: 'preliminar', titulo: b, bloques: hasta(esH1) });
      if (t === 'Abstract') partes.push({ tipo: 'indice' });
      continue;
    }
    partes.push({ tipo: 'preliminar', titulo: null, bloques: [b] });
  }
  return partes;
}

// Entradas del índice general: lo que viene después del propio índice, en orden.
function entradasIndice(partes) {
  const out = []; let tras = false;
  for (const p of partes) {
    if (p.tipo === 'indice') { tras = true; continue; }
    if (!tras) continue;
    if (p.tipo === 'preliminar' && p.titulo) out.push({ id: p.titulo.id, nivel: 1, n: '', t: textoPlano(p.titulo.html) });
    if (p.tipo === 'referencias') out.push({ id: p.titulo.id, nivel: 1, n: '', t: 'Referencias' });
    if (p.tipo === 'capitulo') {
      out.push({ id: p.titulo.id, nivel: 1, n: 'Capítulo ' + p.num, t: p.nombre });
      for (const s of p.secciones) {
        if (s.titulo) { const [n, t] = separarTitulo(s.titulo); out.push({ id: s.titulo.id, nivel: 2, n, t }); }
        s.bloques.filter(b => b.type === 'heading' && b.level === 3).forEach(b => { const [n, t] = separarTitulo(b); out.push({ id: b.id, nivel: 3, n, t }); });
      }
    }
  }
  return out;
}

export 
// Grietas doradas irregulares para la portada (deterministas: mismo dibujo en web y PDF)
function grietas() {
  let sem = 7; const r = () => { sem = (sem * 9301 + 49297) % 233280; return sem / 233280; };
  const W = 816, H = 1056; let d = '';
  const rama = (x, y, ang, largo, grosor, nivel) => {
    let pts = [[x, y]];
    const pasos = 6 + Math.floor(r() * 6);
    for (let i = 0; i < pasos; i++) { ang += (r() - .5) * .9; x += Math.cos(ang) * largo / pasos; y += Math.sin(ang) * largo / pasos; pts.push([x, y]); }
    d += `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')}" stroke-width="${grosor.toFixed(2)}"/>`;
    if (nivel < 3) { const n = 1 + Math.floor(r() * 2); for (let k = 0; k < n; k++) { const q = pts[1 + Math.floor(r() * (pts.length - 1))]; rama(q[0], q[1], ang + (r() - .5) * 2.2, largo * (.35 + r() * .3), grosor * .55, nivel + 1); } }
  };
  [[-10, 60, .25, 520], [W + 10, 30, Math.PI - .35, 430], [300, -10, 1.25, 260], [W + 10, 330, Math.PI + .15, 300], [-10, 260, -.15, 240]].forEach(([x, y, a, l]) => rama(x, y, a, l, 2.6, 0));
  const el = h('div', 'por-grietas', `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g fill="none" stroke="#f2c230" stroke-linecap="round" stroke-linejoin="round">${d}</g></svg>`);
  return el;
}
class Maquetador {
  constructor(raiz, resolver, deco) {
    this.raiz = raiz; this.resolver = resolver; this.deco = deco;
    this.paginas = []; this.flotantes = []; this.indice = []; this.seccionActual = '';
  }

  // ── Páginas ──
  get siguienteEsDerecha() { return (this.paginas.length + 1) % 2 === 1; }
  pagina(clases = '', { folio = true } = {}) {
    const n = this.paginas.length + 1, lado = n % 2 ? 'der' : 'izq';
    const el = h('div', `pag ${lado} ${clases}`);
    const caja = h('div', 'caja'); el.appendChild(caja);
    this.raiz.appendChild(el);
    const p = { el, caja, n, lado, folio, seccion: this.seccionActual };
    this.paginas.push(p); this.actual = p; this.y = 0; this.banda = null;
    return p;
  }
  paginaFlujo() {
    this.emitirRuta(); this.emitirPaleta();
    this.pagina((this.modo === 'una' ? 'p-una ' : '') + (this.claseFlujo || '')).flujo = true;
    // Lo que quedó pendiente de la página anterior va primero
    const pend = this.flotantes; this.flotantes = [];
    for (const f of pend) this.colocarAncho(f, true);
  }

  // ── Bloques → elementos ──
  crear(b, primero) {
    switch (b.type) {
      case 'p': {
        const e = h('p', b.style === 'referencia' ? 'ref' : '', b.html);
        if (primero && this.modo !== 'refs' && !this.sinCapitular && textoPlano(b.html).length > 250) e.classList.add('dc', 'sigue');
        return e;
      }
      case 'heading': {
        const [n, t] = separarTitulo(b), lv = Math.min(b.level, 5);
        if (lv <= 3) { const e = h('h3', 't3' + (/^Propósitos Específicos/i.test(t) ? ' salto-col' : ''), (n ? `<span class="n">${n}</span>` : '') + t); e.dataset.id = b.id; return e; }
        if (lv === 4) return h('h4', 't4', (n ? `<span class="n">${n}</span>` : '') + t);
        return h('h5', 't5', (n ? `<span class="n">${n}</span>` : '') + t);
      }
      case 'quote': return h('blockquote', 'cita', b.html);
      case 'list': { const ul = h('ul', 'lista'); b.items.forEach(it => ul.appendChild(h('li', '', it))); return ul; }
      case 'figure': if (b.label === 'Figura 16') { this.rutaPendiente = b; return null; } if (b.label === 'Figura 45') { this.paletaPendiente = b; return null; } return this.figura(b);
      case 'table': return this.tabla(b);
      default: return null;
    }
  }
  figura(b) {
    const f = h('figure', 'ancho');
    f.appendChild(h('span', 'rot', b.label)); f.appendChild(h('span', 'tit', b.title));
    if (b.chart) { const g = h('div', 'fig-graf'); g.innerHTML = renderToStaticMarkup(<Grafico chart={b.chart} />); f.appendChild(g); }
    else {
      const fuentes = (b.images?.length ? b.images : [b.src]).filter(Boolean);
      if (!fuentes.length) f.appendChild(h('div', 'fig-vacia', 'Imagen pendiente'));
      else {
        // Grupos: filas justificadas (todas las imágenes de una fila con el mismo alto) que juntas
        // llenan el ancho sin recortar. Imagen suelta horizontal: a todo el ancho. Imagen suelta
        // vertical: completa, ocupando 2 o 3 columnas de la retícula, con el pie en la columna libre.
        const COL = 1.585 * PX, GUT = 0.22 * PX, SEP = 0.1 * PX, n = fuentes.length;
        const ds = fuentes.map(s => this.dims?.[this.resolver(s)] || [4, 3]);
        const r = ds.map(d => d[0] / d[1]);
        const c = h('div', 'fig-img');
        const filasDe = k => { const out = [], por = Math.ceil(n / k); for (let i = 0; i < n; i += por) out.push([...Array(Math.min(por, n - i)).keys()].map(x => x + i)); return out; };
        // Ninguna imagen se amplía por encima de ~150 ppi efectivos
        const maxAncho = i => ds[i][0] / PPI_MAX * PX, TRES = 3 * COL + 2 * GUT;
        const completa = A_LO_ANCHO.has(b.label);
        let filas, anchoTotal = ANCHO_CAJA;
        if (n === 1 && b.referente) {
          // Referentes: todos igual, la imagen a la derecha en tres columnas y el pie a la izquierda
          anchoTotal = Math.min(TRES, 22 * L * r[0]); f.classList.add('fig-lado'); filas = [[0]];
        } else if (n === 1 && !completa && r[0] >= 1.05 && maxAncho(0) < ANCHO_CAJA) {
          // horizontal de poca resolución: se reduce; si cabe en tres columnas, el pie va al lado
          anchoTotal = Math.min(maxAncho(0), TRES); if (maxAncho(0) <= TRES + 0.4 * PX) f.classList.add('fig-lado'); filas = [[0]];
        } else if (n === 1 && r[0] < 1.05) {
          // vertical: el mayor número de columnas con el que la imagen entera cabe en alto
          const maxAlto = 38 * L;
          for (const cols of [3, 2]) { anchoTotal = cols * COL + (cols - 1) * GUT; if (anchoTotal / r[0] <= maxAlto) break; }
          if (anchoTotal / r[0] > maxAlto) anchoTotal = maxAlto * r[0];
          anchoTotal = Math.min(anchoTotal, maxAncho(0));
          f.classList.add('fig-lado'); filas = [[0]];
        } else {
          // se prueba con 1, 2, 3… filas y se queda la que da un alto de fila más cercano a 3,4 in
          let mejor = null;
          for (let k = 1; k <= Math.min(n, 3); k++) {
            const fs = filasDe(k), altos = fs.map(f => (ANCHO_CAJA - (f.length - 1) * SEP) / f.reduce((a, i) => a + r[i], 0));
            const total = altos.reduce((a, x) => a + x, 0);
            const pena = Math.abs(Math.min(...altos) - 3.4 * PX) + (total > 36 * L ? 1e4 : 0);
            if (!mejor || pena < mejor.pena) mejor = { fs, pena };
          }
          filas = mejor.fs;
        }
        filas.forEach(fila => {
          const suma = fila.reduce((a, i) => a + r[i], 0);
          let ancho = anchoTotal - (fila.length - 1) * SEP;
          if (!completa) ancho = Math.min(ancho, ...fila.map(i => maxAncho(i) * suma / r[i]));
          const alto = Math.max(4 * L, Math.round(ancho / suma / L) * L);   // alto en renglones: el recorte es de unos px
          const fr = h('div', 'fig-fila');
          fila.forEach(i => { const im = h('img'); im.src = this.resolver(fuentes[i]); im.alt = b.title || ''; im.style.width = (ancho * r[i] / suma) + 'px'; im.style.height = alto + 'px'; fr.appendChild(im); });
          c.appendChild(fr);
        });
        if (PAGINA_SOLA.has(b.label)) f.classList.add('fig-pagina');
        if (SANGRE.has(b.label) && n === 1) { f.classList.add('fig-pagina', 'fig-sangre'); f.classList.remove('fig-lado'); }
        if (f.classList.contains('fig-lado')) {
          // pie a la izquierda (columna 1), imagen alineada a la derecha
          const pie = h('div', 'fig-pie'); while (f.firstChild) pie.appendChild(f.firstChild);
          if (b.note) pie.appendChild(h('div', 'nota', b.note));
          f.append(pie, c); return f;
        }
        f.appendChild(c);
      }
    }
    if (b.note) f.appendChild(h('div', 'nota', b.note));
    return f;
  }
  tabla(b) {
    const f = h('figure', 'ancho tabla');
    f.appendChild(h('span', 'rot', b.label)); f.appendChild(h('span', 'tit', b.title));
    const t = h('table');
    if (b.head?.length) { const th = h('thead'); b.head.forEach(r => { const tr = h('tr'); r.forEach(c => tr.appendChild(h('th', '', c))); th.appendChild(tr); }); t.appendChild(th); }
    // Las filas más cortas vienen de celdas combinadas en vertical: se rellenan a la izquierda
    const ncol = Math.max(...(b.head || []).map(r => r.length), ...b.rows.map(r => r.length));
    const tb = h('tbody');
    b.rows.forEach((r, k) => {
      const tr = h('tr'), falta = ncol - r.length;
      for (let j = 0; j < falta; j++) tr.appendChild(h('td', 'combinada'));
      if (!falta && b.rows[k + 1] && b.rows[k + 1].length < ncol) tr.className = 'grupo-ini';
      r.forEach(c => tr.appendChild(h('td', '', c))); tb.appendChild(tr);
    });
    t.appendChild(tb);
    f.appendChild(t);
    if (b.note) f.appendChild(h('div', 'nota', b.note));
    return f;
  }
  marcar(el, id) { el.dataset.id = id; }

  // ── Texto en bandas de columnas ──
  nuevaBanda() {
    const b = h('div', 'flujo banda' + (this.modo === 'una' ? ' una-col' : '') + (this.modo === 'refs' ? ' referencias' : ''));
    b.style.top = this.y + 'px';
    this.actual.caja.appendChild(b); this.banda = b; return b;
  }
  cerrarBanda() {
    if (!this.banda) return;
    if (this.banda.children.length) this.y += enRenglon(this.banda.offsetHeight);
    else this.banda.remove();
    this.banda = null;
  }
  agregarTexto(el, guardia = 0) {
    for (let k = 0; k < 4 && !this.banda && ALTO_CAJA - this.y < 3 * L && (guardia < 3 || this.y >= ALTO_CAJA); k++) this.paginaFlujo();
    if (!this.banda) this.nuevaBanda();
    const b = this.banda; b.appendChild(el);
    if (this.y + b.offsetHeight <= ALTO_CAJA) return;
    b.style.height = (ALTO_CAJA - this.y) + 'px'; b.classList.add('llena');
    let resto = this.partir(b);
    // Comprobación: si algo quedó en una columna de desborde (oculta), se vuelve a partir
    for (let i = 0; i < 6 && b.children.length && this.desborda(b); i++) {
      const mas = this.partir(b);
      if (mas.length && resto.length && this.unir(mas[mas.length - 1], resto[0])) resto.shift();
      resto = [...mas, ...resto];
    }
    if (!b.children.length) b.remove();
    this.banda = null;
    if (guardia > 3) { resto.forEach(r => b.appendChild(r)); return; }   // no cabe ni en página vacía: se deja
    this.paginaFlujo();
    const vacia = !this.banda && this.y === 0;
    resto.forEach((r, k) => this.agregarTexto(r, vacia && k === 0 ? guardia + 1 : 0));
  }
  // Junta dos pedazos seguidos del mismo párrafo o lista (para no abrir un párrafo nuevo a mitad de frase)
  unir(a, b) {
    if (!a.dataset.b || a.dataset.b !== b.dataset.b || a.tagName !== b.tagName) return false;
    if (a.tagName === 'P') { a.append(...b.childNodes); return true; }
    if (a.tagName === 'UL') {
      const ult = a.lastElementChild, pri = b.firstElementChild;
      if (ult && pri?.classList.contains('sigue')) { ult.append(...pri.childNodes); pri.remove(); }
      a.append(...b.children); return true;
    }
    return false;
  }
  desborda(b) {
    const R = b.getBoundingClientRect().right - 1, r = document.createRange(); r.selectNodeContents(b);
    return [...r.getClientRects()].some(x => x.width && x.left >= R);
  }
  // Devuelve (desprendidos) los elementos que no caben en las dos columnas de la banda.
  partir(b) {
    const R = b.getBoundingClientRect().right - 1;
    const fuera = r => r.left >= R;
    const hijos = [...b.children], resto = [];
    for (let k = 0; k < hijos.length; k++) {
      const c = hijos[k], rs = [...c.getClientRects()].filter(r => r.width || r.height);
      const dentro = rs.length && rs.every(r => !fuera(r)), todoFuera = !rs.length || rs.every(fuera);
      if (dentro) continue;
      if (todoFuera || !/^(P|UL)$/.test(c.tagName)) { resto.push(...hijos.slice(k)); break; }
      const pedazo = c.tagName === 'UL' ? this.partirLista(c, R) : this.partirParrafo(c, R);
      resto.push(...(pedazo ? [pedazo] : hijos.slice(k, k + 1)), ...hijos.slice(k + 1)); break;
    }
    resto.forEach(r => r.remove());
    // Un título no puede quedar solo al pie de la columna
    const ult = b.lastElementChild;
    if (ult && /^H[345]$/.test(ult.tagName)) { ult.remove(); resto.unshift(ult); }
    return resto;
  }
  partirParrafo(p, R) {
    const nodos = [], tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) if (tw.currentNode.nodeValue.trim()) nodos.push(tw.currentNode);
    const r = document.createRange();
    const fuera = (n, o) => { r.setStart(n, o); r.setEnd(n, Math.min(o + 1, n.length)); const q = [...r.getClientRects()].find(x => x.width); return q ? q.left >= R : false; };
    for (const n of nodos) {
      r.selectNodeContents(n); const rs = [...r.getClientRects()];
      if (!rs.some(x => x.left >= R)) continue;
      let lo = 0, hi = n.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (fuera(n, mid)) hi = mid; else lo = mid + 1; }
      // retrocede al inicio de la palabra
      let o = lo; while (o > 0 && !/\s/.test(n.nodeValue[o - 1])) o--;
      const corte = document.createRange(); corte.setStart(n, o); corte.setEndAfter(p.lastChild);
      if (o === 0 && n === nodos[0]) return null;
      const frag = corte.extractContents();
      const nuevo = h(p.tagName, p.className.replace(/\bdc\b/, '').trim()); nuevo.classList.add('sigue');
      if (p.dataset.b) nuevo.dataset.b = p.dataset.b; nuevo.appendChild(frag);
      p.classList.add('parte');
      // si lo que quedó es solo la etiqueta vacía, se mueve completo
      if (!textoPlano(p.innerHTML)) { p.append(...nuevo.childNodes); p.classList.remove('parte'); return null; }
      return nuevo;
    }
    return null;
  }
  partirLista(ul, R) {
    const items = [...ul.children]; const nueva = h('ul', ul.className); nueva.dataset.b = ul.dataset.b;
    for (let k = 0; k < items.length; k++) {
      const li = items[k], rs = [...li.getClientRects()];
      if (rs.every(x => x.left < R)) continue;
      const pedazo = rs.every(x => x.left >= R) ? null : this.partirParrafo(li, R);
      if (pedazo) { pedazo.style.listStyle = 'none'; nueva.appendChild(pedazo); }
      else if (k === 0) return null;            // ni el primer punto cabe: la lista pasa entera
      else nueva.appendChild(li);
      items.slice(k + 1).forEach(x => nueva.appendChild(x)); break;
    }
    return nueva.children.length ? nueva : null;
  }

  // ── Elementos a lo ancho (figuras y tablas) ──
  colocarAncho(el, alInicio = false) {
    // Se mide primero debajo del texto abierto: si no cabe y va a la página siguiente,
    // la banda sigue abierta y el texto continúa sin cortar las columnas
    const habiaTexto = !!(this.banda && this.banda.children.length);
    if (el.classList.contains('fig-pagina')) {
      if (habiaTexto || this.y > 0) { this.flotantes.push(el); return; }
      this.cerrarBanda();
      if (el.classList.contains('fig-sangre')) {   // a sangre: la foto llena la página y el pie va sobre cristal
        const im = el.querySelector('img'), pie = h('div', 'panel-vidrio sangre-pie');
        [...el.children].filter(c => !c.classList.contains('fig-img')).forEach(c => pie.appendChild(c));
        el.querySelectorAll('.fig-pie > *').forEach(c => pie.appendChild(c));
        el.innerHTML = ''; im.removeAttribute('style'); el.append(im, pie);
        this.actual.el.appendChild(el); this.actual.el.classList.add('pag-sangre'); this.actual.folio = false;
        this.y = ALTO_CAJA; return;
      }
      el.style.position = 'absolute'; el.style.left = '0'; el.style.right = '0';
      this.actual.caja.appendChild(el);
      el.style.top = Math.max(0, enRenglon((ALTO_CAJA - el.offsetHeight) / 2 - L)) + 'px';
      this.y = ALTO_CAJA; return;
    }
    const yTent = this.banda ? this.y + enRenglon(this.banda.offsetHeight) + (habiaTexto ? AIRE : 0) : this.y;
    el.style.position = 'absolute'; el.style.left = '0'; el.style.right = '0'; el.style.top = yTent + 'px';
    this.actual.caja.appendChild(el);
    const libreTent = ALTO_CAJA - yTent;
    const partirTabla = el.classList.contains('tabla') && (libreTent >= MIN_TABLA || alInicio);
    if (this.banda && el.offsetHeight > libreTent && !partirTabla) { el.remove(); el.style.top = ''; this.flotantes.push(el); return; }
    this.cerrarBanda(); if (habiaTexto) this.y += AIRE; el.style.top = this.y + 'px';
    const alto = el.offsetHeight, libre = ALTO_CAJA - this.y;
    if (alto <= libre) { this.y += enRenglon(alto) + ESPACIO; return; }
    if (el.classList.contains('tabla') && (libre >= MIN_TABLA || alInicio)) { this.partirTabla(el, libre); return; }
    if (this.y === 0) { // ni en página vacía: se ajusta la imagen
      el.querySelectorAll('.fig-img img').forEach(im => { im.style.height = Math.max(6 * L, Math.floor((libre - (alto - im.offsetHeight)) / L) * L) + 'px'; });
      this.y += enRenglon(el.offsetHeight) + ESPACIO; return;
    }
    el.remove(); el.style.top = '';
    this.flotantes.push(el);   // sigue el texto; la figura abre la próxima página
  }
  partirTabla(el, libre) {
    const filas = [...el.querySelectorAll('tbody tr')], cab = el.querySelector('thead');
    const nota = el.querySelector('.nota'); if (nota) nota.remove();
    let k = filas.length;
    while (k > 1 && el.offsetHeight > libre) { k--; filas[k].remove(); }
    // Si caben todas las filas pero no la nota, la última fila baja con la nota a la página siguiente
    if (k === filas.length && nota) { el.appendChild(nota); const cabe = el.offsetHeight <= libre; nota.remove(); if (!cabe && k > 1) { k--; filas[k].remove(); } }
    // Si ni el encabezado con dos filas cabe, la tabla entera pasa a la página siguiente
    if (el.offsetHeight > libre || (k < 2 && filas.length > 2)) {
      const tb = el.querySelector('tbody'); filas.slice(k).forEach(f => tb.appendChild(f)); if (nota) el.appendChild(nota);
      el.remove(); el.style.top = ''; this.paginaFlujo(); this.colocarAncho(el, true); return;
    }
    this.y += enRenglon(el.offsetHeight) + ESPACIO;
    const sigue = h('figure', 'ancho tabla'); sigue.dataset.b = el.dataset.b; sigue.dataset.cont = '1';
    sigue.appendChild(h('span', 'rot', el.querySelector('.rot').textContent + ' (continuación)'));
    const t = h('table'); if (cab) t.appendChild(cab.cloneNode(true));
    const tb = h('tbody'); filas.slice(k).forEach(f => tb.appendChild(f)); t.appendChild(tb); sigue.appendChild(t);
    if (nota) sigue.appendChild(nota);
    if (!filas.slice(k).length) { if (nota) { el.appendChild(nota); } return; }
    this.paginaFlujo(); this.colocarAncho(sigue, true);
  }
  citaDe(b) {
    const t = textoPlano(b.html).toLowerCase(), c = CITAS.find(c => !this.citasUsadas?.has(c[0]) && t.includes(c[0]));
    if (!c || this.paginas.length - (this.ultimaCita ?? -9) < 4) return;
    (this.citasUsadas ??= new Set()).add(c[0]); this.ultimaCita = this.paginas.length;
    const e = h("div", "ancho cita-dest", `<p>«${c[1]}»</p>` + (c[2] ? `<span>${c[2]}</span>` : ''));
    this.colocarAncho(e);
  }
  vaciarFlotantes() { while (this.flotantes.length) { this.paginaFlujo(); } }

  fluir(bloques) {
    let primero = true, modoAntes = this.modo, trasCategoria = false;
    for (const b of bloques) {
      // Referentes: cada uno abre página a una columna (nombre, descripción, figura, debilidades,
      // fortalezas y aporte); la categoría va encima del primero de su grupo
      const cat = b.type === 'p' && /^<strong>Referentes de /.test(b.html || '');
      const nom = b.type === 'p' && /^<em><strong>[A-L]\. /.test(b.html || '');
      if (cat || (nom && !trasCategoria)) { this.cerrarBanda(); this.vaciarFlotantes(); this.modo = 'una'; this.paginaFlujo(); }
      trasCategoria = cat;
      const el = this.crear(b, primero && b.type === 'p');
      if (!el) continue;
      if (cat) el.classList.add('ref-cat'); if (nom) el.classList.add('ref-nom');
      el.dataset.b = b.id;
      if (b.type === 'p') primero = false;
      if (b.type === 'heading') primero = false;
      if (el.classList.contains('ancho')) this.colocarAncho(el); else this.agregarTexto(el);
      if (b.type === 'p') this.citaDe(b);
    }
    this.cerrarBanda();
    this.vaciarFlotantes();
    this.modo = modoAntes;
  }

  // ── Partes ──
  portada(parte) {
    // Página sola a la derecha: la textura de vidrio a sangre y los datos sobre un panel de cristal
    const p = this.pagina('noche portada tipo', { folio: false });
    p.el.appendChild(this.fondo(this.deco.portada));
    const t = textoPlano(parte.titulo.html), [titulo, ...sub] = t.split(/\s+[-–]\s+/);
    // Portada editorial: título y subtítulo arriba, autor y año abajo; el resto va en la portadilla
    const datos = parte.datos.map(b => textoPlano(b.html));
    const autor = (datos.find(d => /^Autor/i.test(d)) || '').replace(/^Autor:\s*/i, '');
    const anio = datos[datos.length - 1] || '';
    const panel = h('div', 'por-texto');
    const t1 = h('h1', 'logo', titulo.replace(/^Sobre\s+(.*?)\s+no\s+(.*)$/, 'Sobre<br>$1<br>no $2')); t1.style.backgroundImage = `url("${this.deco.portada}")`; p.el.appendChild(t1);
    p.el.appendChild(h('p', 'por-sub por-sub-top', sub.join(' – ').replace(/phygital/i, '<em>phygital</em>')));
    p.el.appendChild(grietas());
    panel.appendChild(h('div', 'por-pie', `<span class="autor"><b>${autor}</b><small>Universidad CESMAG</small></span><b class="anio">${anio}</b>`));
    p.el.appendChild(panel);
  }
  // Panel de cristal líquido de verdad: refracción y aberración en los bordes, radio amplio
  liquido(el, radio = 0.6 * PX) {
    el.classList.add('liquido');
    vidrio(el, el.offsetWidth, el.offsetHeight, { radio, prof: Math.round(radio * 0.5), fuerza: Math.round(radio * 0.9), ca: 3, desenfoque: 10, fondo: 'rgba(255,255,255,0.07)', sombra: '0 40px 90px rgba(0,0,0,0.35)' });
  }
  // La ruta metodológica se arma como pliego propio en cuanto la página siguiente sea izquierda
  // Figura 44 como pliego: la paleta a sangre en bandas y la tipografía en grande
  emitirPaleta() {
    const b = this.paletaPendiente; if (!b || this.siguienteEsDerecha) return;
    this.paletaPendiente = null;
    const izq = this.pagina('noche paleta pal-izq', { folio: false }), der = this.pagina('paleta pal-der', { folio: false });
    izq.el.dataset.b = b.id;
    const C = [['#3b1d7a', 'Violeta profundo', 'Dominante · introspección', '#fff'], ['#7c3aed', 'Púrpura', 'Dominante · interioridad', '#fff'], ['#f0c24b', 'Dorado', 'Acento · revelación', '#2b1759'], ['#2b2a30', 'Gris asfalto', 'Soporte · sobriedad', '#fff'], ['#f6f3fb', 'Cristal blanco', 'Soporte translúcido', '#2b1759']];
    izq.el.insertAdjacentHTML('beforeend', `<div class="pal-bandas">${C.map(([c, n, d, t]) => `<div style="background:${c};color:${t}"><b>${n}</b><span>${d}</span><i>${c.toUpperCase()}</i></div>`).join('')}</div><div class="pal-cab"><span>${b.label}</span><h2>Paleta cromática</h2></div>`);
    der.el.insertAdjacentHTML('beforeend', `<div class="pal-tipo"><span class="pal-tag">${b.label} · ${b.title}</span>
      <div class="pal-m"><b>Aa</b><div><h3>Montserrat</h3><p>Títulos, subtítulos, mensajes destacados e interfaz. Sin serifa contemporánea, de alta legibilidad en pantalla.</p></div></div>
      <div class="pal-abc m">ABCDEFGHIJKLMNÑOPQRSTUVWXYZ<br>abcdefghijklmnñopqrstuvwxyz 0123456789</div>
      <div class="pal-m i"><b>Aa</b><div><h3>Source Serif 4</h3><p>Texto de lectura y datos: el cuerpo de este documento.</p></div></div>
      <div class="pal-abc i">ABCDEFGHIJKLMNÑOPQRSTUVWXYZ<br>abcdefghijklmnñopqrstuvwxyz 0123456789</div>
      <p class="pal-nota">${b.note || ''}</p></div>`);
    const len = h('span', 'burbuja pal-lente'); der.el.appendChild(len);
    pieza(len, 'lente-paleta', 1.9 * PX, { ca: 3, ff: 0.28, pf: 0.1, fondo: 'rgba(43,23,89,0.16)', sombra: 'inset 0 0 0 1.5px rgba(43,23,89,0.25), 0 14px 30px rgba(43,23,89,0.28)' });
  }
  emitirRuta() {
    const b = this.rutaPendiente; if (!b || this.siguienteEsDerecha) return;
    this.rutaPendiente = null;
    // Póster horizontal de la web, llevado al pliego: fondo oscuro a sangre, tres momentos en columnas
    const izq = this.pagina('noche ruta ruta-izq'), der = this.pagina('noche ruta ruta-der');
    izq.el.dataset.b = b.id;
    const ico = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONOS_RUTA[n] || ''}</svg>`;
    const EST = { Completa: 'check', 'En curso': 'curso', 'Por iniciar': 'reloj' };
    const col = (f, k, dos) => `<section class="ru-col m${k + 1}${dos ? ' dos' : ''}">` +
      `<div class="ru-fcab"><span class="ru-fico">${ico(f.icono)}</span><span class="ru-fm">Momento ${k + 1}<b>${f.i}</b></span><em>${ico(EST[f.estado])}${f.estado}</em></div>` +
      `<h3>${f.fase}</h3><p class="ru-sub">${f.sub} · ${f.cuando}</p>` +
      `<p class="ru-prop"><b>${ico('diana')}Propósito específico ${k + 1}</b>${f.corto}</p>` +
      `<ol class="ru-acts">${f.acts.map(a => `<li class="${a.ok ? 'ok' : 'falta'}"><span class="dot">${ico(a.icono)}</span><span><b>${a.t}</b><i>${a.resumen}</i></span></li>`).join('')}</ol>` +
      `<p class="ru-res">${ico('bandera')}<span><b>Resultado</b>${f.resultado}</span></p></section>`;
    izq.el.insertAdjacentHTML('beforeend', `<div class="ru-cab"><span class="rot">${b.label} · Procedimiento de las 3i</span><h2>Ruta<br><em>metodológica</em></h2>` +
      `<div class="ru-ley"><span><i class="ok">${ico('check')}</i>Actividad realizada</span><span><i class="p">${ico('reloj')}</i>Actividad por realizar</span></div></div>` + col(FASES[0], 0, true));
    der.el.insertAdjacentHTML('beforeend', `<div class="ru-par">${col(FASES[1], 1)}${col(FASES[2], 2)}</div>` +
      `<div class="ru-nota">${b.note || ''}</div>`);
    izq.folio = der.folio = false;
    this.y = ALTO_CAJA; this.banda = null;
  }
  fondo(src, lado) {
    const f = h('div', 'fondo' + (lado ? ' fondo-' + lado : '')); f.style.backgroundImage = `url("${src}")`; return f;
  }
  // Pliego con una sola imagen continua que cruza el lomo; empieza siempre en página par
  pliegoFondo(src, clase = '') {
    if (this.siguienteEsDerecha) this.pagina('blanca', { folio: false });
    const izq = this.pagina('noche fondo-pliego ' + clase, { folio: false }); izq.el.appendChild(this.fondo(src, 'izq'));
    const der = this.pagina('noche fondo-pliego ' + clase, { folio: false }); der.el.appendChild(this.fondo(src, 'der'));
    return [izq, der];
  }
  umbral() {
    const [, der] = this.pliegoFondo(this.deco.umbral, 'umbral');
    const up = h('div', 'panel-vidrio umbral-panel', '<b>Sobre lo<br>que no digo</b>'); der.el.appendChild(up); this.liquido(up, 0.75 * PX);
  }
  portadilla(parte) {
    this.aDerecha();
    const p = this.pagina('', { folio: false });
    const c = h('div', 'portadilla'); const tt = h('p', 'titulo', parte.titulo.html.replace(/\s+-\s+/, '<br><small>')); c.appendChild(tt);
    parte.datos.forEach(b => { const q = h('p', '', b.html); const m = b.html.match(/^<strong>([^<:]+)(?::<\/strong>|<\/strong>:)\s*(.*)$/s); if (m) q.innerHTML = `<b class="fl">${m[1]}:</b> <span class="fv">${m[2]}</span>`; c.appendChild(q); });
    p.el.appendChild(c);
  }
  // Si la página que sigue sería izquierda, se deja una en blanco: lo que abre empieza a la derecha
  aIzquierda() { if (this.siguienteEsDerecha) this.pagina('blanca', { folio: false }); }
  aDerecha() { if (!this.siguienteEsDerecha) this.pagina('blanca', { folio: false }); }
  preliminar(parte, apretar = false, holgado = false) {
    this.modo = 'una'; this.seccionActual = parte.titulo ? textoPlano(parte.titulo.html) : this.seccionActual;
    const nom = parte.titulo ? textoPlano(parte.titulo.html) : '';
    if (!apretar && !holgado && nom) {
      if (/^Resumen/i.test(nom) && !this.umbralHecho) { this.umbralHecho = true; this.umbral(); }
      // Notas y agradecimientos van por parejas enfrentadas; lo demás abre a la derecha
      if (/^(Nota de responsabilidad|Agradecimientos)/i.test(nom)) this.aIzquierda();
      else if (!/^(Nota de aceptación|Dedicatoria)/i.test(nom)) this.aDerecha();
    }
    this.sinCapitular = /^Agradecimientos/i.test(nom);
    const desde = this.paginas.length;
    const p = this.pagina('p-una' + (apretar ? ' apretado' : ''));
    if (parte.titulo) {
      const cab = h('div', 'pre-cab', `<span class="tag">${parte.titulo.pre ? 'Preliminares' : 'Sobre lo que no digo'}</span><h2>${textoPlano(parte.titulo.html)}</h2>`);
      this.marcar(cab, parte.titulo.id);
      p.caja.appendChild(cab); this.y = enRenglon(cab.offsetHeight) + (apretar ? 1 : 2) * L;
    }
    this.fluir(parte.bloques); this.sinCapitular = false;
    const hechas = this.paginas.slice(desde);
    // Fichas: «Campo: valor» como tabla de datos; la nota de aceptación con líneas de firma
    if (/^(Nota de autor|Nota de aceptación)/i.test(nom)) hechas.forEach(x => {
      x.el.classList.add(/aceptación/i.test(nom) ? 'pre-firmas' : 'pre-ficha');
      x.caja.querySelectorAll('p').forEach(q => { const m = q.innerHTML.match(/^([^:<]{2,40}):\s*(.*)$/s); if (m) q.innerHTML = `<b class="fl">${m[1]}:</b> <span class="fv">${m[2]}</span>`; });
    });
    // Si solo unas líneas pasan a otra página, se recompone más ajustado para que quepa en una
    if (!apretar && !holgado && hechas.length === 2 && hechas[1].caja.innerText.length < 600) {
      hechas.forEach(x => x.el.remove()); this.paginas.length = desde;
      return this.preliminar(parte, true);
    }
    // Si ni ajustado cabe en una, se vuelve a la versión holgada en dos páginas
    if (apretar && hechas.length > 1) {
      hechas.forEach(x => x.el.remove()); this.paginas.length = desde;
      return this.preliminar(parte, false, true);
    }
    // Un preliminar corto no flota arriba en una página vacía: baja al tercio inferior
    if (hechas.length === 1 && this.y < ALTO_CAJA * 0.45) {
      const baja = ALTO_CAJA * 0.4;
      [...p.caja.children].forEach(c => { c.style.position = c.style.position || 'relative'; c.style.top = (parseFloat(c.style.top) || 0) + baja + 'px'; });
      p.el.classList.add('pre-corto');
    }
  }
  indiceDoc() {
    this.modo = 'una'; this.seccionActual = 'Tabla de contenido';
    // Pliego propio en morado: el título grande a la izquierda y la lista a la derecha
    if (this.siguienteEsDerecha) this.pagina('blanca', { folio: false });
    const t = this.pagina('oscura toc-izq', { folio: false });
    t.el.appendChild(h('div', 'toc-titulo', '<span>Preliminares</span><h2>Tabla de<br>contenido</h2>'));
    this.claseFlujo = 'oscura toc';
    const p = this.pagina('p-una oscura toc');
    this.y = 0;
    // Las filas se componen ya (para saber cuántas páginas ocupa); los números se ponen al final.
    this.filasIndice = [];
    for (const e of this.entradasIndice) {
      const f = h('a', 'fila n' + e.nivel, `<span class="n">${e.nivel === 1 ? '' : e.n}</span><span>${e.nivel === 1 && e.n ? e.n + ' · ' + e.t : e.t}</span><span class="p">000</span>`);
      this.filasIndice.push([f, e.id]); this.agregarTexto(f);
    }
    // Listas de figuras y de tablas (APA): cada una abre página dentro del mismo pliego morado
    for (const [titulo, tipo, pre] of [['Lista de figuras', 'figure', 'Figura'], ['Lista de tablas', 'table', 'Tabla']]) {
      const items = (this.listas?.[tipo] || []).slice().sort((a, b) => parseInt(a.label.replace(/\D+/g, '')) - parseInt(b.label.replace(/\D+/g, '')));
      if (!items.length) continue;
      this.cerrarBanda(); this.paginaFlujo();
      const cab = h('h2', 'lista-tit', titulo); this.agregarTexto(cab);
      for (const it of items) {
        const f = h('a', 'fila n2', `<span class="n">${it.label.replace(pre + ' ', '')}</span><span>${textoPlano(it.title || '')}</span><span class="p">000</span>`);
        this.filasIndice.push([f, it.id]); this.agregarTexto(f);
      }
    }
    this.cerrarBanda(); this.claseFlujo = '';
  }
  capitulo(parte) {
    this.cerrarBanda(); this.vaciarFlotantes();
    this.seccionActual = `Capítulo ${parte.num}. ${parte.nombre}`;
    // Apertura: un pliego con un solo fondo. Número a la izquierda; a la derecha, sobre cristal,
    // el título, el lema y lo que trae el capítulo. La página anterior, si sobra, queda en blanco.
    // Izquierda: la imagen del capítulo a sangre, nítida. Derecha: papel lila con título e índice.
    // Apertura (propuesta avanzada «Doble 1»): foto real del trabajo de campo a sangre a la izquierda,
    // página morada a la derecha con el número en contorno, título con acento dorado e índice.
    this.aIzquierda();
    const izq = this.pagina('noche ap-foto', { folio: false });
    izq.el.appendChild(this.fondo(this.deco['foto' + parte.num] || this.deco['cap' + parte.num]));
    izq.el.appendChild(h('span', 'ap-credito', parte.num === '1' ? 'Imagen generada con IA (Google Flow), 2026' : 'Taller de cocreación «Sobre lo que no dices», 2026'));
    const lente = h('span', 'burbuja ap-lente'); izq.el.appendChild(lente);
    pieza(lente, 'lente-cap' + parte.num, 2.4 * PX, { ca: 4, ff: 0.3, pf: 0.1, fondo: 'rgba(255,255,255,0.06)', sombra: '0 22px 44px rgba(0,0,0,0.45)' });
    const der = this.pagina('noche ap-morada', { folio: false });
    der.el.appendChild(h('div', 'ap-contorno', parte.num.padStart(2, '0')));
    const panel = h('div', 'ap-panel');
    panel.appendChild(h('div', 'ap-tag', `Capítulo ${parte.num} · ${parte.nombre}`));
    const tit = TITULOS[parte.nombre.toLowerCase()] || parte.nombre;
    const lema = LEMAS[parte.nombre.toLowerCase()] || '';
    const resto = lema.toLowerCase().startsWith(tit.toLowerCase()) ? lema.slice(tit.length).trim() : '';
    panel.appendChild(h('h1', 'ap-titulo', `${tit}${resto ? ` <em>${resto}</em>` : ''}`));
    if (lema && !resto) panel.appendChild(h('div', 'ap-lema', lema));
    panel.appendChild(h('em', 'ap-en', 'En este capítulo'));
    const ind = h('div', 'an-lista'); panel.appendChild(ind);
    der.el.appendChild(panel);
    parte.aperturaIndice = ind;
    this.marcar(izq.el, parte.titulo.id);
    this.modo = 'dos';
    parte.secciones.forEach((s, k) => this.seccion(s, k));
  }
  // «Doble 2»: la pregunta de investigación sola, en una página dorada con las ideas clave subrayadas
  pregunta(s) {
    const [n, t] = separarTitulo(s.titulo);
    const p = this.pagina('pag-pregunta'); p.flujo = true;
    let q = s.bloques[0].html;
    ['estrategia de diseño participativo', 'experiencia phygital', 'elaboración emocional'].forEach(k => { q = q.replace(k, `<u>${k}</u>`); });
    const d = h('div', 'pq-dorada', `<span class="pq-tag">${n} · ${t}</span><span class="pq-comillas">“</span><p>${q}</p><span class="pq-firma">Pregunta de investigación</span>`);
    d.querySelector('p').dataset.b = s.bloques[0].id; this.marcar(d, s.titulo.id);
    p.caja.appendChild(d); this.y = ALTO_CAJA;
  }
  // «Doble 3»: las 3i a doble página antes de la metodología
  tresI() {
    this.aIzquierda();
    const izq = this.pagina('noche tres-i', { folio: false });
    izq.el.insertAdjacentHTML('beforeend', `<span class="ti-tag">Procedimiento metodológico</span><div class="ti-tri"><span><i>I</i>ndagar</span><span><i>I</i>dear</span><span><i>I</i>mplementar</span></div><div class="ti-desc"><div><b>Indagar</b><span>Cartografía digital, taller y entrevista para identificar causas, dinámicas y consecuencias del malestar.</span></div><div><b>Idear</b><span>Talleres de cocreación artística y obras piloto.</span></div><div><b>Implementar</b><span>Experiencia phygital con MetafoRA y su evaluación.</span></div></div>`);
    const der = this.pagina('noche tres-i-foto', { folio: false });
    der.el.appendChild(this.fondo(this.deco.foto3i));
    const card = h('div', 'panel-vidrio ti-card', `<span>Enfoque</span><h3>Investigación-Creación cualitativa</h3><p>Diseño participativo y colaborativo, enfoque etnográfico y el procedimiento de las 3i: Indagar, Idear e Implementar.</p>`);
    card.classList.add('esmerilado'); der.el.appendChild(card);
  }
  seccion(s, k) {
    // Cada sección 1.x abre página: cabecera amplia con número, título, pictograma y cristal
    this.cerrarBanda(); this.vaciarFlotantes(); this.emitirRuta(); this.emitirPaleta();
    const sola = s.bloques.length === 1 && s.bloques[0].type === 'p' && textoPlano(s.bloques[0].html).length < 320;
    if (s.titulo && sola) return this.pregunta(s);
    if (s.titulo && /^2\.1\b/.test(textoPlano(s.titulo.html))) this.tresI();
    const p = this.pagina('');
    p.flujo = true;
    if (s.titulo) {
      const [n, t] = separarTitulo(s.titulo);
      const cab = h('div', 'seccion-cab', `<span class="num"><b>${n}</b>${this.seccionActual.replace(/^Capítulo \d+\. /, '')}</span><h2><span>${t}</span></h2>`);
      this.marcar(cab, s.titulo.id);
      cab.style.position = 'absolute'; cab.style.left = '0'; cab.style.right = '0'; cab.style.top = AIRE_SECCION + 'px';
      const pic = h('div', 'sec-picto', pictograma(t));
      cab.appendChild(pic);
      p.caja.appendChild(cab);
      // La burbuja de cristal se posa sobre el pictograma, como una lente que lo amplía
      const tam = 1.55 * PX, bur = h('span', 'burbuja');
      bur.style.cssText = `left:${pic.offsetLeft + pic.offsetWidth * 0.28 - tam / 2}px;top:${pic.offsetTop + pic.offsetHeight * 0.7 - tam / 2}px`;
      pieza(bur, 'sec-' + s.titulo.id, tam, { ca: 2, ff: 0.22, fondo: 'rgba(43,23,89,0.16)', sombra: 'inset 0 0 0 1.5px rgba(43,23,89,0.25), 0 14px 30px rgba(43,23,89,0.28)' });
      cab.appendChild(bur);
      this.y = AIRE_SECCION + enRenglon(cab.offsetHeight) + 2 * L;
    }
    // Una sección que es una sola frase (p. ej. la pregunta de investigación) se destaca en grande
    if (s.bloques.length === 1 && s.bloques[0].type === 'p' && textoPlano(s.bloques[0].html).length < 320) {
      const e = h('p', 'destacado', s.bloques[0].html); e.dataset.b = s.bloques[0].id;
      e.style.cssText = `position:absolute;left:${1.585 * PX + 0.22 * PX}px;right:0;top:${this.y + 2 * L}px`;
      this.actual.caja.appendChild(e); this.y += enRenglon(e.offsetHeight) + 4 * L;
      return;
    }
    this.fluir(s.bloques);
  }
  // Última doble página antes de las referencias: la cadena de valor del proyecto completa,
  // de la urgencia al proyecto, a lo ancho del pliego
  // Páginas casi vacías: una frase destacada abajo para que no queden en blanco
  citaHueco(frase, firma) {
    const html = `<p>«${frase}»</p>` + (firma ? `<span>${firma}</span>` : '');
    if (this.actual?.flujo && ALTO_CAJA - this.y >= 14 * L) { this.actual.caja.appendChild(h('div', 'cita-hueco', html)); return true; }
    return false;
  }
  cadenaValor() {
    this.cerrarBanda(); this.vaciarFlotantes();
    if (this.paletaPendiente) { this.aIzquierda(); this.emitirPaleta(); }
    this.citaHueco('Que la revelación con realidad aumentada sea la verdadera sorpresa', 'Estilo gráfico');
    this.seccionActual = 'Cadena de valor';
    if (this.siguienteEsDerecha) this.pagina('blanca', { folio: false });
    // La red completa a doble página, a sangre y sobre fondo oscuro
    const svg = redCadena();
    const izq = this.pagina('noche cadena-red red-izq', { folio: false }), der = this.pagina('noche cadena-red red-der', { folio: false });
    izq.el.insertAdjacentHTML('beforeend', `<div class="red-lienzo">${svg}</div><div class="red-cab"><span>Síntesis del sustento teórico</span><h2>Cadena de valor</h2><p>Siete macrocategorías encadenan el problema con la respuesta de diseño. Cada una se abre en categorías, subcategorías y en los autores que las sostienen en este documento.</p></div>`);
    der.el.insertAdjacentHTML('beforeend', `<div class="red-lienzo">${svg}</div><div class="red-ley"><span><i class="m"></i>Macrocategoría</span><span><i class="c"></i>Categoría</span><span><i class="h"></i>Subcategoría · autores</span></div>`);
  }
  referencias(parte) {
    this.modo = 'refs'; this.seccionActual = 'Referencias';
    this.aDerecha();
    const p = this.pagina('');
    const cab = h('div', 'pre-cab', '<span class="tag">Sobre lo que no digo</span><h2>Referencias</h2>'); cab.style.marginLeft = '0';
    this.marcar(cab, parte.titulo.id);
    p.caja.appendChild(cab); this.y = enRenglon(cab.offsetHeight) + 2 * L;
    // Las direcciones web no se separan con guion (se confundirían con parte de la URL)
    const url = t => t?.replace(/(?<!["'=])(https?:\/\/[^\s<]+)/g, '<span class="url">$1</span>');
    this.fluir(parte.bloques.map(b => b.html ? { ...b, html: url(b.html) } : b));
  }
  revela(src, { x, y, r, alto, k }) {
    const c = h('div', 'revela'); if (alto) c.style.bottom = 'auto', c.style.height = alto;
    const url = `url("${src}")`;
    const base = h('div', 'base'); base.style.backgroundImage = url;
    const viva = h('div', 'viva'); viva.style.backgroundImage = url;
    const R = r * PX;
    viva.style.clipPath = `circle(${R}px at ${x * 100}% ${y * 100}%)`;
    const aro = h('div', 'aro'); aro.style.cssText = `left:calc(${x * 100}% - ${R}px);top:calc(${y * 100}% - ${R}px)`;
    pieza(aro, k, 2 * R, { ca: 3, ff: 0.15, fondo: 'rgba(255,255,255,0.02)' }); aro.dataset.cx = x; aro.dataset.cy = y;
    c.append(base, h('div', 'tinte'), viva, aro);
    return c;
  }

  // ── Cierre: folios e índices ──
  terminar() {
    for (const p of this.paginas) {
      if (!p.folio) continue;
      const f = h('div', 'folio', `<span class="num">${p.n}</span><i></i><b>Sobre lo que no digo</b><span>${p.seccion}</span>`);
      p.el.appendChild(f);
    }
  }
}

// ── Cristal editable: cada pieza lleva una clave y su tamaño base; los ajustes del documento
// (doc.cristales[clave] = { dx, dy, s }) la mueven y escalan sin recomponer los pliegos.
function pieza(el, k, lado, op) {
  el.dataset.k = k; el.dataset.lado = lado; el.dataset.op = JSON.stringify(op);
  vidrioDe(el, lado);
}
function vidrioDe(el, lado) {
  const { ca, ff, pf, fondo, sombra } = JSON.parse(el.dataset.op);
  vidrio(el, lado, lado, { ca, fuerza: Math.round(lado * ff), prof: pf ? Math.round(lado * pf) : undefined, fondo, sombra });
}
export function ajustarCristal(el, { dx = 0, dy = 0, s = 1 } = {}) {
  const base = +el.dataset.lado, lado = Math.max(24, base * s), d = (lado - base) / 2;
  vidrioDe(el, lado);
  el.style.translate = `${dx - d}px ${dy - d}px`;
  // La lente de una foto también corre el círculo que deja ver la imagen a color
  if (el.dataset.cx) {
    const viva = el.parentNode.querySelector('.viva');
    if (viva) viva.style.clipPath = `circle(${lado / 2}px at calc(${el.dataset.cx * 100}% + ${dx}px) calc(${el.dataset.cy * 100}% + ${dy}px))`;
  }
}
export function aplicarCristales(raiz, cristales = {}) {
  raiz.querySelectorAll('[data-k]').forEach(el => ajustarCristal(el, cristales[el.dataset.k]));
}

export async function maquetar(doc, { raiz, resolver, deco }) {
  // Las imágenes deben estar cargadas para medir su alto
  const srcs = [];
  doc.blocks.forEach(b => { if (b.type === 'figure') (b.images?.length ? b.images : [b.src]).filter(Boolean).forEach(s => srcs.push(resolver(s))); });
  const dims = {};
  await Promise.all(srcs.map(s => new Promise(ok => { const im = new Image(); im.onload = () => { dims[s] = [im.naturalWidth, im.naturalHeight]; ok(); }; im.onerror = ok; im.src = s; })));
  // Las fuentes web se descargan solo cuando algo las usa: se piden ya, antes de medir
  const muestra = 'AaÁáÉéÍíÓóÚúÑñÜü«»–—“”0123456789';
  await Promise.all(['400', '500', '600', '700', '800', '900', 'italic 400', 'italic 700'].flatMap(w => [document.fonts.load(`${w} 12px Montserrat`, muestra).catch(() => null), document.fonts.load(`${w} 12px "Source Serif 4"`, muestra).catch(() => null)]));
  await document.fonts.ready;

  raiz.innerHTML = '';
  const m = new Maquetador(raiz, resolver, deco), partes = planificar(doc);
  m.dims = dims;
  m.entradasIndice = entradasIndice(partes);
  m.listas = { figure: doc.blocks.filter(b => b.type === 'figure' && b.label), table: doc.blocks.filter(b => b.type === 'table' && b.label) };
  for (const parte of partes) {
    if (parte.tipo === 'portada') m.portada(parte);
    else if (parte.tipo === 'portadilla') m.portadilla(parte);
    else if (parte.tipo === 'preliminar') m.preliminar(parte);
    else if (parte.tipo === 'indice') m.indiceDoc();
    else if (parte.tipo === 'capitulo') m.capitulo(parte);
    else if (parte.tipo === 'referencias') { m.cadenaValor(); m.referencias(parte); }
  }
  m.terminar();

  // Página de cada título (por su id), para el índice y las aperturas
  const pagDe = {};
  m.paginas.forEach(p => p.el.querySelectorAll('[data-id]').forEach(e => { pagDe[e.dataset.id] ??= p.n; }));
  m.paginas.forEach(p => { if (p.el.dataset.id) pagDe[p.el.dataset.id] = p.n; });
  m.paginas.forEach(p => p.el.querySelectorAll('[data-b]').forEach(e => { pagDe[e.dataset.b] ??= p.n; }));
  m.paginas.forEach(p => { p.el.id = 'pag' + p.n; });
  (m.filasIndice || []).forEach(([f, id]) => { const n = pagDe[id]; f.querySelector('.p').textContent = n ?? ''; if (n) f.href = '#pag' + n; });
  for (const parte of partes.filter(x => x.tipo === 'capitulo')) {
    parte.secciones.filter(s => s.titulo).forEach(s => {
      const [n, t] = separarTitulo(s.titulo);
      parte.aperturaIndice.appendChild(h('div', 'an-fila', `${pictograma(t)}<b>${n}</b><span>${t}</span><i>${pagDe[s.titulo.id] ?? ''}</i>`));
    });
  }

  // Pliegos: la 1 va sola a la derecha; luego pares (2–3, 4–5…)
  const pliegos = [[null, m.paginas[0]]];
  for (let k = 1; k < m.paginas.length; k += 2) pliegos.push([m.paginas[k], m.paginas[k + 1] || null]);
  return { paginas: m.paginas, pliegos };
}
