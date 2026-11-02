// Cadena de valor como red (a la manera de ATLAS.ti): núcleo, macrocategorías, categorías y
// subcategorías con sus autores, en dos abanicos que dejan el lomo libre.
import { CADENA } from './cadena';

const W = 1632, H = 1056, CX = W / 2, CY = H / 2 + 48;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function redCadena() {
  const hojas = m => m.cats.reduce((a, c) => a + c.subs.length, 0);
  // reparto de macrocategorías entre los dos lados, equilibrando hojas
  const total = CADENA.reduce((a, m) => a + hojas(m), 0);
  let acc = 0, corte = 0;
  CADENA.forEach((m, i) => { if (acc < total / 2) { acc += hojas(m); corte = i + 1; } });
  const lados = [CADENA.slice(0, corte), CADENA.slice(corte)];
  const nodos = [], lazos = [], textos = [];
  const pos = (ang, rx, ry) => [CX + Math.cos(ang) * rx, CY + Math.sin(ang) * ry];
  lados.forEach((ms, li) => {
    const n = ms.reduce((a, m) => a + hojas(m), 0) + (ms.length - 1) * 0.8;
    const a0 = -56 * Math.PI / 180, a1 = 60 * Math.PI / 180;
    let k = 0;
    const angDe = t => { const a = a0 + (a1 - a0) * (t / Math.max(1, n - 1)); return li === 0 ? a : Math.PI - a; };
    ms.forEach(m => {
      const angsM = [];
      m.cats.forEach(c => {
        const angsC = c.subs.map(() => angDe(k++));
        const ac = angsC.reduce((a, x) => a + x, 0) / angsC.length;
        angsM.push(...angsC);
        const [cx, cy] = pos(ac, 410, 300);
        c.subs.forEach(([t, au], j) => {
          const [x, y] = pos(angsC[j], 530, 440);
          lazos.push({ a: [cx, cy], b: [x, y], c: m.c, w: 1 });
          nodos.push({ x, y, r: 4.5, c: m.c, t: 'h' });
          const der = li === 0, tx = x + (der ? 10 : -10);
          textos.push(`<text x="${tx}" y="${y - 1}" text-anchor="${der ? 'start' : 'end'}" class="rh">${esc(t)}</text><text x="${tx}" y="${y + 10}" text-anchor="${der ? 'start' : 'end'}" class="ra">${esc(au.length > 44 ? au.slice(0, 42).replace(/[;,]?\s*\S*$/, "") + "…" : au)}</text>`);
        });
        c._p = [cx, cy];
        nodos.push({ x: cx, y: cy, r: 7, c: m.c, t: 'c' });
        const der = li === 0;
        textos.push(`<text x="${cx + (der ? -10 : 10)}" y="${cy - 10}" text-anchor="${der ? 'end' : 'start'}" class="rc" paint-order="stroke" stroke="#120d26" stroke-width="4">${esc(c.t)}</text>`);
      });
      k += 0.8;
      const am = angsM.reduce((a, x) => a + x, 0) / angsM.length;
      const [mx, my] = pos(am, 215, 165);
      m.cats.forEach(c => lazos.push({ a: [mx, my], b: c._p, c: m.c, w: 2 }));
      lazos.push({ a: [CX, CY], b: [mx, my], c: m.c, w: 3.2 });
      nodos.push({ x: mx, y: my, r: 17, c: m.c, t: 'm', n: m.n });
      const der = li === 0;
      textos.push(`<text x="${mx}" y="${my + 32}" text-anchor="middle" class="rm" paint-order="stroke" stroke="#120d26" stroke-width="4">${esc(m.t)}</text><text x="${mx}" y="${my + 44}" text-anchor="middle" class="rs">${esc(m.s)}</text>`);
    });
  });
  const curva = ({ a: [x1, y1], b: [x2, y2] }) => { const mx = (x1 + x2) / 2; return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`; };
  // telaraña de fondo: anillos punteados
  const anillos = [[215, 165], [410, 300], [600, 430]].map(([rx, ry]) => `<ellipse cx="${CX}" cy="${CY}" rx="${rx}" ry="${ry}" fill="none" stroke="rgba(255,255,255,.08)" stroke-dasharray="2 6"/>`).join('');
  return `<svg class="red-cadena" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<style>.rh{font:700 9.5px Montserrat;fill:#fff}.ra{font:500 8px Montserrat;fill:rgba(255,255,255,.6)}.rc{font:800 10.5px Montserrat;fill:#fff}.rm{font:900 13px Montserrat;fill:#fff}.rs{font:700 8px Montserrat;fill:#f5c542;letter-spacing:.08em}.rn{font:900 11px Montserrat;fill:#120d26}</style>` +
    anillos + lazos.map(l => `<path d="${curva(l)}" fill="none" stroke="${l.c}" stroke-opacity="${l.w > 2 ? .8 : l.w > 1 ? .55 : .35}" stroke-width="${l.w}"/>`).join('') +
    `<circle cx="${CX}" cy="${CY}" r="34" fill="#f5c542"/><circle cx="${CX}" cy="${CY}" r="50" fill="none" stroke="#f5c542" stroke-opacity=".35"/>` +
    nodos.map(n => `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.t === 'h' ? '#120d26' : n.c}" stroke="${n.c}" stroke-width="${n.t === 'h' ? 1.5 : 0}"/>` + (n.n ? `<text x="${n.x}" y="${n.y + 4}" text-anchor="middle" class="rn">${n.n}</text>` : '')).join('') +
    textos.join('') + '</svg>';
}
