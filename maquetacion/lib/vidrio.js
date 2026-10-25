// Liquid Glass, igual al del portafolio (glass-element + displacement-utils):
// backdrop-filter con un mapa de desplazamiento SVG del tamaño exacto de la pieza.
// Así lo que queda debajo se refracta y se dobla en los bordes, con aberración cromática.

function mapa({ w, h, radio, prof }) {
  const svg = `<svg height="${h}" width="${w}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">` +
    '<style>.mix{mix-blend-mode:screen}</style><defs>' +
    `<linearGradient id="Y" x1="0" x2="0" y1="${Math.ceil((radio / h) * 15)}%" y2="${Math.floor(100 - (radio / h) * 15)}%"><stop offset="0%" stop-color="#0F0"/><stop offset="100%" stop-color="#000"/></linearGradient>` +
    `<linearGradient id="X" x1="${Math.ceil((radio / w) * 15)}%" x2="${Math.floor(100 - (radio / w) * 15)}%" y1="0" y2="0"><stop offset="0%" stop-color="#F00"/><stop offset="100%" stop-color="#000"/></linearGradient>` +
    `</defs><rect x="0" y="0" height="${h}" width="${w}" fill="#808080"/><g filter="blur(2px)">` +
    `<rect x="0" y="0" height="${h}" width="${w}" fill="#000080"/>` +
    `<rect x="0" y="0" height="${h}" width="${w}" fill="url(#Y)" class="mix"/>` +
    `<rect x="0" y="0" height="${h}" width="${w}" fill="url(#X)" class="mix"/>` +
    `<rect x="${prof}" y="${prof}" height="${h - 2 * prof}" width="${w - 2 * prof}" fill="#808080" rx="${radio}" ry="${radio}" filter="blur(${prof}px)"/>` +
    '</g></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const cache = new Map();
function filtro({ w, h, radio, prof, fuerza, ca }) {
  const k = [w, h, radio, prof, fuerza, ca].join('|');
  if (cache.has(k)) return cache.get(k);
  const paso = (escala, matriz, res) =>
    `<feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${escala}" xChannelSelector="R" yChannelSelector="G"/>` +
    `<feColorMatrix type="matrix" values="${matriz}" result="${res}"/>`;
  const svg = `<svg height="${h}" width="${w}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs>` +
    '<filter id="displace" color-interpolation-filters="sRGB">' +
    `<feImage x="0" y="0" height="${h}" width="${w}" href="${mapa({ w, h, radio, prof })}" result="displacementMap"/>` +
    paso(fuerza + ca * 2, '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', 'displacedR') +
    paso(fuerza + ca, '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', 'displacedG') +
    paso(fuerza, '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0', 'displacedB') +
    '<feBlend in="displacedR" in2="displacedG" mode="screen"/><feBlend in2="displacedB" mode="screen"/>' +
    '</filter></defs></svg>';
  const url = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '#displace';
  cache.set(k, url);
  return url;
}

// Convierte el elemento (ya con su tamaño en px) en cristal líquido.
// Fuerza y profundidad van en proporción al tamaño (como el cursor del portafolio: 70 px → 40 y 5),
// para que el centro quede limpio y la curvatura se concentre en el borde.
export function vidrio(el, w, h, { radio = Math.min(w, h) / 2, prof, desenfoque = 1, fuerza, ca = 2, fondo = 'rgba(255,255,255,0.06)', sombra = '0px 0px 16px 0px rgba(0,0,0, 0.04)' } = {}) {
  w = Math.round(w); h = Math.round(h);
  const lado = Math.min(w, h);
  prof ??= Math.max(5, Math.round(lado * 0.07));
  fuerza ??= Math.round(lado * 0.26);
  const f = `blur(${desenfoque / 2}px) url('${filtro({ w, h, radio, prof, fuerza, ca })}') blur(${desenfoque}px) brightness(1.1) saturate(1.5)`;
  el.classList.add('vidrio');
  el.style.width = w + 'px'; el.style.height = h + 'px'; el.style.borderRadius = radio + 'px';
  el.style.background = fondo;
  el.style.boxShadow = '1px 1px 1px 0px rgba(255,255,255, 0.60) inset, -1px -1px 1px 0px rgba(255,255,255, 0.60) inset, ' + sombra;
  el.style.backdropFilter = f; el.style.webkitBackdropFilter = f;
  return el;
}
