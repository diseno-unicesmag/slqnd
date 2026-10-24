'use client';

import { useEffect, useRef } from 'react';
import Grafico from './Grafico';
import { esCapitulo, partesCapitulo, textoPlano } from '@/lib/doc';

/* Texto editable sin que React pise el cursor: el HTML se escribe una vez y se lee al salir. */
function Editable({ tag: Tag = 'div', html, editable, onCambio, onTecla, className, ...resto }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html && document.activeElement !== ref.current) ref.current.innerHTML = html || '';
  }, [html]);
  if (!editable) return <Tag className={className} dangerouslySetInnerHTML={{ __html: html || '' }} {...resto} />;
  return (
    <Tag
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onBlur={e => { const h = e.currentTarget.innerHTML; if (h !== html) onCambio(h); }}
      onKeyDown={onTecla}
      dangerouslySetInnerHTML={{ __html: html || '' }}
      {...resto}
    />
  );
}

function Imagen({ src, resolver, editable, onSoltar, alt }) {
  if (!src) {
    return (
      <div className={'fig-vacia' + (editable ? ' soltable' : '')} onDragOver={e => editable && e.preventDefault()} onDrop={e => { e.preventDefault(); onSoltar?.(e.dataTransfer.files[0]); }}>
        <span>Imagen pendiente</span>
        {editable && <small>Arrastra una imagen aquí o usa «Cambiar imagen» en el panel derecho</small>}
      </div>
    );
  }
  return <img src={resolver(src)} alt={alt || ''} onDragOver={e => editable && e.preventDefault()} onDrop={e => { e.preventDefault(); onSoltar?.(e.dataTransfer.files[0]); }} />;
}

function Figura({ b, editable, cambiar, resolver, onImagen }) {
  const imgs = b.images?.length ? b.images : [b.src];
  return (
    <figure className={`figura tam-${b.tamano || 'completo'}${imgs.length > 1 ? ' galeria g' + Math.min(imgs.length, 4) : ''}`}>
      <figcaption className="fig-cab">
        <Editable tag="span" className="fig-rotulo" html={b.label} editable={editable} onCambio={h => cambiar({ label: textoPlano(h) })} />
        <Editable tag="span" className="fig-titulo" html={b.title} editable={editable} onCambio={h => cambiar({ title: textoPlano(h) })} />
      </figcaption>
      {b.chart ? <div className="fig-grafico"><Grafico chart={b.chart} /></div> : (
        <div className="fig-imgs">
          {imgs.map((s, i) => <Imagen key={i} src={s} resolver={resolver} editable={editable} alt={b.title} onSoltar={f => onImagen(f, i)} />)}
        </div>
      )}
      {(b.note || editable) && <Editable className="fig-nota" html={b.note || ''} editable={editable} onCambio={h => cambiar({ note: h })} />}
    </figure>
  );
}

function Tabla({ b, editable, cambiar }) {
  const celda = (fila, col, enCab) => h => {
    const clave = enCab ? 'head' : 'rows';
    const copia = b[clave].map(r => [...r]); copia[fila][col] = h; cambiar({ [clave]: copia });
  };
  return (
    <figure className="tabla">
      <figcaption className="fig-cab">
        <Editable tag="span" className="fig-rotulo" html={b.label} editable={editable} onCambio={h => cambiar({ label: textoPlano(h) })} />
        <Editable tag="span" className="fig-titulo" html={b.title} editable={editable} onCambio={h => cambiar({ title: textoPlano(h) })} />
      </figcaption>
      <div className="tabla-marco">
        <table>
          {b.head?.length > 0 && <thead>{b.head.map((r, i) => <tr key={i}>{r.map((c, j) => <Editable key={j} tag="th" html={c} editable={editable} onCambio={celda(i, j, true)} />)}</tr>)}</thead>}
          <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <Editable key={j} tag="td" html={c} editable={editable} onCambio={celda(i, j, false)} />)}</tr>)}</tbody>
        </table>
      </div>
      {(b.note || editable) && <Editable className="fig-nota" html={b.note || ''} editable={editable} onCambio={h => cambiar({ note: h })} />}
    </figure>
  );
}

function TituloPortada({ b, editable, cambiar }) {
  const t = textoPlano(b.html), [titulo, ...sub] = t.split(/\s+[-–]\s+/);
  if (editable) return <Editable tag="h1" className="portada-h1 editando" html={b.html} editable onCambio={h => cambiar({ html: h })} />;
  return <h1 className="portada-h1"><span className="t">{titulo}</span><span className="s">{sub.join(' – ')}</span></h1>;
}

function Apertura({ b, editable, cambiar }) {
  const { num, nombre } = partesCapitulo(b);
  return (
    <div className="apertura-arte">
      <div className="manchas" aria-hidden="true"><i /><i /><i /></div>
      <span className="apertura-num" aria-hidden="true">{num.padStart(2, '0')}</span>
      <div className="apertura-cristal">
        <span className="apertura-cap">Capítulo {num}</span>
        <Editable tag="h1" className="capitulo" data-cap={nombre} html={editable ? b.html : nombre} editable={editable} onCambio={h => cambiar({ html: h })} />
      </div>
    </div>
  );
}

export function Bloque({ b, meta, editable, cambiar, resolver, onImagen, onTecla }) {
  switch (b.type) {
    case 'heading': {
      if (esCapitulo(b)) return <Apertura b={b} editable={editable} cambiar={cambiar} />;
      const Tag = 'h' + Math.min(b.level, 6);
      return <Editable tag={Tag} className={`t${b.level}${b.pre ? ' pre' : ''}`} html={b.html} editable={editable} onCambio={h => cambiar({ html: h })} onTecla={onTecla} />;
    }
    case 'p':
      if (b.style === 'portada-titulo') return <TituloPortada b={b} editable={editable} cambiar={cambiar} />;
      return <Editable tag="p" className={b.style || undefined} html={b.html} editable={editable} onCambio={h => cambiar({ html: h })} onTecla={onTecla} />;
    case 'quote':
      return <Editable tag="blockquote" className="cita" html={b.html} editable={editable} onCambio={h => cambiar({ html: h })} />;
    case 'list':
      return (
        <ul className="lista">
          {b.items.map((it, i) => (
            <Editable key={i} tag="li" html={it} editable={editable} onCambio={h => { const items = [...b.items]; items[i] = h; cambiar({ items: items.filter((x, k) => k === i ? textoPlano(x) : true) }); }}
              onTecla={editable ? e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); const items = [...b.items]; items.splice(i + 1, 0, ''); cambiar({ items }); } } : undefined} />
          ))}
        </ul>
      );
    case 'figure': return <Figura b={b} editable={editable} cambiar={cambiar} resolver={resolver} onImagen={onImagen} />;
    case 'table': return <Tabla b={b} editable={editable} cambiar={cambiar} />;
    case 'image': return <figure className="figura"><Imagen src={b.src} resolver={resolver} /></figure>;
    default: return null;
  }
}

/* Agrupa los bloques en secciones de página: portada, aperturas de capítulo y cuerpo.
   Cada sección empieza en página nueva y lleva el capítulo vigente para la cabecera. */
export function secciones(bloques) {
  const out = []; let actual = null, capitulo = '';
  const abrir = (tipo, b) => { actual = { tipo, capitulo, bloques: [], id: b.id }; out.push(actual); };
  for (const b of bloques) {
    if (esCapitulo(b)) {
      capitulo = partesCapitulo(b).nombre;
      abrir('apertura', b); actual.bloques.push(b); actual = null; continue;
    }
    if (b.style === 'portada-titulo') { abrir('portada', b); actual.bloques.push(b); continue; }
    if (!actual || b.breakBefore) {
      if (b.type === 'heading' && b.level === 1 && !b.pre) capitulo = textoPlano(b.html);
      abrir(b.style === 'portadilla-titulo' ? 'portadilla' : 'cuerpo', b);
    }
    actual.bloques.push(b);
  }
  return out;
}

export default function Documento({ doc, editable, seleccion, onSeleccionar, cambiarBloque, resolver, onImagen, onTecla, paraImprimir }) {
  return (
    <div className="libro">
      {secciones(doc.blocks).map(s => (
        <section key={s.id} className={`seccion sec-${s.tipo}`} data-capitulo={s.capitulo}>
          {paraImprimir && s.tipo === 'cuerpo' && <span className="cab-cap">{s.capitulo}</span>}
          {s.tipo === 'portada' && <div className="manchas" aria-hidden="true"><i /><i /><i /><i /></div>}
          {s.tipo === 'portada' && <p className="portada-eyebrow">Proyecto de Grado · Diseño Gráfico</p>}
          {s.bloques.map(b => (
              <div key={b.id} id={'b-' + b.id} data-id={b.id} className={'bloque' + (seleccion === b.id ? ' sel' : '') + (b.breakBefore && editable ? ' con-salto' : '')}
                onMouseDown={() => onSeleccionar?.(b.id)}>
                <Bloque b={b} meta={doc.meta} editable={editable} cambiar={c => cambiarBloque(b.id, c)} resolver={resolver}
                  onImagen={(f, i) => onImagen?.(b.id, f, i)} onTecla={onTecla ? e => onTecla(e, b) : undefined} />
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
