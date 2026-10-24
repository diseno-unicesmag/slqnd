// Gráficos de la CDPS redibujados en SVG a partir de los datos del Word (nítidos en pantalla, PDF e InDesign).

const PALETA = ['#7c3aed', '#9b7bf0', '#b9a8f0', '#f0c24b', '#5b6fd8', '#d98fd0'];
const fmt = v => (Math.round(v * 10) / 10).toString().replace('.', ',');

function Barras({ c, horizontal }) {
  const vals = c.series[0].values, cats = c.categories, max = Math.max(...vals, 1);
  if (horizontal) {
    const fila = 34, izq = 210, ancho = 560, alto = cats.length * fila + 16;
    return (
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="grafico" role="img">
        {cats.map((cat, i) => {
          const y = 8 + i * fila, w = (vals[i] / max) * (ancho - izq - 60);
          return (
            <g key={cat}>
              <text x={izq - 10} y={y + 17} textAnchor="end" className="g-cat">{cat}</text>
              <rect x={izq} y={y + 4} width={ancho - izq - 60} height={20} rx={10} className="g-pista" />
              <rect x={izq} y={y + 4} width={Math.max(w, 2)} height={20} rx={10} fill={`url(#gb${i % 2})`} />
              <text x={izq + w + 8} y={y + 18} className="g-val">{fmt(vals[i])} %</text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="gb0" x1="0" x2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#b9a8f0" /></linearGradient>
          <linearGradient id="gb1" x1="0" x2="1"><stop offset="0" stopColor="#6d4ae0" /><stop offset="1" stopColor="#f0c24b" /></linearGradient>
        </defs>
      </svg>
    );
  }
  const ancho = 560, alto = 300, base = 230, col = (ancho - 40) / cats.length;
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="grafico" role="img">
      <defs><linearGradient id="gc" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#b9a8f0" /></linearGradient></defs>
      <line x1="20" x2={ancho - 20} y1={base} y2={base} className="g-eje" />
      {cats.map((cat, i) => {
        const h = (vals[i] / 100) * (base - 30), x = 20 + i * col + col * 0.22, w = col * 0.56;
        const palabras = cat.split(' '), lineas = [];
        palabras.forEach(p => { const u = lineas[lineas.length - 1]; if (u && (u + ' ' + p).length <= 18) lineas[lineas.length - 1] = u + ' ' + p; else lineas.push(p); });
        return (
          <g key={cat}>
            <rect x={x} y={base - h} width={w} height={h} rx={10} fill="url(#gc)" />
            <text x={x + w / 2} y={base - h - 8} textAnchor="middle" className="g-val">{fmt(vals[i])} %</text>
            {lineas.map((l, k) => <text key={k} x={x + w / 2} y={base + 18 + k * 13} textAnchor="middle" className="g-cat g-cat-s">{l}</text>)}
          </g>
        );
      })}
    </svg>
  );
}

function Dona({ c }) {
  const vals = c.series[0].values, cats = c.categories, total = vals.reduce((a, b) => a + b, 0);
  const R = 92, r = 56, cx = 130, cy = 130; let a0 = -Math.PI / 2;
  const arco = (a1, a2) => {
    const p = (rad, a) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)], g = a2 - a1 > Math.PI ? 1 : 0;
    const [x1, y1] = p(R, a1), [x2, y2] = p(R, a2), [x3, y3] = p(r, a2), [x4, y4] = p(r, a1);
    return `M${x1} ${y1}A${R} ${R} 0 ${g} 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 ${g} 0 ${x4} ${y4}Z`;
  };
  return (
    <svg viewBox="0 0 560 260" className="grafico" role="img">
      {vals.map((v, i) => { const a1 = a0, a2 = a0 + (v / total) * Math.PI * 2 - 0.02; a0 += (v / total) * Math.PI * 2; return <path key={i} d={arco(a1, a2)} fill={PALETA[i % PALETA.length]} />; })}
      <circle cx={cx} cy={cy} r={r - 6} className="g-centro" />
      <text x={cx} y={cy + 6} textAnchor="middle" className="g-total">{cats.length}</text>
      <text x={cx} y={cy + 22} textAnchor="middle" className="g-cat g-cat-s">afectaciones</text>
      {cats.map((cat, i) => (
        <g key={cat} transform={`translate(270 ${50 + i * 34})`}>
          <rect width="14" height="14" rx="7" fill={PALETA[i % PALETA.length]} />
          <text x="24" y="12" className="g-cat">{cat}</text>
          <text x="270" y="12" textAnchor="end" className="g-val">{fmt(vals[i])} %</text>
        </g>
      ))}
    </svg>
  );
}

function Radar({ c }) {
  const vals = c.series[0].values, cats = c.categories, n = cats.length, cx = 280, cy = 160, R = 110, max = 5;
  const pt = (i, v) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + R * (v / max) * Math.cos(a), cy + R * (v / max) * Math.sin(a)]; };
  return (
    <svg viewBox="0 0 560 330" className="grafico" role="img">
      {[1, 2, 3, 4, 5].map(k => <polygon key={k} points={cats.map((_, i) => pt(i, k).join(',')).join(' ')} className="g-red" />)}
      {cats.map((_, i) => <line key={i} x1={cx} y1={cy} x2={pt(i, max)[0]} y2={pt(i, max)[1]} className="g-red" />)}
      <polygon points={vals.map((v, i) => pt(i, v).join(',')).join(' ')} fill="rgba(124,58,237,.28)" stroke="#7c3aed" strokeWidth="2" />
      {vals.map((v, i) => { const [x, y] = pt(i, v); return <circle key={i} cx={x} cy={y} r="4" fill="#f0c24b" stroke="#7c3aed" strokeWidth="1.5" />; })}
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
  return <Barras c={chart} horizontal={chart.dir === 'bar'} />;
}
