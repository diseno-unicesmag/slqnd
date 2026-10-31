// Pictogramas de línea para las aperturas de sección (1.x y 2.x).
// Trazo de 1,6 sobre una retícula de 48: se dibujan en el color de línea del contexto.
const P = {
  // Necesidad u oportunidad: una lupa que encuentra un destello
  lupa: '<circle cx="21" cy="21" r="12"/><path d="M30 30l11 11"/><path d="M21 14v4M21 24v4M14 21h4M24 21h4"/>',
  // Contextualización: un lugar sobre un mapa
  lugar: '<path d="M24 42s-12-11.5-12-21a12 12 0 0 1 24 0c0 9.5-12 21-12 21z"/><circle cx="24" cy="21" r="4.5"/><path d="M8 42h32"/>',
  // Objeto o tema: una diana
  diana: '<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="3"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6"/>',
  // Formulación del problema: un globo de diálogo con pregunta
  pregunta: '<path d="M8 10h32v22H22l-9 8v-8H8z"/><path d="M19.5 17.5a4.5 4.5 0 1 1 6.3 4.1c-1.2.6-1.8 1.4-1.8 2.9"/><path d="M24 28.6v.4"/>',
  // Propósitos: una bandera en la cima
  bandera: '<path d="M6 42l14-22 8 12 5-7 9 17z"/><path d="M28 32V8"/><path d="M28 8h12l-3 5 3 5H28"/>',
  // Justificación: una balanza
  balanza: '<path d="M24 8v32M14 40h20M10 14h28"/><path d="M10 14l-6 13a6 6 0 0 0 12 0z"/><path d="M38 14l-6 13a6 6 0 0 0 12 0z"/><circle cx="24" cy="8" r="2"/>',
  // Sustento teórico: un libro abierto
  libro: '<path d="M24 14c-5-4-12-5-18-4v26c6-1 13 0 18 4 5-4 12-5 18-4V10c-6-1-13 0-18 4z"/><path d="M24 14v26"/>',
  // Antecedentes y referentes: capas de imágenes
  capas: '<rect x="12" y="8" width="28" height="22" rx="4"/><path d="M8 14v20a4 4 0 0 0 4 4h24"/><path d="M12 26l8-7 6 5 5-4 9 7"/><circle cx="32" cy="15" r="2.5"/>',
  // Metodología: una ruta con hitos
  ruta: '<circle cx="10" cy="38" r="4"/><circle cx="38" cy="10" r="4"/><path d="M14 38h14a6 6 0 0 0 0-12H20a6 6 0 0 1 0-12h14"/>',
  // Concepto de diseño: una lente que revela
  lente: '<circle cx="24" cy="22" r="13"/><path d="M15 31l-7 9M33 31l7 9"/><path d="M18 18a7 7 0 0 1 7-4"/><path d="M24 9V4M24 40v4"/>',
  // Estilo gráfico: una paleta
  paleta: '<path d="M24 6a18 18 0 1 0 0 36c3 0 4-2 3-4.5s0-4.5 3-4.5h4a8 8 0 0 0 8-8C42 14 34 6 24 6z"/><circle cx="15" cy="20" r="2.5"/><circle cx="23" cy="14" r="2.5"/><circle cx="32" cy="17" r="2.5"/><circle cx="14" cy="29" r="2.5"/>',
  // Genérico: un destello
  destello: '<path d="M24 6v12M24 30v12M6 24h12M30 24h12M12 12l7 7M29 29l7 7M36 12l-7 7M19 29l-7 7"/>',
};

// Se elige por palabras del título, para que el mismo pictograma acompañe siempre al mismo tema
const REGLAS = [
  [/necesidad|oportunidad/i, 'lupa'], [/contexto|contextualiz/i, 'lugar'], [/objeto|tema/i, 'diana'],
  [/problema/i, 'pregunta'], [/prop[oó]sito|objetivo/i, 'bandera'], [/justifica/i, 'balanza'],
  [/sustento|te[oó]ric|marco/i, 'libro'], [/antecedente|referente/i, 'capas'], [/metodolog|ruta/i, 'ruta'],
  [/concepto/i, 'lente'], [/estilo|gr[aá]fic/i, 'paleta'],
];

export function pictograma(titulo) {
  const k = (REGLAS.find(([re]) => re.test(titulo)) || [, 'destello'])[1];
  return `<svg class="picto" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;
}
