// Modelo del documento: bloques + estilo global. Todo lo que se edita vive aquí.

export const ESTILO_BASE = {
  fuenteTexto: 'Inter',
  fuenteTitulos: 'Onest',
  tamTexto: 10.5,          // pt
  interlineado: 1.6,
  margenSup: 2.54,         // cm
  margenInf: 2.54,
  margenInt: 3,
  margenExt: 2.54,
  acento: '#7c3aed',
  dorado: '#f0c24b',
  lavanda: '#b9a8f0',
  fondoOscuro: '#0b0a1a',
  cristal: 0.6,            // intensidad del cristal en portadas y aperturas (0–1)
  sangria: true,           // sangría de primera línea en párrafos
  justificado: true,
  cabecera: true,          // título del capítulo arriba de cada página
};

export const FUENTES = ['Inter', 'Onest', 'Source Serif 4', 'Literata', 'Fraunces', 'DM Sans', 'Space Grotesk'];

export const TIPOS_NUEVOS = [
  { tipo: 'p', nombre: 'Párrafo' },
  { tipo: 'heading', nombre: 'Título' },
  { tipo: 'quote', nombre: 'Cita destacada' },
  { tipo: 'figure', nombre: 'Figura' },
  { tipo: 'table', nombre: 'Tabla' },
  { tipo: 'list', nombre: 'Lista' },
];

export const ESTILOS_PARRAFO = [
  ['', 'Cuerpo'],
  ['sin-sangria', 'Cuerpo sin sangría'],
  ['centrado', 'Centrado'],
  ['destacado', 'Destacado (cristal)'],
  ['entradilla', 'Entradilla'],
  ['referencia', 'Referencia (sangría francesa)'],
  ['pequeno', 'Texto pequeño'],
];

export const TAMANOS_FIGURA = [['completo', 'Ancho de columna'], ['medio', 'Media columna'], ['pagina', 'Página completa']];

export const nuevoId = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function bloqueNuevo(tipo) {
  const id = nuevoId();
  switch (tipo) {
    case 'heading': return { id, type: 'heading', level: 2, html: 'Nuevo título' };
    case 'quote': return { id, type: 'quote', html: 'Escribe aquí la cita.' };
    case 'figure': return { id, type: 'figure', label: 'Figura', title: 'Título de la figura', src: null, note: '<em>Nota.</em> Elaboración propia.' };
    case 'table': return { id, type: 'table', label: 'Tabla', title: 'Título de la tabla', head: [['Columna 1', 'Columna 2']], rows: [['', ''], ['', '']], note: '<em>Nota.</em> ' };
    case 'list': return { id, type: 'list', items: ['Elemento'] };
    default: return { id, type: 'p', html: 'Escribe aquí.' };
  }
}

export const textoPlano = h => (h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();

// Capítulo = título de nivel 1 que empieza por «Capítulo»; tiene página de apertura.
export const esCapitulo = b => b.type === 'heading' && b.level === 1 && /^Capítulo/i.test(textoPlano(b.html));

export function partesCapitulo(b) {
  const t = textoPlano(b.html);
  const m = t.match(/^Capítulo\s+(\d+)\s*[–-]\s*(.+)$/i);
  return m ? { num: m[1], nombre: m[2] } : { num: '', nombre: t };
}

// Índice: títulos de nivel 1 a 3 (los de nivel 4–5 son subtítulos internos).
export const indice = bloques => bloques.filter(b => b.type === 'heading' && b.level <= 3);

export const pendientes = bloques => bloques.filter(b => b.type === 'figure' && !b.src && !b.chart && !(b.images && b.images.length));

export function cssVariables(e) {
  return {
    '--f-texto': `'${e.fuenteTexto}', serif`,
    '--f-titulos': `'${e.fuenteTitulos}', sans-serif`,
    '--tam': e.tamTexto + 'pt',
    '--interlineado': e.interlineado,
    '--m-sup': e.margenSup + 'cm', '--m-inf': e.margenInf + 'cm', '--m-int': e.margenInt + 'cm', '--m-ext': e.margenExt + 'cm',
    '--acento': e.acento, '--dorado': e.dorado, '--lavanda': e.lavanda, '--oscuro': e.fondoOscuro,
    '--cristal': e.cristal,
    '--sangria': e.sangria ? '1.6em' : '0',
    '--alineado': e.justificado ? 'justify' : 'left',
  };
}

export const cssVarsTexto = e => Object.entries(cssVariables(e)).map(([k, v]) => `${k}:${v}`).join(';');

// Ejes de cada fuente en Google Fonts (pedir un eje que no existe hace fallar toda la hoja).
const EJES = {
  'Inter': 'ital,wght@0,300..800;1,300..800',
  'Onest': 'wght@300..800',
  'Source Serif 4': 'ital,wght@0,300..800;1,300..800',
  'Literata': 'ital,wght@0,300..800;1,300..800',
  'Fraunces': 'ital,wght@0,300..800;1,300..800',
  'DM Sans': 'ital,wght@0,300..800;1,300..800',
  'Space Grotesk': 'wght@300..700',
};

export const urlFuentes = e => {
  const fams = [...new Set([e.fuenteTexto, e.fuenteTitulos, 'Inter', 'Onest'])];
  return 'https://fonts.googleapis.com/css2?' + fams.map(f => 'family=' + f.replace(/ /g, '+') + ':' + (EJES[f] || 'wght@400;700')).join('&') + '&display=swap';
};
