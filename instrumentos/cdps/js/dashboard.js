Chart.defaults.color = '#ffffff';
Chart.defaults.font.family = "'Inter', sans-serif";

const THEME_COLORS = [
  '#f5c542', // accent yellow
  '#a78bfa', // violet
  '#7c9cbf', // blue-muted
  '#f472b6', // pink
  '#7aad8a', // green-muted
  '#e8b820', // amber
  '#fb923c', // orange
  '#38bdf8', // sky
  '#c084fc', // purple
  '#4ade80'  // green
];

let globalData = null;
let globalFilename = '';
let currentMode = 'general'; // 'general' | 'user'
let currentUserIndex = 0;

async function init() {
  await loadSessionList();
  setupEventListeners();
}

async function loadSessionList() {
  try {
    // const res = await fetch('/api/sesiones');
    // const files = await res.json();
    const files = ['sesion_2026-04-24T15-50-00-943Z.json'];
    const select = document.getElementById('session-select');
    select.innerHTML = '';
    
    if(files.length === 0) {
      select.innerHTML = '<option>No hay sesiones</option>';
      return;
    }

    files.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      // Formatear nombre de archivo para lectura humana
      const datePart = f.replace('sesion_', '').replace('.json', '');
      opt.textContent = `Sesión: ${datePart.replace('T', ' ').substring(0, 19)}`;
      select.appendChild(opt);
    });

    await loadData(files[0]);
  } catch (error) {
    console.error(error);
  }
}

async function loadData(filename) {
  try {
    const data = LOCAL_SESSIONS[filename];
    if(!data) throw new Error('Data not found locally');
    
    globalData = data;
    globalFilename = filename;
    
    // Al cargar una nueva sesión, forzar a modo general para evitar cruce de datos
    setMode('general');
    
    const dateStr = new Date(data.fecha).toLocaleString('es-CO');
    document.getElementById('meta-info').innerText = `Sesión: ${dateStr} | Participantes: ${data.totalParticipantes}`;

    populateUserSelect(data.participantes);
    renderCurrentMode();
  } catch(e) {
    console.error(e);
  }
}

function setupEventListeners() {
  document.getElementById('session-select').addEventListener('change', (e) => {
    loadData(e.target.value);
  });

  document.getElementById('btn-general').addEventListener('click', () => {
    setMode('general');
  });

  document.getElementById('btn-user').addEventListener('click', () => {
    setMode('user');
  });
}

function setMode(mode) {
  currentMode = mode;
  document.getElementById('btn-general').classList.toggle('active', mode === 'general');
  document.getElementById('btn-user').classList.toggle('active', mode === 'user');
  document.getElementById('user-select-group').style.display = mode === 'user' ? 'flex' : 'none';
  
  document.getElementById('view-general').style.display = mode === 'general' ? 'block' : 'none';
  document.getElementById('view-user').style.display = mode === 'user' ? 'block' : 'none';
  
  renderCurrentMode();
}

function renderCurrentMode() {
  if(!globalData) return;
  if(currentMode === 'general') {
    renderGeneralMode();
  } else {
    renderUserMode();
  }
}

function populateUserSelect(participantes) {
  const grid = document.getElementById('user-btn-grid');
  grid.innerHTML = '';
  currentUserIndex = 0; // Reset on new data

  participantes.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    if(i === 0) btn.classList.add('active');
    btn.title = `Estudiante ${i+1}`;
    btn.textContent = p.emoji;
    
    btn.addEventListener('click', () => {
      // Remover active de todos
      Array.from(grid.children).forEach(child => child.classList.remove('active'));
      // Añadir active al clickeado
      btn.classList.add('active');
      currentUserIndex = i;
      if(currentMode === 'user') renderUserMode();
    });
    
    grid.appendChild(btn);
  });
}

// ── VISTA GENERAL ──
function renderGeneralMode() {
  // Limpiar contenedores
  document.getElementById('demo-grid').innerHTML = '';
  document.getElementById('quant-container').innerHTML = '';
  document.getElementById('cualitativo-container').innerHTML = '';
  
  // Destruir gráficos anteriores para evitar overlaps
  Chart.helpers.each(Chart.instances, function(instance){
    instance.destroy();
  });

  renderDemographics(globalData.participantes);
  renderQuantitative(globalData, globalFilename);
  renderQualitative(globalData.participantes);
}

function countFreq(arr, key) {
  const counts = {};
  arr.forEach(p => {
    if(p.perfil && p.perfil[key]) {
      counts[p.perfil[key]] = (counts[p.perfil[key]] || 0) + 1;
    }
  });
  return counts;
}

function renderDemographics(participantes) {
  const grid = document.getElementById('demo-grid');
  const keys = [
    { key: 'edad', title: 'Rango de Edad' },
    { key: 'genero', title: 'Identidad de Género' },
    { key: 'estrato', title: 'Estrato Socioeconómico' },
    { key: 'situacion', title: 'Situación Actual' }
  ];

  keys.forEach((k, idx) => {
    const counts = countFreq(participantes, k.key);
    const labels = Object.keys(counts);
    const data = Object.values(counts);

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${k.title}</h3><canvas id="chart-${k.key}"></canvas>`;
    grid.appendChild(card);

    new Chart(document.getElementById(`chart-${k.key}`), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: THEME_COLORS.slice(0, labels.length), // Fluid palette
          borderWidth: 0
        }]
      },
      options: {
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 22 } } },
        cutout: '65%'
      }
    });
  });
}

function renderQuantitative(data, filename) {
  const container = document.getElementById('quant-container');
  const prefix = filename.replace('.json', '');

  PREGUNTAS.forEach((q, idx) => {
    if (q.tipo === 'texto' || q.tipo === 'texto-vivo') return;

    const totales = data.totalesPorPregunta[q.id] || {};
    const labels = [];
    const values = [];
    
    q.opciones.forEach(opt => {
      labels.push(opt.label_acad || opt.label);
      values.push(totales[opt.id] || 0);
    });

    const wrap = document.createElement('div');
    wrap.className = 'q-container';
    const screenshotUrl = `instrumentos/cdps/resultados/captura_${prefix}_${q.id}.png`;

    wrap.innerHTML = `
      <div class="q-info">
        <div style="color:var(--muted); font-weight:600; text-transform:uppercase; font-size:0.8rem; letter-spacing:0.1em; margin-bottom:8px;">${q.bloque}</div>
        <h3>${q.texto_jovial || q.texto}</h3>
        <p>${q.texto}</p>
        <button onclick="openModal('${screenshotUrl}')" style="display:inline-flex;align-items:center;gap:6px;margin-top:14px;padding:8px 18px;border-radius:10px;background:rgba(245,197,66,.1);border:1px solid rgba(245,197,66,.28);color:#f5c542;font-weight:600;font-size:.82rem;cursor:pointer;transition:.25s;font-family:inherit;" onmouseover="this.style.background='rgba(245,197,66,.18)'" onmouseout="this.style.background='rgba(245,197,66,.1)'">📸 Explorar Lienzo</button>
      </div>
      <div class="q-chart">
        <canvas id="chart-${q.id}"></canvas>
      </div>
    `;
    container.appendChild(wrap);

    // Pick a single color from the palette for the bars based on question index
    const barColor = THEME_COLORS[idx % THEME_COLORS.length];

    new Chart(document.getElementById(`chart-${q.id}`), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Votos',
          data: values,
          backgroundColor: THEME_COLORS.slice(0, values.length).map(c => c + 'cc'),
          borderColor: THEME_COLORS.slice(0, values.length),
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1, color: 'rgba(255,255,255,.55)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { 
            ticks: { color: '#ffffff', font: { size: 12 } }, 
            grid: { display: false },
            afterFit: function(scaleInstance) {
              scaleInstance.width = 280;
            }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  });
}

function renderQualitative(participantes) {
  const container = document.getElementById('cualitativo-container');
  const qTexto = PREGUNTAS.filter(q => q.tipo === 'texto' || q.tipo === 'texto-vivo');

  qTexto.forEach(q => {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '60px';
    wrap.innerHTML = `<h3 style="color:var(--accent); margin-bottom:20px; font-size:1.6rem;">${q.texto_jovial}</h3><div class="masonry" id="masonry-${q.id}"></div>`;
    container.appendChild(wrap);

    const masonry = document.getElementById(`masonry-${q.id}`);
    
    participantes.forEach(p => {
      if (p.respuestas && p.respuestas[q.id]) {
        let resp = p.respuestas[q.id];
        if (!Array.isArray(resp)) resp = [resp];
        
        resp.forEach(text => {
          if (!text.trim()) return;
          const note = document.createElement('div');
          note.className = 'post-it';
          note.innerHTML = `<div class="post-it-emoji">${p.emoji}</div><div class="post-it-text">"${text}"</div>`;
          masonry.appendChild(note);
        });
      }
    });
  });
}

// ── VISTA POR ESTUDIANTE ──
function renderUserMode() {
  if (currentUserIndex === null || currentUserIndex === undefined) return;
  const p = globalData.participantes[currentUserIndex];
  if (!p) return;
  
  // Llenar Perfil
  document.getElementById('user-profile').style.display = 'block';
  document.getElementById('user-emoji').textContent = p.emoji;
  document.getElementById('user-title').textContent = `Estudiante ${currentUserIndex+1}`;
  
  const statsGrid = document.getElementById('user-stats');
  statsGrid.innerHTML = '';
  if(p.perfil) {
    const pKeys = [
      {k:'edad', t:'Edad'}, {k:'genero', t:'Género'}, {k:'semestre', t:'Semestre'},
      {k:'estrato', t:'Estrato'}, {k:'situacion', t:'Situación'}
    ];
    pKeys.forEach(item => {
      if(p.perfil[item.k]) {
        statsGrid.innerHTML += `<div class="user-stat"><span>${item.t}</span><strong>${p.perfil[item.k]}</strong></div>`;
      }
    });
  }

  // Llenar Respuestas
  const ansContainer = document.getElementById('user-answers-container');
  ansContainer.innerHTML = '';
  
  PREGUNTAS.forEach(q => {
    let rawAns = p.respuestas ? p.respuestas[q.id] : null;
    if(!rawAns) return; // Saltó la pregunta

    let textAns = '';

    if (q.tipo === 'texto' || q.tipo === 'texto-vivo') {
      if(Array.isArray(rawAns)) {
        textAns = rawAns.map(r => `"${r}"`).join('<br><br>');
      } else {
        textAns = `"${rawAns}"`;
      }
    } else {
      // Es cerrada (unica, multiple, etc)
      if(!Array.isArray(rawAns)) rawAns = [rawAns];
      const selectedOpts = q.opciones.filter(o => rawAns.includes(o.id));
      textAns = selectedOpts.map(o => `<strong>${o.label}</strong> <span style="font-size:0.9em; color:var(--dim)">(${o.label_acad})</span>`).join('<br><br>');
    }

    const card = document.createElement('div');
    card.className = 'ans-card';
    card.innerHTML = `
      <div class="bloque">${q.bloque}</div>
      <div class="pregunta">${q.texto_jovial || q.texto}</div>
      <div class="respuesta">${textAns}</div>
    `;
    ansContainer.appendChild(card);
  });
}

// ── MODAL ──
function openModal(imgUrl) {
  document.getElementById('modal-img').src = imgUrl;
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

document.getElementById('modal').addEventListener('click', (e) => {
  if(e.target.id === 'modal') closeModal();
});

// Arrancar
init();


