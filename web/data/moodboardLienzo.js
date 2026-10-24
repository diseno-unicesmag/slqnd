// Contenido del moodboard del concepto de diseño, extraído del mapa mental hecho a mano.
// Coordenadas en unidades del lienzo (W × H). Cada elemento no-imagen lleva w y h aproximados.

export const W = 4000;
export const H = 2860;

export const ZONAS = [
  { id: 'todo', t: 'Todo', x: 40, y: 30, w: W - 60, h: H - 50 },
  { id: 'silencio', t: 'Silencio', x: 40, y: 900, w: 1420, h: 1760 },
  { id: 'metafora', t: 'Metáfora', x: 940, y: 30, w: 2680, h: 1000 },
  { id: 'revelacion', t: 'Revelación', x: 2560, y: 880, w: 1420, h: 1800 },
  { id: 'lenguaje', t: 'Lenguaje visual', x: 1480, y: 1620, w: 1120, h: 1220 },
];

export const ELEMENTOS = [
  // ── Centro ──
  { id: 'centro', tipo: 'centro', x: 1560, y: 1100, w: 900, h: 400 },

  // ── 01 Silencio ──
  { id: 'h-sil', tipo: 'cab', x: 100, y: 960, w: 560, h: 190, tono: 'sil', n: '01', t: 'Silencio', lema: 'Lo que existe y se calla.' },
  { id: 'we-listen', tipo: 'img', src: 'we-listen', x: 100, y: 1210, w: 600, t: 'We Listen, Samaritans' },
  { id: 'n-imfine', tipo: 'nota', x: 740, y: 1230, w: 300, h: 150, color: 'amarillo', rot: 2, txt: '«I’m fine»: la respuesta automática que tapa lo que de verdad pasa.' },
  { id: 'han', tipo: 'cita', x: 100, y: 1590, w: 600, h: 150, txt: 'El sujeto que se autoexplota.', autor: 'Byung-Chul Han, sociedad del rendimiento' },
  { id: 'cdps', tipo: 'dato', x: 100, y: 1780, w: 290, h: 190, num: '8 de 15', txt: 'casi nunca hablan de su agotamiento', autor: 'CDPS' },
  { id: 'n-estandares', tipo: 'nota', x: 420, y: 1790, w: 300, h: 210, color: 'lila', rot: -2, tit: 'Estándares', txt: 'Lo que la gente espera de ti, lo que tus papás te piden, lo que tú te exiges.' },
  { id: 'postsecret', tipo: 'img', src: 'postsecret', x: 770, y: 1460, w: 400, t: 'PostSecret', pal: true },
  { id: 'n-anonimato', tipo: 'nota', x: 800, y: 1820, w: 330, h: 150, color: 'rosa', rot: -1.5, txt: 'Es más seguro expresarse desde el anonimato.', autor: 'Taller «Sobre lo que no dices»' },
  { id: 'es-sil', tipo: 'lista', x: 100, y: 2050, w: 520, h: 300, t: 'Es', items: ['Represión y contención: «me aguanto y sigo».', 'No es vacío ni debilidad.', 'Sensibilidad, humanidad, miedo.', 'Lo íntimo, lo privado, lo interno.'] },
  { id: 've-sil', tipo: 'se-ve', x: 660, y: 2050, w: 760, h: 520, t: 'Se ve', items: [
    ['Penumbra', 'violeta profundo, negro', ['#2b1759', '#120d1f']],
    ['Dolor', 'rojo, vino tinto', ['#a3213a', '#5c1424']],
    ['Fragilidad', 'cristal, porcelana, grietas', ['#cfd8e6', '#eef0f5']],
    ['Sufrimiento', 'oscuridad, poco contraste', ['#3a3646', '#4a4656']],
    ['Quietud', 'nada se mueve… aún', null],
    ['Tensión', 'difícil de ver, difícil de aceptar', null],
  ] },

  // ── 02 Metáfora ──
  { id: 'h-met', tipo: 'cab', x: 1730, y: 60, w: 560, h: 190, tono: 'met', n: '02', t: 'Metáfora', lema: 'La figura que carga el silencio.' },
  { id: 'lakoff', tipo: 'cita', x: 990, y: 60, w: 640, h: 150, txt: 'Nosotros pensamos en metáforas.', autor: 'Lakoff y Johnson' },
  { id: 'n-carnaval', tipo: 'nota', x: 1020, y: 250, w: 340, h: 170, color: 'amarillo', rot: -2, tit: 'Carnaval de Negros y Blancos', txt: 'La máscara libera la expresión.', autor: 'Timaran' },
  { id: 'n-kintsugi', tipo: 'nota', x: 1410, y: 280, w: 300, h: 170, color: 'rosa', rot: 1.5, tit: 'Kintsugi', txt: 'La grieta no debe ocultarse: debe mostrarse más.' },
  { id: 'celeste', tipo: 'img', src: 'celeste', x: 2390, y: 60, w: 520, t: 'Celeste', pal: true },
  { id: 'n-celeste', tipo: 'nota', x: 2420, y: 380, w: 320, h: 140, color: 'lila', rot: 2, txt: 'La ansiedad convertida en una montaña que se escala.' },
  { id: 'n-bojack', tipo: 'nota', x: 2960, y: 70, w: 290, h: 190, color: 'amarillo', rot: -2, tit: 'Bojack Horseman', txt: 'El dolor dicho desde el humor y la sátira.' },
  { id: 'boceto1', tipo: 'img', src: 'boceto1', x: 990, y: 560, w: 190, t: 'Boceto 01' },
  { id: 'obra1', tipo: 'img', src: 'obra1', x: 1210, y: 520, w: 270, t: 'Obra piloto 01', pal: true },
  { id: 'boceto3', tipo: 'img', src: 'boceto3', x: 1520, y: 560, w: 190, t: 'Boceto 03' },
  { id: 'obra3', tipo: 'img', src: 'obra3', x: 1740, y: 520, w: 270, t: 'Obra piloto 03', pal: true },
  { id: 'boceto4', tipo: 'img', src: 'boceto4', x: 2050, y: 560, w: 190, t: 'Boceto 04' },
  { id: 'obra4', tipo: 'img', src: 'obra4', x: 2270, y: 520, w: 270, t: 'Obra piloto 04' },
  { id: 'n-trazo', tipo: 'nota', x: 1000, y: 830, w: 420, h: 130, color: 'lila', rot: -1, txt: 'Del boceto a la obra: cada creador conserva su trazo propio.' },
  { id: 'n-proyectivas', tipo: 'nota', x: 2600, y: 560, w: 340, h: 230, color: 'rosa', rot: 2, tit: 'Figuras proyectivas', txt: 'Solo su autor puede explicarla, pero todos pueden interpretarla. No hay una sola verdad.' },
  { id: 'es-met', tipo: 'lista', x: 3300, y: 70, w: 300, h: 290, t: 'Es', items: ['Decir sin decirlo.', 'Sin primera persona.', 'Sin lo clínico.', 'Sin literalidad.', 'Sin vergüenza.'] },
  { id: 've-met2', tipo: 'se-ve', x: 3300, y: 400, w: 300, h: 420, t: 'Se ve', items: [
    ['La obra física', 'impresa, a mano, como sea', null],
    ['Formas orgánicas', 'con todas las libertades', null],
    ['Trazo propio', 'sin cánones', null],
    ['Sin límites', 'no hace falta saber dibujar, pero debe significar', null],
  ] },
  { id: 'c-sinceridad', tipo: 'cita', x: 1480, y: 860, w: 780, h: 150, grande: true, txt: 'Lo importante es lo que significa para el autor y que sea hecho con sinceridad.' },
  { id: 'n-verdad', tipo: 'nota', x: 2300, y: 840, w: 260, h: 170, color: 'amarillo', rot: -3, tit: '¡La verdad duele!', txt: 'Y hace ruido: no tiene que ser bonita.' },

  // ── 03 Revelación ──
  { id: 'h-rev', tipo: 'cab', x: 2620, y: 940, w: 560, h: 190, tono: 'rev', n: '03', t: 'Revelación', lema: 'Lo que la Realidad Aumentada deja ver.' },
  { id: 'artivive', tipo: 'img', src: 'artivive', x: 3260, y: 920, w: 460, t: 'Artivive' },
  { id: 'n-artivive', tipo: 'nota', x: 3420, y: 1290, w: 300, h: 140, color: 'amarillo', rot: 2, txt: 'La capa oculta está dentro de la obra.' },
  { id: 'maqueta', tipo: 'img', src: 'maqueta', x: 2620, y: 1180, w: 560, t: 'MetafoRA (imagen de maqueta)' },
  { id: 'n-activa', tipo: 'nota', x: 2650, y: 1520, w: 400, h: 170, color: 'lila', rot: -1.5, txt: 'No añade información: deja ver la que la obra guardaba. El lector la activa al apuntar.' },
  { id: 'obra2', tipo: 'img', src: 'obra2', x: 3240, y: 1470, w: 400, t: 'Obra piloto 02', pal: true },
  { id: 'hellblade', tipo: 'img', src: 'hellblade', x: 2620, y: 1760, w: 460, t: 'Hellblade' },
  { id: 'n-hellblade', tipo: 'nota', x: 2660, y: 2100, w: 330, h: 140, color: 'rosa', rot: 1.5, txt: 'El sonido envuelve una experiencia emocional.' },
  { id: 'n-bandersnatch', tipo: 'nota', x: 3150, y: 2020, w: 300, h: 180, color: 'amarillo', rot: -2, tit: 'Black Mirror: Bandersnatch', txt: 'El espectador decide, en todo sentido.' },
  { id: 'n-norman', tipo: 'nota', x: 3500, y: 2040, w: 260, h: 170, color: 'lila', rot: 2, tit: 'Donald Norman', txt: 'El diseño es reflexivo e impactante.' },
  { id: 've-rev', tipo: 'se-ve', x: 3690, y: 1470, w: 290, h: 380, t: 'Se ve', items: [
    ['La lupa', 'el cristal que enfoca', null],
    ['Luz sobre el violeta', 'amarillo, dorado', ['#f5c542', '#ffe9a6']],
    ['Movimiento', 'animación y sonido', null],
    ['Vida', 'lo quieto por fin se mueve', null],
  ] },
  { id: 'c-luz', tipo: 'cita', x: 2620, y: 2330, w: 1100, h: 170, grande: true, oro: true, txt: 'La luz de la revelación acentúa la grieta de la metáfora: rompe la penumbra y brilla sobre la oscuridad.' },
  { id: 'n-reflejo', tipo: 'nota', x: 3140, y: 2560, w: 560, h: 150, color: 'rosa', rot: -1, txt: 'La obra se interpreta de muchas maneras, como reflejo de quien decide visitarla y leerla.' },

  // ── Lenguaje visual ──
  { id: 'h-len', tipo: 'cab', x: 1540, y: 1640, w: 520, h: 190, tono: 'len', n: '04', t: 'Lenguaje', lema: 'Infinitas formas de experimentación visual.' },
  { id: 'paleta', tipo: 'paleta', x: 1540, y: 1870, w: 520, h: 230 },
  { id: 'myerscough', tipo: 'img', src: 'myerscough', x: 2100, y: 1650, w: 460, t: 'Studio Myerscough', pal: true },
  { id: 'n-myerscough', tipo: 'nota', x: 2160, y: 1960, w: 330, h: 140, color: 'amarillo', rot: 2, txt: 'Forma, color y palabra ocupando el espacio.' },
  { id: 'bouba', tipo: 'bouba', x: 1540, y: 2140, w: 360, h: 250 },
  { id: 'palabras', tipo: 'palabras', x: 1940, y: 2140, w: 620, h: 300 },
  { id: 'n-extrano', tipo: 'nota', x: 1560, y: 2440, w: 330, h: 140, color: 'rosa', rot: -2, txt: 'Fácil de ver, pero puede ser extraño. Es impacto.' },
  { id: 'nombres', tipo: 'nombres', x: 1540, y: 2640, w: 1020, h: 170 },
];

// Conexiones: [desde, hasta, tipo]. 'eje' une el centro con cada idea.
export const ENLACES = [
  ['centro', 'h-sil', 'eje'], ['centro', 'h-met', 'eje'], ['centro', 'h-rev', 'eje'], ['centro', 'h-len', 'eje'],
  ['h-sil', 'we-listen'], ['we-listen', 'n-imfine'], ['h-sil', 'han'], ['h-sil', 'postsecret'], ['postsecret', 'n-anonimato'], ['han', 'cdps'], ['cdps', 'n-estandares'], ['h-sil', 'es-sil'], ['es-sil', 've-sil'],
  ['h-sil', 'n-kintsugi', 'pregunta'],
  ['h-met', 'lakoff'], ['lakoff', 'n-carnaval'], ['h-met', 'celeste'], ['celeste', 'n-celeste'], ['celeste', 'n-bojack'], ['h-met', 'obra3'],
  ['boceto1', 'obra1', 'flecha'], ['boceto3', 'obra3', 'flecha'], ['boceto4', 'obra4', 'flecha'], ['obra1', 'n-trazo'], ['obra4', 'n-proyectivas'], ['n-bojack', 'es-met'], ['es-met', 've-met2'], ['c-sinceridad', 'n-verdad'],
  ['h-rev', 'maqueta'], ['h-rev', 'artivive'], ['artivive', 'n-artivive'], ['maqueta', 'n-activa'], ['n-activa', 'obra2'], ['obra2', 've-rev'], ['h-rev', 'hellblade'], ['hellblade', 'n-hellblade'], ['hellblade', 'n-bandersnatch'], ['n-bandersnatch', 'n-norman'], ['c-luz', 'n-reflejo'],
  ['h-len', 'paleta'], ['h-len', 'myerscough'], ['myerscough', 'n-myerscough'], ['paleta', 'bouba'], ['bouba', 'palabras'], ['n-extrano', 'nombres'],
];

export const PALABRAS = ['Desahogo', 'Resonancia', 'Expresión', 'Verdad', 'Seguridad', 'Descanso', 'Movimiento', 'Volumen', 'Luz', 'Color', 'Impacto', 'Contraste', 'Sonido', 'Estruendo', 'Calma', 'Ruido', 'Reflexión'];
export const NO = ['No es obvio', 'No es universal', 'No es literal'];
export const NOMBRES = ['El silencio revelado', 'El silencio que se revela', 'La retórica del silencio', 'La metáfora silenciosa', 'El silencio en voz alta'];
