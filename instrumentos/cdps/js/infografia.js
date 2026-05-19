// ── Chart.js defaults ──
Chart.defaults.color = '#5a7a8a';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;

const PALETTE = ['#2dd4bf','#818cf8','#38bdf8','#f472b6','#94a3b8','#6366f1','#10b981','#d946ef','#06b6d4','#8b5cf6'];

const CONCLUSIONS = [
  { num:'01', title:'Epidemia Silenciosa de Burnout', desc:'El 93% nunca había escuchado "Burnout", pero el 67% lo vive activamente. Se padece sin ser nombrado, lo que impide buscar ayuda o reconocer la gravedad del estado.' },
  { num:'02', title:'La Presión es Endógena', desc:'El 47% se autoubica en el nivel máximo de autoexigencia. El principal factor estresante declarado es la propia cabeza, por encima de la carga académica objetiva.' },
  { num:'03', title:'Brecha Institucional', desc:'Menos del 20% recurre al psicólogo o bienestar universitario en crisis. La familia y los pares cubren el vacío que la institución no logra llenar.' },
  { num:'04', title:'Crisis Vocacional por Agotamiento', desc:'Múltiples respuestas revelan que la presión sostenida lleva al cuestionamiento de la carrera, no por falta de interés, sino por desgaste emocional acumulado.' },
  { num:'05', title:'Internalización Dominante', desc:'"Me la trago y sigo" es la reacción más frecuente ante la frustración. Esta supresión emocional crónica es un predictor clave del Burnout severo en literatura científica.' },
  { num:'06', title:'Autocompasión Latente', desc:'El ejercicio de cierre reveló recursos internos profundos. Los estudiantes saben cuidarse — lo que falta son espacios seguros que activen esa capacidad.' },
];

// ── helpers ──
function countFreq(arr, key) {
  const c = {};
  arr.forEach(p => { if(p.perfil?.[key]) c[p.perfil[key]] = (c[p.perfil[key]]||0)+1; });
  return c;
}
function totalsToLabelVal(qId, data) {
  const q = PREGUNTAS.find(p=>p.id===qId);
  if(!q||!q.opciones) return {labels:[],vals:[]};
  const t = data.totalesPorPregunta[qId]||{};
  return {
    labels: q.opciones.map(o=>o.label_acad||o.label),
    vals: q.opciones.map(o=>t[o.id]||0)
  };
}
function barChart(id, labels, vals, color='#2dd4bf') {
  const el = document.getElementById(id);
  if(!el) return;
  new Chart(el, {
    type:'bar',
    data:{ labels, datasets:[{ data:vals, backgroundColor:color, borderRadius:5 }] },
    options:{
      indexAxis:'y', maintainAspectRatio:false,
      scales:{
        x:{ beginAtZero:true, ticks:{stepSize:1,color:'#5a7a8a'}, grid:{color:'rgba(255,255,255,0.04)'} },
        y:{ ticks:{color:'#b0c8d4',font:{size:10}}, grid:{display:false}, afterFit: s=>s.width=220 }
      },
      plugins:{legend:{display:false}}
    }
  });
}
function donutChart(id, labels, vals, legendId) {
  const el = document.getElementById(id);
  if(!el) return;
  const colors = PALETTE.slice(0, labels.length);
  new Chart(el, {
    type:'doughnut',
    data:{ labels, datasets:[{ data:vals, backgroundColor:colors, borderWidth:0 }] },
    options:{
      maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      cutout:'62%'
    }
  });
  // Custom HTML legend pills
  if(legendId) {
    const leg = document.getElementById(legendId);
    if(leg) {
      leg.innerHTML = labels.map((l,i) =>
        `<span class="legend-pill"><span class="legend-dot" style="background:${colors[i]}"></span>${l}</span>`
      ).join('');
    }
  }
}

// ── NAV DOTS ──
const TOTAL_SLIDES = 10;
function setupNav() {
  const nav = document.getElementById('nav');
  const wrapper = document.getElementById('slides-wrapper');
  for(let i=0;i<TOTAL_SLIDES;i++){
    const d = document.createElement('button');
    d.className='nav-dot'+(i===0?' active':'');
    d.title=`Diapositiva ${i+1}`;
    d.onclick=()=>{ document.getElementById(`s${i+1}`).scrollIntoView({behavior:'smooth'}); };
    nav.appendChild(d);
  }
  // update dots & counter on scroll
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dots = Array.from(document.querySelectorAll('.nav-dot'));
  const counter = document.getElementById('slide-counter');
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const idx = slides.indexOf(entry.target);
        if(idx>=0){
          dots.forEach((d,i)=>d.classList.toggle('active',i===idx));
          counter.textContent=`${idx+1} / ${TOTAL_SLIDES}`;
        }
      }
    });
  },{root:wrapper, threshold:0.5});
  slides.forEach(s=>observer.observe(s));
  // keyboard nav
  document.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowRight'){
      const cur=dots.findIndex(d=>d.classList.contains('active'));
      if(cur<TOTAL_SLIDES-1) document.getElementById(`s${cur+2}`).scrollIntoView({behavior:'smooth'});
    } else if(e.key==='ArrowUp'||e.key==='ArrowLeft'){
      const cur=dots.findIndex(d=>d.classList.contains('active'));
      if(cur>0) document.getElementById(`s${cur}`).scrollIntoView({behavior:'smooth'});
    }
  });
}

// ── BUILD SLIDES ──
async function init() {
  setupNav();
  let sessionData;
  try {
    const res = await fetch('datos/sesion_2026-04-24T15-50-00-943Z.json');
    if(!res.ok) throw new Error('Fetch falló');
    sessionData = await res.json();
  } catch(e) {
    console.log('Cargando desde LOCAL_SESSIONS (modo local)');
    sessionData = typeof LOCAL_SESSIONS !== 'undefined' ? LOCAL_SESSIONS['sesion_2026-04-24T15-50-00-943Z.json'] : null;
  }
  
  if(sessionData) {
    const data = sessionData; // La lógica espera el objeto directo, no en array
    buildSlide2(data);
    buildSlide3(data);
    buildSlide4(data);
    buildSlide5(data);
    buildSlide6(data);
    buildSlide7(data);
    buildSlide8();
    buildSlide9();
    buildSlide10();
  }
}

function buildSlide2(data) {
  const p = data.participantes;
  const stats = [
    {num:p.length, label:'Total de participantes'},
    {num:p.filter(x=>x.perfil?.genero==='Femenino').length, label:'Mujeres'},
    {num:p.filter(x=>x.perfil?.situacion?.includes('trabajo')).length, label:'Estudian y trabajan'},
    {num:'7°', label:'Semestre homogéneo'},
  ];
  document.getElementById('demo-stats').innerHTML = stats.map(s=>
    `<div class="stat-card"><div class="stat-num">${s.num}</div><div class="stat-label">${s.label}</div></div>`
  ).join('');
  const edCounts = countFreq(p,'edad');
  donutChart('c-edad', Object.keys(edCounts), Object.values(edCounts), 'leg-edad');
  const genCounts = countFreq(p,'genero');
  donutChart('c-gen', Object.keys(genCounts), Object.values(genCounts), 'leg-gen');
}

function buildSlide3(data) {
  const {labels:l1,vals:v1}=totalsToLabelVal('P1',data);
  const {labels:l2,vals:v2}=totalsToLabelVal('P1b',data);
  barChart('c-p1',l1,v1,'#38bdf8');
  barChart('c-p1b',l2,v2,'#06b6d4');
}

function buildSlide4(data) {
  const {labels:l4,vals:v4}=totalsToLabelVal('P4',data);
  const {labels:l7,vals:v7}=totalsToLabelVal('P7',data);
  barChart('c-p4',l4,v4,'#f472b6');
  barChart('c-p7',l7,v7,'#d946ef');
}

function buildSlide5(data) {
  const n = data.totalParticipantes;
  const p8 = data.totalesPorPregunta.P8||{};
  const p9 = data.totalesPorPregunta.P9||{};
  const p10 = data.totalesPorPregunta.P10||{};
  const kpis = [
    {num:`${Math.round((p8.c||0)/n*100)}%`, label:'nunca había escuchado el término "Burnout"', color:'#f472b6'},
    {num:`${Math.round((p9.a||0)/n*100)}%`, label:'confirma haber vivido Burnout ("Sí, sin duda")', color:'#2dd4bf'},
    {num:`${Math.round((p10.a||0)/n*100)}%`, label:'está en un episodio de Burnout activo ahora mismo', color:'#818cf8'},
  ];
  document.getElementById('burnout-kpis').innerHTML = kpis.map(k=>
    `<div class="stat-card card-glow"><div class="stat-num" style="font-size:4rem;color:${k.color}">${k.num}</div><div class="stat-label" style="font-size:1rem">${k.label}</div></div>`
  ).join('');
}

function buildSlide6(data) {
  const {labels:l10,vals:v10}=totalsToLabelVal('P10',data);
  const {labels:l18,vals:v18}=totalsToLabelVal('P18',data);
  barChart('c-p10',l10,v10,'#818cf8');
  barChart('c-p18',l18,v18,'#6366f1');
}

function buildSlide7(data) {
  const {labels:l13,vals:v13}=totalsToLabelVal('P13',data);
  const {labels:l12,vals:v12}=totalsToLabelVal('P12',data);
  barChart('c-p13',l13,v13,'#2dd4bf');
  barChart('c-p12',l12,v12,'#10b981');
}

function buildSlide8() {
  // Curated thematic clusters from P19 responses
  const clusters = [
    {
      emoji: '🚪',
      theme: 'Crisis vocacional',
      quote: '"Querer cancelar la carrera por no ver libertad laboral... la opción más acertada fue dejar la U"',
      analysis: 'Al menos 3 participantes expresaron haber considerado abandonar la carrera, no por desinterés, sino por desgaste acumulado y falta de horizonte laboral claro.'
    },
    {
      emoji: '∞',
      theme: '"No soy suficiente"',
      quote: '"Desde el primer semestre vivo sin ser suficiente en los trabajos, comparándome con mis compañeros, y no solo es en las entregas: es todo el tiempo"',
      analysis: 'La autoevaluación basada en comparación con pares es el patrón más recurrente. El nivel de los compañeros se convierte en una vara de medición que nunca se alcanza.'
    },
    {
      emoji: '🧠',
      theme: 'Impacto en salud mental',
      quote: '"Ansiedad, ganas de morir, frustración... agotamiento a raíz de todos los traumas que he vivido durante la carrera"',
      analysis: 'Varios testimonios revelan síntomas clínicamente significativos: ideación suicida, disociación y agotamiento psicossomático. No son metáforas, son señales de alarma real.'
    },
    {
      emoji: '👨‍🏫',
      theme: 'Relación docente y sistema',
      quote: '"Hay profesores que me desaniman y no me hacen gustar la carrera. Cada vez soy más mediocre en lo que hago"',
      analysis: 'La figura docente aparece como factor protector o de riesgo de forma determinante. La percepción de ser desmotivado por un profesor tiene un costo directo en la identidad creativa del estudiante.'
    },
    {
      emoji: '🌱',
      theme: 'Resiliencia y aprendizaje',
      quote: '"Aprendí a soltar cosas y personas, a tenerme compasión, cuidarme. Explorar nuevas cosas a veces te ayuda, te hace mejor persona"',
      analysis: 'A pesar del peso del relato, emergen voces que demuestran crecimiento post-traumático: la carrera también enseñó a soltar, a conocerse y a construir vínculos genuinos.'
    },
  ];

  const grid = document.getElementById('voces-grid');
  grid.innerHTML = clusters.map(c => `
    <div class="voice-card" style="padding:14px">
      <div style="font-size:1.2rem;margin-bottom:4px">${c.emoji}</div>
      <div class="v-tag" style="margin-bottom:6px">${c.theme}</div>
      <div class="v-text" style="font-size:0.82rem;line-height:1.4">${c.quote}</div>
      <p style="font-size:0.72rem;color:var(--dim);line-height:1.5;margin-top:8px;border-top:1px solid rgba(255,255,255,0.06);padding-top:8px">${c.analysis}</p>
    </div>`).join('');
}

function buildSlide9() {
  // Curated thematic clusters from P20 responses
  const clusters = [
    {
      emojis: ['⭐','🦔','🦉'],
      theme: '"Confía en ti"',
      quote: '"El talento lo tienes, solo necesitas seguridad y confianza en ti misma"',
      sub: '"Siempre se puede dar un poco más, pero nunca debemos olvidar que la autoexigencia no debe destruirnos"',
      analysis: 'El clúster más frecuente es la autoafirmación. Los participantes se piden a sí mismos creer en su propio potencial: lo saben, pero no lo practican.'
    },
    {
      emojis: ['🦚','🦜'],
      theme: 'Permiso para descansar',
      quote: '"Agradezco toda tu exigencia, pero debes descansar un poco de vez en cuando"',
      sub: '"Tu puédes bebé, duerme más"',
      analysis: 'Varios participantes le dan permiso explícito a su autoexigencia de soltar. Es una forma de autocompasión directa que contrasta con la culpa que sienten al descansar en el día a día.'
    },
    {
      emojis: ['🫧','🐻','🐨'],
      theme: 'Amor propio y enfoque',
      quote: '"Quírete a ti misma por lo que haces y házlo por tu cuenta"',
      sub: '"No debes ser dura contigo misma. Enfócate más, puedes mejorar muchas cosas aunque no siempre todo salga bien"',
      analysis: 'La bondad como instrumento de rendimiento: no como debilidad, sino como estrategia. Estos mensajes sugieren que el cuidado propio y la productividad no son opuestos.'
    },
    {
      emojis: ['🐙','🐲','🦝'],
      theme: 'Seguir adelante',
      quote: '"No estás sola. Lo lograremos. Sigamos avanzando poco a poco, yo te cuido"',
      sub: '"Concentrate en ti, no en los demás. Tú puedes"',
      analysis: 'El énfasis en continuar, sin negar la dificultad, refleja una resilencia activa. No es positivismo tóxico: es un reconocimiento del esfuerzo real que implica seguir.'
    },
  ];

  const grid = document.getElementById('comp-grid');
  grid.style.gridTemplateColumns = 'repeat(2,1fr)';
  grid.innerHTML = clusters.map(c => `
    <div class="comp-card" style="padding:16px">
      <div style="font-size:1.1rem;margin-bottom:6px">${c.emojis.join(' ')}</div>
      <div style="font-size:0.62rem;color:var(--accent);text-transform:uppercase;letter-spacing:.12em;font-weight:700;margin-bottom:8px">${c.theme}</div>
      <div class="cc-text" style="font-size:0.84rem;line-height:1.4">${c.quote}</div>
      <div style="font-size:0.76rem;color:var(--dim);font-style:italic;margin:6px 0">${c.sub}</div>
      <p style="font-size:0.72rem;color:var(--dim);line-height:1.5;margin-top:8px;border-top:1px solid rgba(45,212,191,0.1);padding-top:8px">${c.analysis}</p>
    </div>`).join('');
}

function buildSlide10() {
  document.getElementById('conc-grid').innerHTML = CONCLUSIONS.map(c=>
    `<div class="conc-card"><div class="conc-num">${c.num}</div><div class="conc-title">${c.title}</div><div class="conc-desc">${c.desc}</div></div>`
  ).join('');
}

init();



