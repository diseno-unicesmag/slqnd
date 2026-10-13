/* glass.js — Liquid Glass: refracción por mapa de desplazamiento SVG.
   Portado de Shamy Creative Studio (liquid-glass/displacement-utils.js).
   Chromium aplica la refracción; el resto conserva el esmerilado de glass.css. */
(function () {
  document.documentElement.classList.add('js');

  var ua = navigator.userAgent.toLowerCase();
  var isFirefox = ua.indexOf('firefox') > -1 || ua.indexOf('fxios') > -1;
  var isSafari = ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1 && ua.indexOf('chromium') === -1 && ua.indexOf('crios') === -1 && ua.indexOf('edg/') === -1;
  var canRefract = !isFirefox && !isSafari && window.CSS && CSS.supports('backdrop-filter', 'blur(1px)');

  function displacementMap(w, h, r, d) {
    var svg = '<svg height="' + h + '" width="' + w + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
      '<style>.mix{mix-blend-mode:screen}</style><defs>' +
      '<linearGradient id="Y" x1="0" x2="0" y1="' + Math.ceil((r / h) * 15) + '%" y2="' + Math.floor(100 - (r / h) * 15) + '%"><stop offset="0%" stop-color="#0F0"/><stop offset="100%" stop-color="#000"/></linearGradient>' +
      '<linearGradient id="X" x1="' + Math.ceil((r / w) * 15) + '%" x2="' + Math.floor(100 - (r / w) * 15) + '%" y1="0" y2="0"><stop offset="0%" stop-color="#F00"/><stop offset="100%" stop-color="#000"/></linearGradient>' +
      '</defs><rect x="0" y="0" height="' + h + '" width="' + w + '" fill="#808080"/><g filter="blur(2px)">' +
      '<rect x="0" y="0" height="' + h + '" width="' + w + '" fill="#000080"/>' +
      '<rect x="0" y="0" height="' + h + '" width="' + w + '" fill="url(#Y)" class="mix"/>' +
      '<rect x="0" y="0" height="' + h + '" width="' + w + '" fill="url(#X)" class="mix"/>' +
      '<rect x="' + d + '" y="' + d + '" height="' + (h - 2 * d) + '" width="' + (w - 2 * d) + '" fill="#808080" rx="' + r + '" ry="' + r + '" filter="blur(' + d + 'px)"/>' +
      '</g></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function displacementFilter(w, h, r, d, strength, ca) {
    var map = displacementMap(w, h, r, d);
    function pass(scale, matrix, result) {
      return '<feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="' + scale + '" xChannelSelector="R" yChannelSelector="G"/>' +
        '<feColorMatrix type="matrix" values="' + matrix + '" result="' + result + '"/>';
    }
    var svg = '<svg height="' + h + '" width="' + w + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<filter id="displace" color-interpolation-filters="sRGB">' +
      '<feImage x="0" y="0" height="' + h + '" width="' + w + '" href="' + map + '" result="displacementMap"/>' +
      pass(strength + ca * 2, '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', 'displacedR') +
      pass(strength + ca, '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', 'displacedG') +
      pass(strength, '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0', 'displacedB') +
      '<feBlend in="displacedR" in2="displacedG" mode="screen"/><feBlend in2="displacedB" mode="screen"/>' +
      '</filter></defs></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '#displace';
  }

  function refract(el) {
    var rect = el.getBoundingClientRect();
    var w = Math.round(rect.width), h = Math.round(rect.height);
    if (!w || !h) return;
    if (el._lgSize === w + 'x' + h) return;
    el._lgSize = w + 'x' + h;
    var cs = getComputedStyle(el);
    var r = Math.min(parseFloat(cs.borderTopLeftRadius) || 16, h / 2, w / 2);
    var d = Math.min(Number(el.dataset.lgDepth) || 8, Math.floor(Math.min(w, h) / 4));
    var strength = Number(el.dataset.lgStrength) || 60;
    var blur = el.dataset.lgBlur != null ? Number(el.dataset.lgBlur) : 3;
    var f = 'blur(' + blur + 'px) url(\'' + displacementFilter(w, h, r, d, strength, 2) + '\') saturate(1.5) brightness(1.08)';
    el.style.backdropFilter = f;
    el.style.webkitBackdropFilter = f;
  }

  function init() {
    // La barra recibe su cristal en una capa propia para no romper el desenfoque del menú desplegable.
    var nav = document.querySelector('nav');
    if (nav && !nav.querySelector('.lg-layer')) {
      var layer = document.createElement('span');
      layer.className = 'lg-r lg-layer';
      layer.setAttribute('aria-hidden', 'true');
      layer.dataset.lgDepth = '6';
      layer.dataset.lgStrength = '50';
      layer.dataset.lgBlur = '6';
      nav.insertBefore(layer, nav.firstChild);
      nav.classList.add('lg-nav');
    }

    if (canRefract) {
      // Solo piezas pequeñas que flotan sobre contenido: refractar tarjetas grandes frena el scroll.
      var els = Array.prototype.slice.call(document.querySelectorAll('.lg-r, .nav-dropdown'));
      var apply = function () { els.forEach(refract); };
      apply();
      if (window.ResizeObserver) {
        var t;
        var ro = new ResizeObserver(function () { clearTimeout(t); t = setTimeout(apply, 120); });
        els.forEach(function (e) { ro.observe(e); });
      }
    }

    var reveals = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (e) { e.classList.add('visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
      }, { threshold: 0.08 });
      reveals.forEach(function (e) { io.observe(e); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
