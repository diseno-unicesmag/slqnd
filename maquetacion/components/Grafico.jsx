// Gráficos de la CDPS redibujados en SVG: un solo estilo, dorado solo en el valor destacado (máximo).

const MORADOS = ['#7c3aed', '#9b7bf0', '#b9a8f0', '#5b4bc4', '#d0c4f5', '#8e6be8'];
const ORO = '#f0c24b';
const fmt = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
const destacados = vals => { const m = Math.max(...vals); return vals.map(v => v === m); };

const Defs = () => (
  <defs>
    <linearGradient id="gNorm" x1="0" x2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#b9a8f0" /></linearGradient>
    <linearGradient id="gDest" x1="0" x2="1"><stop offset="0" stopColor="#6d4ae0" /><stop offset="1" stopColor={ORO} /></linearGradient>
    <linearGradient id="gNormV" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#b9a8f0" /></linearGradient>
    <linearGradient id="gDestV" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#6d4ae0" /><stop offset="1" stopColor={ORO} /></linearGradient>
  </defs>
);

function BarrasH({ c }) {
  const grupos = c.groups || [{ categories: c.categories, values: c.series[0].values }];
  const fila = 32, izq = 250, ancho = 600, pista = ancho - izq - 64;
  let y = 6; const filas = [];
  grupos.forEach((g, gi) => {
    if (g.title) { filas.push(<text key={'t' + gi} x={0} y={y + 16} className="g-tit">{g.title}</text>); y += 26; }
    const max = Math.max(...g.values, 1), d = destacados(g.values);
    g.categories.forEach((cat, i) => {
      const w = (g.values[i] / max) * pista, yy = y;
      filas.push(
        <g key={gi + '-' + i}>
          <text x={izq - 10} y={yy + 17} textAnchor="end" className="g-cat">{cat}</text>
          <rect x={izq} y={yy + 4} width={pista} height={18} rx={9} className="g-pista" />
          <rect x={izq} y={yy + 4} width={Math.max(w, 4)} height={18} rx={9} fill={d[i] ? 'url(#gDest)' : 'url(#gNorm)'} />
          <text x={izq + w + 8} y={yy + 18} className="g-val">{fmt(g.values[i])} %</text>
        </g>
      );
      y += fila;
    });
    y += 10;
  });
  return <svg viewBox={`0 0 ${ancho} ${y}`} className="grafico" role="img"><Defs />{filas}</svg>;
}

function Columnas({ c }) {
  const vals = c.series[0].values, cats = c.categories, d = destacados(vals);
  const ancho = 560, alto = 300, base = 230, col = (ancho - 40) / cats.length, top = Math.max(100, ...vals);
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="grafico" role="img">
      <Defs />
      <line x1="20" x2={ancho - 20} y1={base} y2={base} className="g-eje" />
      {cats.map((cat, i) => {
        const h = (vals[i] / top) * (base - 30), x = 20 + i * col + col * 0.22, w = col * 0.56;
        const lineas = []; cat.split(' ').forEach(p => { const u = lineas[lineas.length - 1]; if (u && (u + ' ' + p).length <= 18) lineas[lineas.length - 1] = u + ' ' + p; else lineas.push(p); });
        return (
          <g key={cat}>
            <rect x={x} y={base - h} width={w} height={h} rx={9} fill={d[i] ? 'url(#gDestV)' : 'url(#gNormV)'} />
            <text x={x + w / 2} y={base - h - 8} textAnchor="middle" className="g-val">{fmt(vals[i])} %</text>
            {lineas.map((l, k) => <text key={k} x={x + w / 2} y={base + 18 + k * 13} textAnchor="middle" className="g-cat g-cat-s">{l}</text>)}
          </g>
        );
      })}
    </svg>
  );
}

function Dona({ c }) {
  const vals = c.series[0].values, cats = c.categories, total = vals.reduce((a, b) => a + b, 0), d = destacados(vals);
  const R = 74, cx = 130, cy = 130, grosor = 30, hueco = 0.2; let a0 = -Math.PI / 2, k = 0;
  const color = i => d[i] ? ORO : MORADOS[k++ % MORADOS.length];
  const cols = vals.map((_, i) => color(i));
  const p = a => [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  return (
    <svg viewBox="0 0 560 260" className="grafico" role="img">
      {vals.map((v, i) => {
        const span = (v / total) * Math.PI * 2, a1 = a0 + hueco / 2, a2 = a0 + Math.max(span - hueco / 2, hueco / 2 + 0.001);
        a0 += span; const [x1, y1] = p(a1), [x2, y2] = p(a2);
        return <path key={i} d={`M${x1} ${y1}A${R} ${R} 0 ${a2 - a1 > Math.PI ? 1 : 0} 1 ${x2} ${y2}`} fill="none" stroke={cols[i]} strokeWidth={grosor} strokeLinecap="round" />;
      })}
      <text x={cx} y={cy + 6} textAnchor="middle" className="g-total">{cats.length}</text>
      <text x={cx} y={cy + 22} textAnchor="middle" className="g-cat g-cat-s">afectaciones</text>
      {cats.map((cat, i) => (
        <g key={cat} transform={`translate(270 ${50 + i * 34})`}>
          <rect width="14" height="14" rx="7" fill={cols[i]} />
          <text x="24" y="12" className="g-cat">{cat}</text>
          <text x="270" y="12" textAnchor="end" className="g-val">{fmt(vals[i])} %</text>
        </g>
      ))}
    </svg>
  );
}

function Radar({ c }) {
  const vals = c.series[0].values, cats = c.categories, n = cats.length, cx = 280, cy = 160, R = 110, max = 5, d = destacados(vals);
  const pt = (i, v) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + R * (v / max) * Math.cos(a), cy + R * (v / max) * Math.sin(a)]; };
  return (
    <svg viewBox="0 0 560 330" className="grafico" role="img">
      {[1, 2, 3, 4, 5].map(k => <polygon key={k} points={cats.map((_, i) => pt(i, k).join(',')).join(' ')} className="g-red" />)}
      {cats.map((_, i) => <line key={i} x1={cx} y1={cy} x2={pt(i, max)[0]} y2={pt(i, max)[1]} className="g-red" />)}
      <polygon points={vals.map((v, i) => pt(i, v).join(',')).join(' ')} fill="rgba(124,58,237,.28)" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round" />
      {vals.map((v, i) => { const [x, y] = pt(i, v); return d[i] ? <circle key={i} cx={x} cy={y} r="5" fill={ORO} stroke="#7c3aed" strokeWidth="1.5" /> : <circle key={i} cx={x} cy={y} r="3" fill="#7c3aed" />; })}
      {cats.map((cat, i) => {
        const [x, y] = pt(i, max + 0.55), anc = Math.abs(x - cx) < 10 ? 'middle' : x > cx ? 'start' : 'end';
        return <text key={cat} x={x} y={y + 4} textAnchor={anc} className="g-cat g-cat-s">{cat} · {fmt(vals[i])}</text>;
      })}
    </svg>
  );
}

export default function Grafico({ chart }) {
  if (!chart) return null;
  if (chart.type === 'doughnut' || chart.type === 'pie') return <Dona c={chart} />;
  if (chart.type === 'radar') return <Radar c={chart} />;
  if (chart.dir === 'bar' || chart.groups) return <BarrasH c={chart} />;
  return <Columnas c={chart} />;
}
