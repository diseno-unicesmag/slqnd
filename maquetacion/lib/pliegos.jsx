// Motor de pliegos: compone el documento en páginas carta enfrentadas, como en InDesign.
// Trabaja sobre el DOM real (fuera de pantalla, a escala 1) para medir: llena bandas de texto
// a dos columnas, parte párrafos donde se acaba la página, coloca figuras y tablas a lo ancho
// (o las pasa a la página siguiente sin cortar el texto) y arma portada, preliminares,
// índice, aperturas de capítulo y referencias.
import { renderToStaticMarkup } from 'react-dom/server';
import Grafico from '@/components/Grafico';
import { esCapitulo, partesCapitulo, textoPlano } from '@/lib/doc';
import { vidrio } from '@/lib/vidrio';

const PX = 96;                      // px por pulgada
const ALTO_CAJA = (11 - 0.8 - 0.95) * PX;
const ESPACIO = 0.24 * PX;          // aire bajo figuras y tablas
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

export class Maquetador {
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
    this.pagina(this.modo === 'una' ? 'p-una' : '').flujo = true;
    // Lo que quedó pendiente de la página anterior va primero
    const pend = this.flotantes; this.flotantes = [];
    for (const f of pend) this.colocarAncho(f, true);
  }

  // ── Bloques → elementos ──
  crear(b, primero) {
    switch (b.type) {
      case 'p': {
        const e = h('p', b.style === 'referencia' ? 'ref' : '', b.html);
        if (primero && this.modo !== 'refs' && textoPlano(b.html).length > 250) e.classList.add('dc', 'sigue');
        return e;
      }
      case 'heading': {
        const [n, t] = separarTitulo(b), lv = Math.min(b.level, 5);
        if (lv <= 3) { const e = h('h3', 't3', (n ? `<span class="n">${n}</span>` : '') + t); e.dataset.id = b.id; return e; }
        if (lv === 4) return h('h4', 't4', (n ? `<span class="n">${n}</span>` : '') + t);
        return h('h5', 't5', (n ? `<span class="n">${n}</span>` : '') + t);
      }
      case 'quote': return h('blockquote', 'cita', b.html);
      case 'list': { const ul = h('ul', 'lista'); b.items.forEach(it => ul.appendChild(h('li', '', it))); return ul; }
      case 'figure': return this.figura(b);
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
        const c = h('div', 'fig-img' + (fuentes.length > 1 ? (fuentes.length > 4 ? ' g8 foto' : fuentes.length > 2 ? ' g4 foto' : ' g2 foto') : ''));
        fuentes.forEach(s => { const im = h('img'); im.src = this.resolver(s); im.alt = b.title || ''; c.appendChild(im); });
        if (fuentes.length === 1) c.firstChild.style.maxHeight = (b.tamano === 'pagina' ? 7.6 : 4.4) + 'in';
        // Imagen vertical: el pie va en la columna 1 y la imagen ocupa las columnas 2 a 4
        const d = fuentes.length === 1 && this.dims?.[this.resolver(fuentes[0])];
        if (d && d[1] / d[0] > 0.85 && b.tamano !== 'pagina') f.classList.add('lateral');
        if (fuentes.length > 4) c.querySelectorAll('img').forEach(im => { im.style.aspectRatio = '9 / 16'; });
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
    if (this.banda.children.length) this.y += this.banda.offsetHeight + (this.banda.lastElementChild ? 6 : 0);
    else this.banda.remove();
    this.banda = null;
  }
  agregarTexto(el, guardia = 0) {
    if (!this.banda && ALTO_CAJA - this.y < 0.5 * PX && guardia < 3) this.paginaFlujo();
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
    const yTent = this.banda ? this.y + this.banda.offsetHeight + 6 : this.y;
    el.style.position = 'absolute'; el.style.left = '0'; el.style.right = '0'; el.style.top = yTent + 'px';
    this.actual.caja.appendChild(el);
    const libreTent = ALTO_CAJA - yTent;
    const partirTabla = el.classList.contains('tabla') && (libreTent >= MIN_TABLA || alInicio);
    if (this.banda && el.offsetHeight > libreTent && !partirTabla) { el.remove(); el.style.top = ''; this.flotantes.push(el); return; }
    this.cerrarBanda(); el.style.top = this.y + 'px';
    const alto = el.offsetHeight, libre = ALTO_CAJA - this.y;
    if (alto <= libre) { this.y += alto + ESPACIO; return; }
    if (el.classList.contains('tabla') && (libre >= MIN_TABLA || alInicio)) { this.partirTabla(el, libre); return; }
    if (this.y === 0) { // ni en página vacía: se ajusta la imagen
      el.querySelectorAll('.fig-img img').forEach(im => { im.style.maxHeight = Math.max(2 * PX, libre - (alto - im.offsetHeight) - 10) + 'px'; });
      this.y += el.offsetHeight + ESPACIO; return;
    }
    el.remove(); el.style.top = '';
    this.flotantes.push(el);   // sigue el texto; la figura abre la próxima página
  }
  partirTabla(el, libre) {
    const filas = [...el.querySelectorAll('tbody tr')], cab = el.querySelector('thead');
    const nota = el.querySelector('.nota'); if (nota) nota.remove();
    let k = filas.length;
    while (k > 1 && el.offsetHeight > libre) { k--; filas[k].remove(); }
    this.y += el.offsetHeight + ESPACIO;
    const sigue = h('figure', 'ancho tabla'); sigue.dataset.b = el.dataset.b; sigue.dataset.cont = '1';
    sigue.appendChild(h('span', 'rot', el.querySelector('.rot').textContent + ' (continuación)'));
    const t = h('table'); if (cab) t.appendChild(cab.cloneNode(true));
    const tb = h('tbody'); filas.slice(k).forEach(f => tb.appendChild(f)); t.appendChild(tb); sigue.appendChild(t);
    if (nota) sigue.appendChild(nota);
    if (!filas.slice(k).length) { if (nota) { el.appendChild(nota); } return; }
    this.paginaFlujo(); this.colocarAncho(sigue, true);
  }
  vaciarFlotantes() { while (this.flotantes.length) { this.paginaFlujo(); } }

  fluir(bloques) {
    let primero = true;
    for (const b of bloques) {
      const el = this.crear(b, primero && b.type === 'p');
      if (!el) continue;
      el.dataset.b = b.id;
      if (b.type === 'p') primero = false;
      if (b.type === 'heading') primero = false;
      if (el.classList.contains('ancho')) this.colocarAncho(el); else this.agregarTexto(el);
    }
    this.cerrarBanda();
    this.vaciarFlotantes();
  }

  // ── Partes ──
  portada(parte) {
    const p = this.pagina('noche portada', { folio: false });
    const t = textoPlano(parte.titulo.html), [titulo, ...sub] = t.split(/\s+[-–]\s+/);
    // La lente cae sobre el ojo: revela en color lo que el resto de la imagen calla
    p.el.appendChild(this.revela(this.deco.portada, { x: 0.5, y: 0.49, r: 1.45, alto: '62%' }));
    p.el.appendChild(h('div', 'por-cab', 'Proyecto de Grado · Diseño Gráfico'));
    const tt = h('div', 'por-titulo');
    tt.appendChild(h('h1', 'logo', titulo.replace(/^(.*?)\s+no\s+(.*)$/, '$1<br>no $2')));
    tt.appendChild(h('p', '', sub.join(' – ').replace(/phygital/i, '<em>phygital</em>')));
    p.el.appendChild(tt);
    const datos = parte.datos.map(b => b.html);
    p.el.appendChild(h('div', 'por-datos', `<div>${datos.slice(0, -1).join('<br>')}</div><div><b>${textoPlano(datos[datos.length - 1] || '')}</b></div>`));
  }
  portadilla(parte) {
    const p = this.pagina('', { folio: false });
    const c = h('div', 'portadilla'); c.appendChild(h('p', 'titulo', parte.titulo.html));
    parte.datos.forEach(b => c.appendChild(h('p', '', b.html)));
    p.el.appendChild(c);
  }
  preliminar(parte, apretar = false) {
    this.modo = 'una'; this.seccionActual = parte.titulo ? textoPlano(parte.titulo.html) : this.seccionActual;
    const desde = this.paginas.length;
    const p = this.pagina('p-una' + (apretar ? ' apretado' : ''));
    if (parte.titulo) {
      const cab = h('div', 'pre-cab', `<span class="tag">${parte.titulo.pre ? 'Preliminares' : 'Sobre lo que no digo'}</span><h2>${textoPlano(parte.titulo.html)}</h2>`);
      this.marcar(cab, parte.titulo.id);
      p.caja.appendChild(cab); this.y = cab.offsetHeight + (apretar ? 0.14 : 0.3) * PX;
    }
    this.fluir(parte.bloques);
    const hechas = this.paginas.slice(desde);
    // Si solo unas líneas pasan a otra página, se recompone más ajustado para que quepa en una
    if (!apretar && hechas.length === 2 && hechas[1].caja.innerText.length < 600) {
      hechas.forEach(x => x.el.remove()); this.paginas.length = desde;
      return this.preliminar(parte, true);
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
    const p = this.pagina('p-una');
    const cab = h('div', 'pre-cab', '<span class="tag">Preliminares</span><h2>Tabla de contenido</h2>');
    p.caja.appendChild(cab); this.y = cab.offsetHeight + 0.3 * PX;
    // Las filas se componen ya (para saber cuántas páginas ocupa); los números se ponen al final.
    this.filasIndice = [];
    for (const e of this.entradasIndice) {
      const f = h('div', 'fila n' + e.nivel, `<span class="n">${e.nivel === 1 ? '' : e.n}</span><span>${e.nivel === 1 && e.n ? e.n + ' · ' + e.t : e.t}</span><span class="p">000</span>`);
      this.filasIndice.push([f, e.id]); this.agregarTexto(f);
    }
    this.cerrarBanda();
  }
  capitulo(parte) {
    this.seccionActual = `Capítulo ${parte.num}. ${parte.nombre}`;
    if (this.siguienteEsDerecha) {        // la apertura ocupa un pliego completo: empieza en página par
      const pausa = this.pagina('noche pausa', { folio: false });
      pausa.el.appendChild(this.revela(this.deco.intro, { x: 0.5, y: 0.55, r: 1.3 }));
    }
    // Apertura a un color: el pliego entero en morado; la foto va en duotono y la lente la revela
    const izq = this.pagina('oscura ap-izq', { folio: false });
    izq.el.appendChild(this.revela(this.deco['cap' + parte.num] || this.deco.intro, { x: 0.7, y: 0.36, r: 1.75 }));
    izq.el.appendChild(h('div', 'ap-num', parte.num.padStart(2, '0')));
    izq.el.appendChild(h('div', 'pie-foto', parte.num === '1' ? 'Sesión de la Cartografía Digital de Percepción Silenciosa (CDPS)' : 'Taller «Sobre lo que no dices»'));
    const der = this.pagina('oscura apertura', { folio: false });
    der.el.appendChild(h('div', 'ap-linea', 'Sobre lo que no digo'));
    const tt = h('div', ''); tt.style.cssText = 'position:absolute;left:.8in;right:.5in;top:3.6in';
    tt.appendChild(h('div', 'ap-tag', 'Capítulo ' + parte.num));
    const t1 = h('h1', 'ap-titulo', `<span>${parte.nombre}</span>`);
    tt.appendChild(t1); der.el.appendChild(tt);
    // La burbuja se posa sobre las últimas letras del nombre
    const bur = h('span', 'burbuja'); bur.style.cssText = `left:${t1.firstChild.offsetWidth - 1.25 * PX}px;top:${t1.offsetHeight * 0.56 - 0.85 * PX}px`;
    vidrio(bur, 1.7 * PX, 1.7 * PX, { ca: 3 });
    t1.appendChild(bur);
    const ind = h('div', 'ap-indice'); der.el.appendChild(ind);
    this.marcar(izq.el, parte.titulo.id);
    parte.aperturaIndice = ind;
    this.modo = 'dos';
    parte.secciones.forEach((s, k) => this.seccion(s, k));
  }
  seccion(s, k) {
    // Una sección 1.x abre página, salvo que en la actual quede buen espacio: ahí sigue debajo
    this.cerrarBanda();
    const sigue = this.actual?.flujo && !this.flotantes.length && ALTO_CAJA - this.y >= 3.6 * PX;
    const p = sigue ? this.actual : this.pagina('');
    p.flujo = true;
    if (sigue) this.y += 0.3 * PX;
    if (s.titulo) {
      const [n, t] = separarTitulo(s.titulo);
      const cab = h('div', 'seccion-cab', `<span class="num"><b>${n}</b>${this.seccionActual.replace(/^Capítulo \d+\. /, '')}</span><h2><span>${t}</span></h2>`);
      this.marcar(cab, s.titulo.id);
      cab.style.position = 'absolute'; cab.style.left = '0'; cab.style.right = '0'; cab.style.top = this.y + 'px';
      p.caja.appendChild(cab);
      // La burbuja de cristal se cruza con el final del título; solo en secciones que abren página
      if (!sigue) {
      const rs = [...cab.querySelector('h2 span').getClientRects()], ult = rs[rs.length - 1], C = cab.getBoundingClientRect();
      const tam = [0.82, 0.68, 0.95][k % 3] * PX, dy = [-0.06, 0.04, -0.1][k % 3];
      const bur = h('span', 'burbuja');
      bur.style.cssText = `left:${Math.min(ult.right - C.left - tam * 0.62, C.width - tam)}px;top:${ult.top - C.top + ult.height / 2 - tam / 2 + dy * tam}px`;
      vidrio(bur, tam, tam, { ca: 2 });
      cab.appendChild(bur);
      }
      this.y += cab.offsetHeight + 0.26 * PX;
    }
    this.fluir(s.bloques);
  }
  referencias(parte) {
    this.modo = 'refs'; this.seccionActual = 'Referencias';
    const p = this.pagina('');
    const cab = h('div', 'pre-cab', '<span class="tag">Sobre lo que no digo</span><h2>Referencias</h2>'); cab.style.marginLeft = '0';
    this.marcar(cab, parte.titulo.id);
    p.caja.appendChild(cab); this.y = cab.offsetHeight + 0.3 * PX;
    this.fluir(parte.bloques);
  }
  revela(src, { x, y, r, alto }) {
    const c = h('div', 'revela'); if (alto) c.style.bottom = 'auto', c.style.height = alto;
    const url = `url("${src}")`;
    const base = h('div', 'base'); base.style.backgroundImage = url;
    const viva = h('div', 'viva'); viva.style.backgroundImage = url;
    const R = r * PX;
    viva.style.clipPath = `circle(${R}px at ${x * 100}% ${y * 100}%)`;
    const aro = h('div', 'aro'); aro.style.cssText = `left:calc(${x * 100}% - ${R}px);top:calc(${y * 100}% - ${R}px)`;
    vidrio(aro, 2 * R, 2 * R, { ca: 3, fondo: 'rgba(255,255,255,0.02)' });
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

export async function maquetar(doc, { raiz, resolver, deco }) {
  // Las imágenes deben estar cargadas para medir su alto
  const srcs = [];
  doc.blocks.forEach(b => { if (b.type === 'figure') (b.images?.length ? b.images : [b.src]).filter(Boolean).forEach(s => srcs.push(resolver(s))); });
  const dims = {};
  await Promise.all(srcs.map(s => new Promise(ok => { const im = new Image(); im.onload = () => { dims[s] = [im.naturalWidth, im.naturalHeight]; ok(); }; im.onerror = ok; im.src = s; })));
  // Las fuentes web se descargan solo cuando algo las usa: se piden ya, antes de medir
  const muestra = 'AaÁáÉéÍíÓóÚúÑñÜü«»–—“”0123456789';
  await Promise.all(['400', '500', '600', '700', '800', '900', 'italic 400', 'italic 700'].map(w => document.fonts.load(`${w} 12px Montserrat`, muestra).catch(() => null)));
  await document.fonts.ready;

  raiz.innerHTML = '';
  const m = new Maquetador(raiz, resolver, deco), partes = planificar(doc);
  m.dims = dims;
  m.entradasIndice = entradasIndice(partes);
  for (const parte of partes) {
    if (parte.tipo === 'portada') m.portada(parte);
    else if (parte.tipo === 'portadilla') m.portadilla(parte);
    else if (parte.tipo === 'preliminar') m.preliminar(parte);
    else if (parte.tipo === 'indice') m.indiceDoc();
    else if (parte.tipo === 'capitulo') m.capitulo(parte);
    else if (parte.tipo === 'referencias') m.referencias(parte);
  }
  m.terminar();

  // Página de cada título (por su id), para el índice y las aperturas
  const pagDe = {};
  m.paginas.forEach(p => p.el.querySelectorAll('[data-id]').forEach(e => { pagDe[e.dataset.id] ??= p.n; }));
  m.paginas.forEach(p => { if (p.el.dataset.id) pagDe[p.el.dataset.id] = p.n; });
  (m.filasIndice || []).forEach(([f, id]) => { f.querySelector('.p').textContent = pagDe[id] ?? ''; });
  for (const parte of partes.filter(x => x.tipo === 'capitulo')) {
    parte.secciones.filter(s => s.titulo).forEach(s => {
      const [n, t] = separarTitulo(s.titulo);
      parte.aperturaIndice.appendChild(h('div', '', `<b>${n}</b><span>${t}</span><span>${pagDe[s.titulo.id] ?? ''}</span>`));
    });
  }

  // Pliegos: la 1 va sola a la derecha; luego pares (2–3, 4–5…)
  const pliegos = [[null, m.paginas[0]]];
  for (let k = 1; k < m.paginas.length; k += 2) pliegos.push([m.paginas[k], m.paginas[k + 1] || null]);
  return { paginas: m.paginas, pliegos };
}
