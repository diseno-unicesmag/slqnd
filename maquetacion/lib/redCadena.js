// Cadena de valor como red (a la manera de ATLAS.ti): núcleo, macrocategorías, categorías y
// subcategorías con sus autores, en dos abanicos que dejan el lomo libre.
import { CADENA } from './cadena';

export const W = 1632, H = 1056, CX = W / 2, CY = H / 2 + 48;
// color sólido mezclado con el fondo: cada nivel de la red un poco más oscuro, sin transparencias
const tono = (hex, t) => '#' + [1, 3, 5].map(i => { const a = parseInt(hex.slice(i, i + 2), 16), b = parseInt('120d26'.slice(i - 1, i + 1), 16); return Math.round(a + (b - a) * t).toString(16).padStart(2, '0'); }).join('');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function redCadena() {
  const hojas = m => m.cats.reduce((a, c) => a + c.subs.length, 0);
  // reparto de macrocategorías entre los dos lados, equilibrando hojas
  const total = CADENA.reduce((a, m) => a + hojas(m), 0);
  // el corte que deja los dos lados más parejos
  let acc = 0, corte = 1, mejor = Infinity;
  CADENA.forEach((m, i) => { acc += hojas(m); const d = Math.abs(total - 2 * acc); if (d < mejor) { mejor = d; corte = i + 1; } });
  const lados = [CADENA.slice(0, corte), CADENA.slice(corte)];
  const nodos = [], lazos = [], textos = [], nucleo = [];
  const pos = (ang, rx, ry) => [CX + Math.cos(ang) * rx, CY + Math.sin(ang) * ry];
  lados.forEach((ms, li) => {
    const n = ms.reduce((a, m) => a + hojas(m), 0) + (ms.length - 1) * 0.8;
    // las subcategorías van con el mismo aire vertical entre sí, sobre el borde de una elipse,
    // y se leen de arriba abajo en cada lado (01 a 03 a la derecha, 04 a 07 a la izquierda)
    const yA = 196, yB = 968, RX = 540, RY = 470;
    let k = 0;
    const hoja = t => {
      const f = t / Math.max(1, n - 1), y = yA + (yB - yA) * f;
      const dx = RX * Math.sqrt(Math.max(0, 1 - ((y - CY) / RY) ** 2));
      return [li === 0 ? CX + dx : CX - dx, y];
    };
    const angDe = ([x, y]) => { const a = Math.atan2((y - CY) / RY, (x - CX) / RX); return li === 1 && a < 0 ? a + 2 * Math.PI : a; }; // sin salto en ±180°
    ms.forEach(m => {
      const angsM = [];
      m.cats.forEach(c => {
        const ps = c.subs.map(() => hoja(k++)), angsC = ps.map(angDe);
        const ac = angsC.reduce((a, x) => a + x, 0) / angsC.length;
        angsM.push(...angsC);
        const [cx, cy] = pos(ac, 410, 300);
        c.subs.forEach(([t, au], j) => {
          const [x, y] = ps[j];
          lazos.push({ a: [cx, cy], b: [x, y], c: tono(m.c, 0.5), w: 1.1 });
          nodos.push({ x, y, r: 4.5, c: m.c, t: 'h' });
          const der = li === 0, tx = x + (der ? 10 : -10);
          textos.push(`<text x="${tx}" y="${y - 1}" text-anchor="${der ? 'start' : 'end'}" class="rh">${esc(t)}</text><text x="${tx}" y="${y + 10}" text-anchor="${der ? 'start' : 'end'}" class="ra">${esc(au.length > 44 ? au.slice(0, 42).replace(/[;,]?\s*\S*$/, "") + "…" : au)}</text>`);
        });
        c._p = [cx, cy];
        nodos.push({ x: cx, y: cy, r: 7, c: m.c, t: 'c' });
        const der = li === 0;
        textos.push(`<text x="${cx + (der ? -10 : 10)}" y="${cy - 10}" text-anchor="${der ? 'end' : 'start'}" class="rc">${esc(c.t)}</text>`);
      });
      k += 0.8;
      const am = angsM.reduce((a, x) => a + x, 0) / angsM.length;
      const [mx, my] = pos(am, 228, 182);
      m.cats.forEach(c => lazos.push({ a: [mx, my], b: c._p, c: tono(m.c, 0.28), w: 2 }));
      lazos.push({ a: [CX, CY], b: [mx, my], c: m.c, w: 3.2 }); nucleo.push([Math.atan2(my - CY, mx - CX), m.c]);
      nodos.push({ x: mx, y: my, r: 17, c: m.c, t: 'm', n: m.n });
      const der = li === 0;
      const lx = mx + (der ? -46 : 46); // el rótulo se corre hacia el núcleo para no tocar las categorías
      textos.push(`<text x="${lx}" y="${my + 32}" text-anchor="middle" class="rm">${esc(m.t)}</text><text x="${lx}" y="${my + 44}" text-anchor="middle" class="rs">${esc(m.s)}</text>`);
    });
  });
  const curva = ({ a: [x1, y1], b: [x2, y2] }) => { const mx = (x1 + x2) / 2; return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`; };
  // telaraña de fondo: anillos punteados
  const anillos = [[215, 165], [410, 300], [600, 430], [790, 560]].map(([rx, ry], i) => `<ellipse cx="${CX}" cy="${CY}" rx="${rx}" ry="${ry}" fill="none" stroke="rgba(255,255,255,${i === 3 ? .14 : .24})" stroke-width="1.3" stroke-linecap="round" stroke-dasharray="0.1 7"/>`).join('');
  // núcleo: sin pictograma; debajo, un halo con los colores de cada macrocategoría para que el
  // cristal líquido que va encima (en pliegos.jsx) los refleje y los doble
  const halo = `<defs><filter id="rn-halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter></defs><g filter="url(#rn-halo)">` +
    nucleo.map(([a, c]) => `<circle cx="${(CX + Math.cos(a) * 34).toFixed(1)}" cy="${(CY + Math.sin(a) * 34).toFixed(1)}" r="22" fill="${c}"/>`).join('') + '</g>';
  // Los textos no llevan contorno (sobre el degradado se veía como un parche oscuro): en su lugar,
  // una máscara borra las líneas y los anillos justo detrás de cada texto y dentro de cada nodo hueco
  const mascara = `<mask id="rn-m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>` +
    `<g fill="#000" stroke="#000" stroke-width="7" stroke-linejoin="round">${textos.join('').replace(/fill:[^;}]+/g, '')}</g>` +
    nodos.filter(n => n.t === 'h').map(n => `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="#000"/>`).join('') + '</mask>';
  // Núcleo: esfera de cristal transparente en el mismo dibujo (una sola pieza sobre el lomo): deja ver
  // el halo de colores, refleja cada color en su borde, brillo arriba a la izquierda y canto fino
  const R0 = 56;
  const esfera = `<defs>` +
    `<clipPath id="rn-esf"><circle cx="${CX}" cy="${CY}" r="${R0}"/></clipPath>` +
    `<radialGradient id="rn-cuerpo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".02"/><stop offset=".72" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".28"/></radialGradient>` +
    `<radialGradient id="rn-brillo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<filter id="rn-suave" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>` +
    `<filter id="rn-sombra" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter></defs>` +
    `<ellipse cx="${CX}" cy="${CY + R0 * 0.9}" rx="${R0 * 0.8}" ry="${R0 * 0.18}" fill="#000" opacity=".45" filter="url(#rn-sombra)"/>` +
    `<g clip-path="url(#rn-esf)"><circle cx="${CX}" cy="${CY}" r="${R0}" fill="url(#rn-cuerpo)"/>` +
    `<g filter="url(#rn-suave)" opacity=".9">` + nucleo.map(([a, c]) => `<circle cx="${(CX + Math.cos(a) * R0 * 0.95).toFixed(1)}" cy="${(CY + Math.sin(a) * R0 * 0.95).toFixed(1)}" r="12" fill="${c}"/>`).join('') + `</g>` + `<circle cx="${CX}" cy="${CY}" r="${R0 * 0.55}" fill="#120d26" opacity=".18" filter="url(#rn-suave)"/>` +
    `<ellipse cx="${CX - R0 * 0.32}" cy="${CY - R0 * 0.48}" rx="${R0 * 0.46}" ry="${R0 * 0.2}" transform="rotate(-28 ${CX - R0 * 0.32} ${CY - R0 * 0.48})" fill="url(#rn-brillo)"/>` +
    `<ellipse cx="${CX + R0 * 0.42}" cy="${CY + R0 * 0.6}" rx="${R0 * 0.22}" ry="${R0 * 0.07}" transform="rotate(-35 ${CX + R0 * 0.42} ${CY + R0 * 0.6})" fill="#fff" opacity=".35" filter="url(#rn-suave)"/></g>` +
    `<circle cx="${CX}" cy="${CY}" r="${R0 - 0.6}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>`;
  return `<svg class="red-cadena" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<style>.rh{font:700 9.5px Montserrat;fill:#fff}.ra{font:500 8px Montserrat;fill:rgba(255,255,255,.6)}.rc{font:800 10.5px Montserrat;fill:#fff}.rm{font:900 13px Montserrat;fill:#fff}.rs{font:700 8px Montserrat;fill:#f5c542;letter-spacing:.08em}.rn{font:900 11px Montserrat;fill:#120d26}</style>` +
    `<defs>${mascara}</defs><g mask="url(#rn-m)">` + anillos + lazos.map(l => `<path d="${curva(l)}" fill="none" stroke="${l.c}" stroke-width="${l.w}"/>`).join('') + '</g>' +
    esfera +
    nodos.map(n => `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.t === 'h' ? 'none' : n.c}" stroke="${n.c}" stroke-width="${n.t === 'h' ? 1.5 : 0}"/>` + (n.n ? `<text x="${n.x}" y="${n.y + 4}" text-anchor="middle" class="rn">${n.n}</text>` : '')).join('') +
    textos.join('') + '</svg>';
}
