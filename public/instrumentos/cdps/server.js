const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/resultados', express.static(path.join(__dirname, 'resultados')));

// ── API: Listar sesiones disponibles ──
app.get('/api/sesiones', (req, res) => {
  const datosDir = path.join(__dirname, 'datos');
  if (!fs.existsSync(datosDir)) return res.json([]);
  const files = fs.readdirSync(datosDir).filter(f => f.endsWith('.json')).sort().reverse();
  res.json(files);
});

// ── API: Obtener resultados de una sesión ──
app.get('/api/resultados', (req, res) => {
  const datosDir = path.join(__dirname, 'datos');
  if (!fs.existsSync(datosDir)) return res.status(404).json({error: 'No hay datos'});
  
  let targetFile = req.query.file;
  if (!targetFile) {
    const files = fs.readdirSync(datosDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) return res.status(404).json({error: 'No hay datos'});
    // Elegir el archivo con más datos (mayor tamaño) como sesión por defecto
    targetFile = files
      .map(f => ({ name: f, size: fs.statSync(path.join(datosDir, f)).size }))
      .sort((a, b) => b.size - a.size)[0].name;
  }
  
  const targetPath = path.join(datosDir, targetFile);
  if (!fs.existsSync(targetPath)) return res.status(404).json({error: 'Archivo no encontrado'});
  
  const content = fs.readFileSync(targetPath, 'utf-8');
  res.json({ filename: targetFile, data: JSON.parse(content) });
});

const EMOJIS = ['🦊','🐺','🦁','🐯','🐻','🦝','🦉','🦋','🐸','🦜','🦩','🦚','🦦','🦥','🐙','🦑','🦈','🐬','🦭','🐨','🦙','🦘','🦡','🦎','🐲','🦕','🌵','🍄','⭐','🌙','🪐','🔮','🎭','🎨','🐠','🦔','🐝','🌈','🫧','🦗'];

// Preguntas IDs (sincronizado con preguntas.js)
const PREGUNTA_IDS = ['P0','P1','P1b','P2','P3','P4','P4b','P5','P6','P7','P8','P9','P10','P11','P12','P13','P14','P15','P16','P16b','P17','P18','P19','P20'];

const session = {
  byIP: new Map(),      // ip → { emoji, perfil, stickers: [{roomId, relX, relY}], respuestas:{}, sockets:Set }
  usedEmojis: new Set(),
  question: null,       // índice actual (0-21)
  questionRevealed: false, // si la pregunta actual ya se reveló
  allResults: [],       // [{questionIdx, questionId, counts}]
  savedCapturas: new Set() // Tracks which questions have been screenshotted
};

// ── Helpers ──
function getIP(socket) {
  const fwd = socket.handshake.headers['x-forwarded-for'];
  return (fwd ? fwd.split(',')[0] : socket.handshake.address).trim();
}

function assignEmoji() {
  const available = EMOJIS.filter(e => !session.usedEmojis.has(e));
  const pool = available.length ? available : EMOJIS;
  const emoji = pool[Math.floor(Math.random() * pool.length)];
  session.usedEmojis.add(emoji);
  return emoji;
}

function countRegistered() {
  let n = 0; session.byIP.forEach(p => { if (p.perfil) n++; }); return n;
}
function countConnected() {
  let n = 0; session.byIP.forEach(p => { if (p.sockets.size > 0 && p.perfil) n++; }); return n;
}

function broadcastPlayers() {
  const list = [];
  session.byIP.forEach((p, ip) => {
    if (p.perfil) list.push({ id: ip, emoji: p.emoji, x: p.x||400, y: p.y||300 });
  });
  io.emit('players', list);
}

function broadcastCounts() {
  const counts = {};
  session.byIP.forEach(p => {
    if (!p.perfil) return;
    (p.stickers||[]).forEach(s => { counts[s.roomId] = (counts[s.roomId]||0) + 1; });
  });
  io.emit('room-counts', counts);
  io.emit('player-count', { total: countRegistered(), connected: countConnected() });
}

// ── Guardar respuestas de la pregunta actual ANTES de avanzar ──
function snapshotCurrentQuestion() {
  if (session.question === null) return;
  const qIdx = session.question;
  const qId  = PREGUNTA_IDS[qIdx] || `Q${qIdx}`;

  // Calcular totales
  const counts = {};
  session.byIP.forEach(p => {
    if (!p.perfil) return;
    (p.stickers||[]).forEach(s => { counts[s.roomId] = (counts[s.roomId]||0) + 1; });
    // Guardar respuesta individual en el perfil del jugador
    if (p.stickers && p.stickers.length > 0) {
      p.respuestas[qId] = p.stickers.length === 1 ? p.stickers[0].roomId : p.stickers.map(s => s.roomId);
    }
  });

  // Actualizar o agregar en allResults
  const existing = session.allResults.find(r => r.questionIdx === qIdx);
  if (existing) {
    existing.counts = counts;
  } else {
    session.allResults.push({ questionIdx: qIdx, questionId: qId, counts });
  }

  saveData(); // Guardar progresivamente en cada avance
}

// ── Guardar JSON ──
function saveData() {
  const dir = path.join(__dirname, 'datos');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  // Construir array de participantes con sus respuestas individuales
  const participantes = [];
  session.byIP.forEach(p => {
    if (!p.perfil) return;
    participantes.push({
      emoji: p.emoji,
      perfil: p.perfil,
      respuestas: p.respuestas || {}
    });
  });

  // Calcular totales por pregunta (tabla de frecuencias)
  const totalesPorPregunta = {};
  session.allResults.forEach(r => {
    totalesPorPregunta[r.questionId] = r.counts;
  });

  const data = {
    fecha: new Date().toISOString(),
    totalParticipantes: participantes.length,
    preguntaActual: session.question !== null ? PREGUNTA_IDS[session.question] : null,
    participantes,          // Un objeto por persona con perfil + sus respuestas
    totalesPorPregunta      // Conteos agregados por pregunta
  };

  // Un único archivo por sesión (se sobreescribe con datos más frescos)
  if (!session._filename) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    session._filename = `sesion_${ts}.json`;
  }
  fs.writeFileSync(path.join(dir, session._filename), JSON.stringify(data, null, 2));
  console.log(`  💾 Datos guardados (${participantes.length} participantes, ${session.allResults.length} preguntas respondidas)`);
}

// ── Socket ──
io.on('connection', socket => {
  const ip = getIP(socket);
  console.log(`Conexión: ${socket.id} | IP: ${ip}`);

  if (session.byIP.has(ip)) {
    const p = session.byIP.get(ip);
    p.sockets.add(socket.id);
    socket.emit('welcome', {
      emoji: p.emoji, perfil: p.perfil,
      question: session.question, questionRevealed: session.questionRevealed, returning: true
    });
    console.log(`  ↩ Jugador existente: ${p.emoji}`);
  } else {
    session.byIP.set(ip, {
      emoji: null, perfil: null,
      stickers: [], respuestas: {}, sockets: new Set([socket.id])
    });
    socket.emit('welcome', { emoji: null, perfil: null, question: null, questionRevealed: false, returning: false });
    console.log(`  ❆ Nueva IP, pendiente de registro`);
  }

  socket.emit('session-state', {
    question: session.question,
    questionRevealed: session.questionRevealed,
    playerCount: { total: countRegistered(), connected: countConnected() }
  });
  broadcastCounts();

  // ── Registro ──
  socket.on('register', perfil => {
    const p = session.byIP.get(ip);
    if (!p) return;
    if (!p.emoji) p.emoji = assignEmoji();
    p.perfil = perfil;
    if (!p.respuestas) p.respuestas = {};
    socket.emit('registered', { emoji: p.emoji, question: session.question });
    console.log(`  ✔ Registrado: ${p.emoji} | ${perfil.programa} | sem ${perfil.semestre}`);
    broadcastPlayers();
    broadcastCounts();
    saveData(); // Guardar al registrarse
  });

  // ── Pegar/Despegar Sticker ──
  socket.on('place-sticker', (stickers) => {
    const p = session.byIP.get(ip);
    if (!p || !p.perfil) return;
    p.stickers = stickers; // Array of {roomId, relX, relY}
  });

  // ── Burbujas en vivo (P0) ──
  socket.on('live-text', (text) => {
    const p = session.byIP.get(ip);
    if (p && p.perfil) io.emit('live-text', { emoji: p.emoji, text });
  });

  // ── Guardar captura de pantalla ──
  socket.on('save-screenshot', ({ qId, dataUrl }) => {
    if (session.savedCapturas.has(qId)) return; // Solo guardar una vez por pregunta
    session.savedCapturas.add(qId);
    
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const resultsDir = path.join(__dirname, 'resultados');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
    
    // Ensure filename exists
    if (!session._filename) {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      session._filename = `sesion_${ts}.json`;
    }
    const prefix = session._filename.replace('.json', '');
    const filePath = path.join(resultsDir, `captura_${prefix}_${qId}.png`);
    
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if (err) console.error('Error guardando captura:', err);
      else console.log('📸 Captura guardada:', filePath);
    });
  });

  // ── Panel: avanzar pregunta ──
  socket.on('set-question', idx => {
    snapshotCurrentQuestion();
    session.byIP.forEach(p => { p.stickers = []; });
    session.question = idx;
    session.questionRevealed = false;
    session.savedCapturas.clear();
    io.emit('question-changed', idx);
    broadcastCounts();
    console.log(`  ➜ Pregunta ${idx + 1}: ${PREGUNTA_IDS[idx]}`);
  });

  // ── Panel: revelar pregunta actual ──
  socket.on('reveal-question', () => {
    session.questionRevealed = true;
    
    // Recopilar todos los stickers puestos para enviarlos a todos
    const allStickers = [];
    session.byIP.forEach((p, ip) => {
      if (!p.perfil) return;
      (p.stickers || []).forEach(s => {
        allStickers.push({ emoji: p.emoji, roomId: s.roomId, relX: s.relX, relY: s.relY });
      });
    });

    io.emit('question-revealed', allStickers);
    saveData();
    console.log(`  👁️  Pregunta revelada. Stickers enviados: ${allStickers.length}`);
  });

  // ── Panel: reiniciar ──
  socket.on('reset', () => {
    session._filename = null; // Nuevo archivo en la siguiente sesión
    session.byIP.clear();
    session.usedEmojis.clear();
    session.question = null;
    session.allResults = [];
    session.questionRevealed = false;
    io.emit('reset');
    console.log('  ↺ Sesión reiniciada');
  });

  socket.on('disconnect', () => {
    const p = session.byIP.get(ip);
    if (p) p.sockets.delete(socket.id);
    console.log(`  ✕ Desconectado: ${socket.id} | IP: ${ip}`);
  });
});

// ── Game Loop (Optimizador de red) ──
setInterval(() => {
  if (session.byIP.size === 0) return;
  // Solo se envían conteos al investigador. Los jugadores no los ven en vivo.
  broadcastCounts();
}, 500);

const PORT = 3000;
server.listen(PORT, () => {
  let ip = 'localhost';
  for (const iface of Object.values(os.networkInterfaces()))
    for (const c of iface) if (c.family==='IPv4'&&!c.internal) { ip=c.address; break; }
  console.log(`\n  Juego:  http://${ip}:${PORT}\n  Panel:  http://${ip}:${PORT}/panel.html\n`);
});
