/* ==============================================
   CDPS — App logic (participant)
   ============================================== */

const socket = io();

// --- State ---
const screens = document.querySelectorAll('.screen');
const totalSteps = 7; // code(1) + carga(2) + det(3) + din(4) + con(5) + text(6) + thanks(7)
let currentScreen = 0;

const response = {
  code: '',
  carga: null,
  detonantes: [],
  dinamicas: [],
  consecuencias: [],
  texto: ''
};

// --- Labels for reveal ---
const LABELS = {
  detonantes: {
    autoexigencia: '🪨 Autoexigencia propia',
    entregas: '⏰ Entregas y deadlines',
    familia: '👨‍👩‍👧 Expectativas familiares',
    comparacion: '📊 Compararse con otros',
    carga: '📚 Carga de materias',
    fracaso: '😰 Miedo al fracaso',
    redes: '📱 Redes sociales',
    futuro: '🔮 Futuro laboral'
  },
  dinamicas: {
    aislamiento: '🚪 Me aíslo',
    insomnio: '🌙 No duermo bien',
    mas_exigencia: '⚡ Me exijo aún más',
    callar: '🤐 Callo lo que siento',
    desmotivacion: '📉 Pierdo la motivación',
    postergar: '⏳ Postergo todo',
    comparar: '👀 Comparo mi trabajo',
    no_pedir_ayuda: '🙅 No pido ayuda'
  },
  consecuencias: {
    ansiedad: '💭 Ansiedad constante',
    sueno: '😴 Problemas de sueño',
    aislamiento_social: '🏝️ Aislamiento social',
    paralisis: '✏️ Parálisis creativa',
    motivacion: '🔋 Pérdida de motivación',
    relaciones: '💔 Problemas con otros',
    vacio: '🕳️ Vacío emocional',
    insuficiencia: '∞ Nunca es suficiente'
  }
};

// --- Particles ---
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = Math.random() * 10 + 's';
    p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
    container.appendChild(p);
  }
}
createParticles();

// --- Screen navigation ---
function goToScreen(index) {
  screens.forEach(s => s.classList.remove('active'));
  screens[index].classList.add('active');
  currentScreen = index;
  // Update progress (skip welcome=0 and reveal=8)
  const step = Math.max(0, index - 1);
  const pct = Math.min(100, (step / totalSteps) * 100);
  document.getElementById('progressFill').style.width = pct + '%';
}

// --- Code entry ---
const inputCode = document.getElementById('inputCode');
const btnCode = document.getElementById('btnCode');

inputCode.addEventListener('input', () => {
  btnCode.disabled = inputCode.value.trim().length === 0;
});
inputCode.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !btnCode.disabled) submitCode();
});

function submitCode() {
  response.code = inputCode.value.trim().toUpperCase();
  socket.emit('join', response.code);
  goToScreen(2);
}

// --- Battery selection ---
function selectBattery(value) {
  response.carga = value;
  document.querySelectorAll('.battery-option').forEach(opt => {
    opt.classList.toggle('selected', parseInt(opt.dataset.value) === value);
  });
  document.getElementById('btnCarga').disabled = false;
}

// --- Card toggle ---
function toggleCard(card) {
  card.classList.toggle('selected');
  const grid = card.closest('.card-grid');
  const gridId = grid.id;
  const selected = grid.querySelectorAll('.card.selected');
  const count = selected.length;

  // Update response
  const values = Array.from(selected).map(c => c.dataset.value);
  if (gridId === 'gridDetonantes') {
    response.detonantes = values;
    document.getElementById('counterDetonantes').textContent = count + ' seleccionado' + (count !== 1 ? 's' : '');
    document.getElementById('btnDetonantes').disabled = count === 0;
  } else if (gridId === 'gridDinamicas') {
    response.dinamicas = values;
    document.getElementById('counterDinamicas').textContent = count + ' seleccionado' + (count !== 1 ? 's' : '');
    document.getElementById('btnDinamicas').disabled = count === 0;
  } else if (gridId === 'gridConsecuencias') {
    response.consecuencias = values;
    document.getElementById('counterConsecuencias').textContent = count + ' seleccionado' + (count !== 1 ? 's' : '');
    document.getElementById('btnConsecuencias').disabled = count === 0;
  }
}

// --- Text input ---
const inputTexto = document.getElementById('inputTexto');
const charCount = document.getElementById('charCount');
const btnTexto = document.getElementById('btnTexto');

inputTexto.addEventListener('input', () => {
  const len = inputTexto.value.length;
  charCount.textContent = len;
  btnTexto.disabled = len < 5;
});

// --- Submit all ---
function submitAll() {
  response.texto = inputTexto.value.trim();
  socket.emit('submit', response);
  goToScreen(7); // gracias
  document.getElementById('progressFill').style.width = '100%';
}

// --- Socket events ---
socket.on('participant-count', (data) => {
  const el1 = document.getElementById('waitCompleted');
  const el2 = document.getElementById('waitTotal');
  if (el1) el1.textContent = data.completed;
  if (el2) el2.textContent = data.total;
});

socket.on('reveal', (data) => {
  renderReveal(data);
  goToScreen(8);
});

socket.on('session-reset', () => {
  location.reload();
});

// --- Render reveal ---
function renderReveal(data) {
  document.getElementById('revealCount').textContent = data.totalParticipants;

  // Battery
  const batteryHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div class="reveal-battery-visual">
        <div class="reveal-battery-fill" style="height:${(data.cargaPromedio / 5) * 100}%"></div>
      </div>
      <div class="reveal-battery-number">${data.cargaPromedio}</div>
      <div class="reveal-battery-label">de 5</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-left:24px;">
      ${data.cargaDistribucion.map((count, i) => `
        <div style="display:flex;align-items:center;gap:8px;font-size:0.85rem;">
          <span style="color:var(--text-dim);min-width:60px;">Nivel ${i+1}</span>
          <div style="background:rgba(255,255,255,0.04);border-radius:4px;height:20px;flex:1;overflow:hidden;">
            <div style="height:100%;background:var(--accent);border-radius:4px;width:${data.totalParticipants ? (count/data.totalParticipants)*100 : 0}%;transition:width 1s ease;"></div>
          </div>
          <span style="color:var(--text);font-weight:500;min-width:24px;">${count}</span>
        </div>
      `).join('')}
    </div>`;
  document.getElementById('revealBatteryBar').innerHTML = batteryHTML;

  // Bar charts
  renderBars('revealBarsDetonantes', data.detonantes, LABELS.detonantes, data.totalParticipants);
  renderBars('revealBarsDinamicas', data.dinamicas, LABELS.dinamicas, data.totalParticipants);
  renderBars('revealBarsConsecuencias', data.consecuencias, LABELS.consecuencias, data.totalParticipants);

  // Confession wall
  const wall = document.getElementById('confessionWall');
  wall.innerHTML = '';
  data.textos.forEach((txt, i) => {
    const card = document.createElement('div');
    card.className = 'confession-card';
    card.style.animationDelay = (i * 0.15) + 's';
    card.textContent = `"${txt}"`;
    wall.appendChild(card);
  });
}

function renderBars(containerId, counts, labels, total) {
  const container = document.getElementById(containerId);
  // Sort by count descending
  const sorted = Object.entries(labels)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...sorted.map(s => s.count), 1);

  container.innerHTML = sorted.map((item, i) => `
    <div class="reveal-bar-row" style="animation-delay:${i * 0.1}s">
      <span class="reveal-bar-label">${item.label}</span>
      <div class="reveal-bar-track">
        <div class="reveal-bar-fill" style="width:0%" data-target="${(item.count / maxCount) * 100}">
          <span class="reveal-bar-count">${item.count}</span>
        </div>
      </div>
    </div>
  `).join('');

  // Animate bars after a brief delay
  setTimeout(() => {
    container.querySelectorAll('.reveal-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  }, 300);
}
