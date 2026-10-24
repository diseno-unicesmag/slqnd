// Genera los módulos de datos del sitio a partir de las fuentes originales.
// Uso: node scripts/datos.mjs   (solo hace falta al cambiar las fuentes en legacy/)
import fs from 'node:fs';
import vm from 'node:vm';

const leer = f => fs.readFileSync(f, 'utf8');
const entre = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error('No encontré: ' + a); return s.slice(i, j); };
const evaluar = codigo => vm.runInNewContext('(' + codigo + ')');
fs.mkdirSync('data', { recursive: true });
const escribir = (f, obj) => fs.writeFileSync('data/' + f, Object.entries(obj).map(([k, v]) => `export const ${k} = ${JSON.stringify(v, null, 1)};`).join('\n\n') + '\n');

// Ruta metodológica
{
  const s = leer('legacy/ruta-metodologica.html');
  const FASES = evaluar(entre(s, 'const FASES = [', '];\nconst TIPOS').replace('const FASES = ', '') + ']');
  escribir('ruta.js', { FASES });
}

// Cadena de valor
{
  const s = leer('legacy/cadena-valor.html');
  const BLOCKS = evaluar(entre(s, 'const BLOCKS = [', '];').replace('const BLOCKS = ', '') + ']');
  const NODES = evaluar(entre(s, 'const NODES = [', '];').replace('const NODES = ', '') + ']');
  escribir('cadena.js', { BLOCKS, NODES });
}

// Match creativo
{
  const s = leer('legacy/match-creativo.html');
  const MATCH = evaluar(entre(s, 'const MATCH = [', '];').replace('const MATCH = ', '') + ']');
  const FASE = { f0: ['Pre-requisito', 'Marco teórico'], f1: ['Fase 1', 'Cartografía diagnóstica'], f2: ['Fase 2', 'Tejido narrativo (prototipo)'], f3: ['Fase 3', 'Validación'] };
  escribir('match.js', { MATCH, FASE });
}

// Lluvia de ideas
{
  const s = leer('legacy/lluvia-ideas.html');
  const MAPS = evaluar(entre(s, 'const MAPS = [', '];').replace('const MAPS = ', '') + ']');
  const RATINGS = evaluar(entre(s, 'const RATINGS = {', '};').replace('const RATINGS = ', '') + '}');
  const SINTESIS = evaluar(entre(s, 'const SINTESIS = {', '};').replace('const SINTESIS = ', '') + '}');
  escribir('lluvia.js', { MAPS, RATINGS, SINTESIS });
}

// CDPS: solo agregados. Ninguna respuesta queda ligada a un participante.
{
  const ctx = {}; vm.runInNewContext(leer('public/instrumentos/cdps/js/preguntas.js').replace('const PREGUNTAS', 'var PREGUNTAS'), ctx);
  const sesion = JSON.parse(leer('public/instrumentos/cdps/datos/sesion_2026-04-24T15-50-00-943Z.json'));
  const N = sesion.totalParticipantes;
  const preguntas = ctx.PREGUNTAS.map(p => {
    const tot = sesion.totalesPorPregunta[p.id] || {};
    const base = { id: p.id, bloque: p.bloque, tipo: p.tipo, texto: p.texto, jovial: p.texto_jovial };
    if (p.tipo.startsWith('texto')) {
      const textos = sesion.participantes.flatMap(x => [].concat(x.respuestas?.[p.id] ?? [])).map(t => String(t).trim()).filter(Boolean);
      return { ...base, textos: textos.sort((a, b) => a.localeCompare(b, 'es')) };
    }
    const opciones = (p.opciones || []).map(o => ({ id: o.id, label: o.label, acad: o.label_acad, n: tot[o.id] || 0 }));
    const respuestas = opciones.reduce((s, o) => s + o.n, 0);
    const out = { ...base, opciones, respuestas };
    if (p.tipo === 'escala') out.media = +(opciones.reduce((s, o) => s + Number(o.id) * o.n, 0) / respuestas).toFixed(2);
    return out;
  });
  const cuenta = (campo, mapa = v => v) => { const c = {}; sesion.participantes.forEach(p => { const v = mapa(p.perfil?.[campo]); c[v] = (c[v] || 0) + 1; }); return Object.entries(c).map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n); };
  const rango = e => { e = Number(e); return e <= 22 ? '20 a 22 años' : e <= 25 ? '23 a 25 años' : '26 años o más'; };
  const perfil = [
    { titulo: 'Edad', datos: cuenta('edad', rango) },
    { titulo: 'Género', datos: cuenta('genero') },
    { titulo: 'Situación actual', datos: cuenta('situacion') },
  ];
  escribir('cdps.js', { CDPS: { fecha: '24 de abril de 2026', lugar: 'Laboratorio de Creación Digital 1 · Universidad CESMAG', n: N, preguntas, perfil } });
}
console.log('Datos generados en data/');
