'use client';

import { useEffect } from 'react';

/* Liquid Glass: refracción por mapa de desplazamiento SVG, portada de Shamy Creative Studio.
   Chromium aplica la refracción; el resto conserva el esmerilado definido en glass.css.
   Solo se refractan piezas pequeñas que flotan sobre contenido (.lg-r y los menús). */

function displacementMap(w, h, r, d) {
  const svg = `<svg height="${h}" width="${w}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">` +
    '<style>.mix{mix-blend-mode:screen}</style><defs>' +
    `<linearGradient id="Y" x1="0" x2="0" y1="${Math.ceil((r / h) * 15)}%" y2="${Math.floor(100 - (r / h) * 15)}%"><stop offset="0%" stop-color="#0F0"/><stop offset="100%" stop-color="#000"/></linearGradient>` +
    `<linearGradient id="X" x1="${Math.ceil((r / w) * 15)}%" x2="${Math.floor(100 - (r / w) * 15)}%" y1="0" y2="0"><stop offset="0%" stop-color="#F00"/><stop offset="100%" stop-color="#000"/></linearGradient>` +
    `</defs><rect x="0" y="0" height="${h}" width="${w}" fill="#808080"/><g filter="blur(2px)">` +
    `<rect x="0" y="0" height="${h}" width="${w}" fill="#000080"/>` +
    `<rect x="0" y="0" height="${h}" width="${w}" fill="url(#Y)" class="mix"/>` +
    `<rect x="0" y="0" height="${h}" width="${w}" fill="url(#X)" class="mix"/>` +
    `<rect x="${d}" y="${d}" height="${h - 2 * d}" width="${w - 2 * d}" fill="#808080" rx="${r}" ry="${r}" filter="blur(${d}px)"/>` +
    '</g></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function displacementFilter(w, h, r, d, strength, ca) {
  const pass = (scale, matrix, result) =>
    `<feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>` +
    `<feColorMatrix type="matrix" values="${matrix}" result="${result}"/>`;
  const svg = `<svg height="${h}" width="${w}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs>` +
    '<filter id="displace" color-interpolation-filters="sRGB">' +
    `<feImage x="0" y="0" height="${h}" width="${w}" href="${displacementMap(w, h, r, d)}" result="displacementMap"/>` +
    pass(strength + ca * 2, '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', 'displacedR') +
    pass(strength + ca, '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', 'displacedG') +
    pass(strength, '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0', 'displacedB') +
    '<feBlend in="displacedR" in2="displacedG" mode="screen"/><feBlend in2="displacedB" mode="screen"/>' +
    '</filter></defs></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '#displace';
}

function refract(el) {
  const rect = el.getBoundingClientRect();
  const w = Math.round(rect.width), h = Math.round(rect.height);
  if (!w || !h) return;
  if (el._lgSize === w + 'x' + h) return;
  el._lgSize = w + 'x' + h;
  const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 16, h / 2, w / 2);
  const d = Math.min(Number(el.dataset.lgDepth) || 8, Math.floor(Math.min(w, h) / 4));
  const strength = Number(el.dataset.lgStrength) || 60;
  const blur = el.dataset.lgBlur != null ? Number(el.dataset.lgBlur) : 3;
  const ca = el.dataset.lgCa != null ? Number(el.dataset.lgCa) : 2;
  const f = `blur(${blur}px) url('${displacementFilter(w, h, r, d, strength, ca)}') saturate(1.5) brightness(1.08)`;
  el.style.backdropFilter = f;
  el.style.webkitBackdropFilter = f;
}

function puedeRefractar() {
  const ua = navigator.userAgent.toLowerCase();
  const firefox = ua.includes('firefox') || ua.includes('fxios');
  const safari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium') && !ua.includes('crios') && !ua.includes('edg/');
  return !firefox && !safari && window.CSS && CSS.supports('backdrop-filter', 'blur(1px)');
}

export default function GlassRuntime({ clave }) {

  useEffect(() => {
    let ro, t;
    if (puedeRefractar()) {
      const els = [...document.querySelectorAll('.lg-r')];
      const aplicar = () => els.forEach(refract);
      aplicar();
      ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(aplicar, 120); });
      els.forEach(e => ro.observe(e));
    }

    const reveals = document.querySelectorAll('.reveal:not(.visible)');
    let io;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(entradas => {
        entradas.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
      }, { threshold: 0.08 });
      reveals.forEach(e => io.observe(e));
    } else {
      reveals.forEach(e => e.classList.add('visible'));
    }

    return () => { clearTimeout(t); ro?.disconnect(); io?.disconnect(); };
  }, [clave]);

  return null;
}
