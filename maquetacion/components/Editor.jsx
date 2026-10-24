'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Documento from './Documento';
import Paginas from './Paginas';
import GlassRuntime from './GlassRuntime';
import { ESTILO_BASE, FUENTES, ESTILOS_PARRAFO, TAMANOS_FIGURA, TIPOS_NUEVOS, bloqueNuevo, cssVariables, indice, pendientes, textoPlano, urlFuentes, nuevoId } from '@/lib/doc';
import { REPO_BASE, leerDocumento, guardarDocumento, subirImagen } from '@/lib/github';
import { exportarInDesign } from '@/lib/indesign';
import { pub } from '@/lib/base';

const CLAVE_BORRADOR = 'slqnd-maquetacion-borrador';
const CLAVE_REPO = 'slqnd-maquetacion-repo';
const leerLocal = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const escribirLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const hora = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const normalizar = d => ({ ...d, estilo: { ...ESTILO_BASE, ...(d.estilo || {}) } });

function descargar(nombre, blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export default function Editor() {
  const [doc, setDoc] = useState(null);
  const [modo, setModo] = useState('editar');
  const [sel, setSel] = useState(null);
  const [panel, setPanel] = useState('estilo');
  const [aviso, setAviso] = useState('');
  const [estado, setEstado] = useState('');
  const [repo, setRepo] = useState(REPO_BASE);
  const [ajustes, setAjustes] = useState(false);
  const [menuExp, setMenuExp] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [zoom, setZoom] = useState(1);
  const historia = useRef({ atras: [], adelante: [] });
  const blobs = useRef({});
  const paginas = useRef(null);
  const sucio = useRef(false);
  const foco = useRef(null);
  // Enfoca el bloque recién creado apenas React lo pinta (antes de que llegue la siguiente tecla).
  useLayoutEffect(() => { if (foco.current) { const [id, alFinal] = foco.current; foco.current = null; enfocar(id, alFinal); } });

  // ── Carga: borrador de este navegador › repositorio (con token) › archivo publicado ──
  useEffect(() => {
    const r = { ...REPO_BASE, ...(leerLocal(CLAVE_REPO) || {}) }; setRepo(r);
    (async () => {
      const borrador = leerLocal(CLAVE_BORRADOR);
      if (borrador?.blocks) { setDoc(normalizar(borrador)); setEstado('Borrador de este navegador'); return; }
      if (r.token) {
        try { setDoc(normalizar(await leerDocumento(r))); setEstado('Cargado desde GitHub'); return; } catch (e) { setAviso(e.message); }
      }
      const d = await (await fetch(pub('/contenido/documento.json'), { cache: 'no-store' })).json();
      setDoc(normalizar(d)); setEstado('Versión publicada');
    })();
  }, []);

  // Autoguardado en el navegador
  useEffect(() => {
    if (!doc || !sucio.current) return;
    const t = setTimeout(() => { setEstado(escribirLocal(CLAVE_BORRADOR, doc) ? 'Guardado en este navegador · ' + hora() : 'No cabe en el navegador: guarda en GitHub'); }, 500);
    return () => clearTimeout(t);
  }, [doc]);

  const aplicar = useCallback((fn, agrupar) => {
    setDoc(prev => {
      const sig = fn(prev); if (sig === prev) return prev;
      const h = historia.current;
      if (!agrupar || h.ultimo !== agrupar) { h.atras.push(prev); if (h.atras.length > 120) h.atras.shift(); }
      h.ultimo = agrupar; h.adelante = []; sucio.current = true;
      return sig;
    });
  }, []);

  const deshacer = () => { const h = historia.current; if (!h.atras.length) return; setDoc(prev => { h.adelante.push(prev); h.ultimo = null; sucio.current = true; return h.atras.pop(); }); };
  const rehacer = () => { const h = historia.current; if (!h.adelante.length) return; setDoc(prev => { h.atras.push(prev); h.ultimo = null; sucio.current = true; return h.adelante.pop(); }); };

  useEffect(() => {
    const k = e => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey && !e.target.isContentEditable) { e.preventDefault(); deshacer(); }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) && !e.target.isContentEditable) { e.preventDefault(); rehacer(); }
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); guardarRepo(); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });

  const cambiarBloque = useCallback((id, cambios) => aplicar(d => ({ ...d, blocks: d.blocks.map(b => b.id === id ? { ...b, ...cambios } : b) })), [aplicar]);
  const cambiarEstilo = (k, v) => aplicar(d => ({ ...d, estilo: { ...d.estilo, [k]: v } }), 'estilo-' + k);
  const cambiarMeta = (k, v) => aplicar(d => ({ ...d, meta: { ...d.meta, [k]: v } }), 'meta-' + k);

  const indiceDe = id => doc.blocks.findIndex(b => b.id === id);
  const insertar = (tipo, tras = sel) => {
    const nb = bloqueNuevo(tipo);
    aplicar(d => { const bs = [...d.blocks]; const i = tras ? bs.findIndex(b => b.id === tras) : bs.length - 1; bs.splice(i + 1, 0, nb); return { ...d, blocks: bs }; });
    setSel(nb.id); setPanel('bloque'); foco.current = [nb.id];
  };
  const mover = dir => aplicar(d => { const bs = [...d.blocks], i = bs.findIndex(b => b.id === sel), j = i + dir; if (j < 0 || j >= bs.length) return d; [bs[i], bs[j]] = [bs[j], bs[i]]; return { ...d, blocks: bs }; });
  const duplicar = () => aplicar(d => { const bs = [...d.blocks], i = bs.findIndex(b => b.id === sel); bs.splice(i + 1, 0, { ...structuredClone(bs[i]), id: nuevoId() }); return { ...d, blocks: bs }; });
  const eliminar = id => { aplicar(d => ({ ...d, blocks: d.blocks.filter(b => b.id !== id) })); setSel(null); };

  function enfocar(id, alFinal) {
    const el = document.querySelector(`.bloque[data-id="${id}"] [contenteditable]`); if (!el) return;
    el.focus();
    if (alFinal) { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Enter parte el párrafo; Retroceso en un bloque vacío lo borra.
  const onTecla = (e, b) => {
    const el = e.currentTarget;
    if (e.key === 'Enter' && !e.shiftKey && (b.type === 'p' || b.type === 'heading')) {
      e.preventDefault();
      const s = getSelection(); if (!s.rangeCount) return;
      const r = s.getRangeAt(0); r.deleteContents();
      const resto = document.createRange(); resto.selectNodeContents(el); resto.setStart(r.endContainer, r.endOffset);
      const caja = document.createElement('div'); caja.appendChild(resto.extractContents());
      const nb = { id: nuevoId(), type: 'p', html: textoPlano(caja.innerHTML) ? caja.innerHTML : '' };
      const actual = el.innerHTML;
      aplicar(d => { const bs = d.blocks.map(x => x.id === b.id ? { ...x, html: actual } : x); bs.splice(bs.findIndex(x => x.id === b.id) + 1, 0, nb); return { ...d, blocks: bs }; });
      setSel(nb.id); foco.current = [nb.id];
    }
    if (e.key === 'Backspace' && !textoPlano(el.innerHTML) && b.type === 'p') {
      e.preventDefault();
      const i = indiceDe(b.id), prev = doc.blocks[i - 1];
      eliminar(b.id); if (prev) { setSel(prev.id); foco.current = [prev.id, true]; }
    }
  };

  // ── Imágenes ──
  const resolver = useCallback(src => {
    if (!src) return '';
    if (blobs.current[src]) return blobs.current[src];
    if (/^(data:|blob:|https?:)/.test(src)) return src;
    return pub('/contenido/' + src);
  }, []);

  const ponerImagen = async (id, archivo, i = 0) => {
    if (!archivo || !archivo.type.startsWith('image/')) return;
    let src;
    if (repo.token) {
      try { setOcupado(true); setEstado('Subiendo imagen…'); src = await subirImagen(repo, archivo); blobs.current[src] = URL.createObjectURL(archivo); setEstado('Imagen subida · ' + hora()); }
      catch (e) { setAviso(e.message); return; } finally { setOcupado(false); }
    } else {
      src = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(archivo); });
      if (archivo.size > 1.5e6) setAviso('La imagen pesa mucho para guardarla en el navegador. Configura GitHub en Ajustes para subirla al repositorio.');
    }
    aplicar(d => ({ ...d, blocks: d.blocks.map(b => {
      if (b.id !== id) return b;
      if (b.images?.length) { const images = [...b.images]; images[i] = src; return { ...b, images, src: images[0] }; }
      return { ...b, src };
    }) }));
  };

  // ── GitHub ──
  async function guardarRepo() {
    if (!repo.token) { setAjustes(true); return; }
    try {
      setOcupado(true); setEstado('Guardando en GitHub…');
      await guardarDocumento(repo, doc);
      setEstado('Guardado en GitHub · ' + hora() + ' · la web se actualiza en ~2 min');
    } catch (e) { setAviso(e.message); setEstado('No se guardó en GitHub'); } finally { setOcupado(false); }
  }
  async function traerRepo() {
    if (!confirm('Esto reemplaza lo que ves por la versión guardada en GitHub. ¿Seguimos?')) return;
    try { setOcupado(true); const d = normalizar(await leerDocumento(repo)); aplicar(() => d); setEstado('Cargado desde GitHub · ' + hora()); } catch (e) { setAviso(e.message); } finally { setOcupado(false); }
  }
  async function volverPublicada() {
    if (!confirm('Esto descarta el borrador de este navegador y carga la versión publicada. ¿Seguimos?')) return;
    const d = normalizar(await (await fetch(pub('/contenido/documento.json'), { cache: 'no-store' })).json());
    aplicar(() => d); setEstado('Versión publicada');
  }
  const guardarAjustes = r => { setRepo(r); escribirLocal(CLAVE_REPO, r); setAjustes(false); };

  // ── Exportar ──
  const exportarPDF = () => {
    setMenuExp(false);
    if (modo !== 'paginas') { setModo('paginas'); setAviso('Cuando terminen de componerse las páginas, pulsa otra vez Exportar › PDF. En el diálogo elige «Guardar como PDF».'); return; }
    paginas.current?.imprimir();
  };
  const exportarJSON = () => { setMenuExp(false); descargar('maquetacion-' + new Date().toISOString().slice(0, 10) + '.json', new Blob([JSON.stringify(doc, null, 1)], { type: 'application/json' })); };
  const importarJSON = f => { if (!f) return; f.text().then(t => { try { const d = JSON.parse(t); if (!d.blocks) throw 0; aplicar(() => normalizar(d)); setEstado('Respaldo importado'); } catch { setAviso('Ese archivo no es un respaldo de la maquetación.'); } }); };
  const exportarID = async () => {
    setMenuExp(false);
    try { setOcupado(true); setEstado('Preparando paquete de InDesign…'); descargar('SLQND-InDesign.zip', await exportarInDesign(doc, resolver)); setEstado('Paquete de InDesign descargado'); }
    catch (e) { setAviso('No se pudo armar el paquete: ' + e.message); } finally { setOcupado(false); }
  };

  const vars = useMemo(() => doc && cssVariables(doc.estilo), [doc?.estilo]);
  if (!doc) return <div className="cargando">Cargando maquetación…</div>;

  const bloque = doc.blocks.find(b => b.id === sel);
  const toc = indice(doc.blocks), faltan = pendientes(doc.blocks);
  const formato = cmd => e => { e.preventDefault(); document.execCommand(cmd); };

  return (
    <div className="app" style={{ '--zoom': zoom }}>
      <link rel="stylesheet" href={urlFuentes(doc.estilo)} />
      <GlassRuntime clave={modo + ajustes + menuExp} />

      <header className="barra lg-r" data-lg-strength="40">
        <div className="marca"><span className="punto" />Sobre lo que no digo <em>maquetación</em></div>
        <div className="segmentado">
          <button className={modo === 'editar' ? 'on' : ''} onClick={() => setModo('editar')}>Editar</button>
          <button className={modo === 'paginas' ? 'on' : ''} onClick={() => setModo('paginas')}>Páginas</button>
        </div>
        <div className="acciones">
          <button title="Deshacer (Ctrl+Z)" onClick={deshacer} disabled={!historia.current.atras.length}>↶</button>
          <button title="Rehacer (Ctrl+Y)" onClick={rehacer} disabled={!historia.current.adelante.length}>↷</button>
          <span className="estado">{estado}</span>
          <button className="primario" onClick={guardarRepo} disabled={ocupado}>Guardar en GitHub</button>
          <div className="menu-caja">
            <button onClick={() => setMenuExp(v => !v)}>Exportar ▾</button>
            {menuExp && (
              <div className="menu lg-r">
                <button onClick={exportarPDF}>PDF (imprimir)</button>
                <button onClick={exportarID}>InDesign (.zip con script)</button>
                <button onClick={exportarJSON}>Respaldo (.json)</button>
                <label>Importar respaldo…<input type="file" accept="application/json" hidden onChange={e => { setMenuExp(false); importarJSON(e.target.files[0]); }} /></label>
              </div>
            )}
          </div>
          <button title="Ajustes" onClick={() => setAjustes(true)}>⚙</button>
        </div>
      </header>

      {aviso && <div className="aviso lg-r" onClick={() => setAviso('')}>{aviso}<span>×</span></div>}

      <aside className="lateral izq lg">
        <h3>Índice</h3>
        <nav className="toc">
          {toc.map(b => (
            <button key={b.id} className={'n' + b.level + (sel === b.id ? ' on' : '')} onClick={() => { setSel(b.id); setPanel('bloque'); document.querySelector(`[data-id="${b.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              {textoPlano(b.html)}
            </button>
          ))}
        </nav>
        {faltan.length > 0 && (<>
          <h3>Pendientes</h3>
          <div className="pend">
            {faltan.map(b => <button key={b.id} onClick={() => { setModo('editar'); setSel(b.id); setPanel('bloque'); setTimeout(() => document.querySelector(`[data-id="${b.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }}>⚑ {b.label}: {b.title}</button>)}
          </div>
        </>)}
      </aside>

      <main className={'lienzo ' + modo} onMouseDown={e => { if (e.target.classList.contains('lienzo')) setSel(null); }}>
        {modo === 'editar'
          ? <div className="hojas" style={vars}>
              <Documento doc={doc} editable seleccion={sel} onSeleccionar={id => { setSel(id); setPanel('bloque'); }} cambiarBloque={cambiarBloque} resolver={resolver} onImagen={ponerImagen} onTecla={onTecla} />
              <button className="agregar-final" onClick={() => insertar('p', doc.blocks[doc.blocks.length - 1].id)}>+ Añadir párrafo al final</button>
            </div>
          : <Paginas ref={paginas} doc={doc} resolver={resolver} />}
        {modo === 'editar' && (
          <div className="zoom lg-r">
            <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(1)))}>−</button>
            <span>{Math.round(zoom * 100)} %</span>
            <button onClick={() => setZoom(z => Math.min(1.6, +(z + 0.1).toFixed(1)))}>+</button>
          </div>
        )}
      </main>

      <aside className="lateral der lg">
        <div className="pestanas">
          <button className={panel === 'bloque' ? 'on' : ''} onClick={() => setPanel('bloque')}>Bloque</button>
          <button className={panel === 'estilo' ? 'on' : ''} onClick={() => setPanel('estilo')}>Estilo</button>
          <button className={panel === 'datos' ? 'on' : ''} onClick={() => setPanel('datos')}>Datos</button>
        </div>

        {panel === 'bloque' && (bloque ? (
          <div className="inspector">
            <p className="tipo">{{ p: 'Párrafo', heading: 'Título', quote: 'Cita', figure: 'Figura', table: 'Tabla', list: 'Lista', image: 'Imagen' }[bloque.type]}</p>

            {['p', 'heading', 'quote', 'list'].includes(bloque.type) && (
              <div className="fila-btn formato">
                <button onMouseDown={formato('bold')} title="Negrita"><b>N</b></button>
                <button onMouseDown={formato('italic')} title="Cursiva"><i>C</i></button>
                <button onMouseDown={formato('superscript')} title="Superíndice">x²</button>
                <button onMouseDown={formato('removeFormat')} title="Quitar formato">⌫</button>
              </div>
            )}

            {bloque.type === 'heading' && (
              <label>Nivel
                <select value={bloque.level} onChange={e => cambiarBloque(bloque.id, { level: +e.target.value })}>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 1 ? '1 · Capítulo / sección' : n === 5 ? '5 · Actividad (cápsula)' : 'Nivel ' + n}</option>)}
                </select>
              </label>
            )}
            {bloque.type === 'p' && (
              <label>Estilo de párrafo
                <select value={bloque.style || ''} onChange={e => cambiarBloque(bloque.id, { style: e.target.value || undefined })}>
                  {ESTILOS_PARRAFO.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                  {bloque.style && !ESTILOS_PARRAFO.some(([v]) => v === bloque.style) && <option value={bloque.style}>{bloque.style}</option>}
                </select>
              </label>
            )}
            {bloque.type === 'figure' && (<>
              <label>Tamaño
                <select value={bloque.tamano || 'completo'} onChange={e => cambiarBloque(bloque.id, { tamano: e.target.value })}>
                  {TAMANOS_FIGURA.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                </select>
              </label>
              {!bloque.chart && (bloque.images?.length ? bloque.images : [bloque.src]).map((s, i) => (
                <label key={i} className="archivo">{s ? `Cambiar imagen ${bloque.images?.length ? i + 1 : ''}` : 'Poner imagen'}
                  <input type="file" accept="image/*" hidden onChange={e => ponerImagen(bloque.id, e.target.files[0], i)} />
                </label>
              ))}
              {bloque.chart && <p className="ayuda">Gráfico redibujado con los datos de la CDPS. Edita los valores en la pestaña Datos.</p>}
            </>)}
            {bloque.type === 'table' && (
              <div className="fila-btn">
                <button onClick={() => cambiarBloque(bloque.id, { rows: [...bloque.rows, bloque.rows[0].map(() => '')] })}>+ Fila</button>
                <button onClick={() => bloque.rows.length > 1 && cambiarBloque(bloque.id, { rows: bloque.rows.slice(0, -1) })}>− Fila</button>
                <button onClick={() => cambiarBloque(bloque.id, { head: bloque.head.map(r => [...r, '']), rows: bloque.rows.map(r => [...r, '']) })}>+ Col.</button>
                <button onClick={() => bloque.rows[0].length > 1 && cambiarBloque(bloque.id, { head: bloque.head.map(r => r.slice(0, -1)), rows: bloque.rows.map(r => r.slice(0, -1)) })}>− Col.</button>
              </div>
            )}

            <label className="check"><input type="checkbox" checked={!!bloque.breakBefore} onChange={e => cambiarBloque(bloque.id, { breakBefore: e.target.checked })} /> Empezar en página nueva</label>

            <div className="fila-btn">
              <button onClick={() => mover(-1)} title="Subir">↑</button>
              <button onClick={() => mover(1)} title="Bajar">↓</button>
              <button onClick={duplicar}>Duplicar</button>
              <button className="peligro" onClick={() => eliminar(bloque.id)}>Eliminar</button>
            </div>

            <p className="sub">Insertar debajo</p>
            <div className="fila-btn insertar">
              {TIPOS_NUEVOS.map(t => <button key={t.tipo} onClick={() => insertar(t.tipo)}>{t.nombre}</button>)}
            </div>
          </div>
        ) : <p className="ayuda">Haz clic en cualquier bloque de la página para editarlo. Escribe directamente sobre el texto; Enter crea un párrafo nuevo.</p>)}

        {panel === 'estilo' && (
          <div className="inspector">
            <p className="sub">Tipografía</p>
            <label>Texto<select value={doc.estilo.fuenteTexto} onChange={e => cambiarEstilo('fuenteTexto', e.target.value)}>{FUENTES.map(f => <option key={f}>{f}</option>)}</select></label>
            <label>Títulos<select value={doc.estilo.fuenteTitulos} onChange={e => cambiarEstilo('fuenteTitulos', e.target.value)}>{FUENTES.map(f => <option key={f}>{f}</option>)}</select></label>
            <Rango k="tamTexto" n="Tamaño (pt)" min={8} max={14} paso={0.5} e={doc.estilo} f={cambiarEstilo} />
            <Rango k="interlineado" n="Interlineado" min={1.1} max={2.2} paso={0.05} e={doc.estilo} f={cambiarEstilo} />
            <label className="check"><input type="checkbox" checked={doc.estilo.justificado} onChange={e => cambiarEstilo('justificado', e.target.checked)} /> Justificado</label>
            <label className="check"><input type="checkbox" checked={doc.estilo.sangria} onChange={e => cambiarEstilo('sangria', e.target.checked)} /> Sangría de primera línea</label>
            <p className="sub">Página (carta)</p>
            <Rango k="margenSup" n="Margen superior (cm)" min={1} max={4} paso={0.1} e={doc.estilo} f={cambiarEstilo} />
            <Rango k="margenInf" n="Margen inferior (cm)" min={1} max={4} paso={0.1} e={doc.estilo} f={cambiarEstilo} />
            <Rango k="margenInt" n="Margen interior (cm)" min={1} max={4} paso={0.1} e={doc.estilo} f={cambiarEstilo} />
            <Rango k="margenExt" n="Margen exterior (cm)" min={1} max={4} paso={0.1} e={doc.estilo} f={cambiarEstilo} />
            <label className="check"><input type="checkbox" checked={doc.estilo.cabecera} onChange={e => cambiarEstilo('cabecera', e.target.checked)} /> Capítulo en la cabecera</label>
            <p className="sub">Color y cristal</p>
            <div className="colores">
              {[['acento', 'Acento'], ['dorado', 'Dorado'], ['lavanda', 'Lavanda'], ['fondoOscuro', 'Fondo oscuro']].map(([k, n]) => (
                <label key={k} className="color"><input type="color" value={doc.estilo[k]} onChange={e => cambiarEstilo(k, e.target.value)} />{n}</label>
              ))}
            </div>
            <Rango k="cristal" n="Intensidad del cristal" min={0} max={1} paso={0.05} e={doc.estilo} f={cambiarEstilo} />
            <button className="suave" onClick={() => aplicar(d => ({ ...d, estilo: { ...ESTILO_BASE } }))}>Restablecer estilo</button>
          </div>
        )}

        {panel === 'datos' && (
          <div className="inspector">
            <p className="sub">Datos del proyecto</p>
            {[['autor', 'Autor'], ['asesor', 'Asesor'], ['institucion', 'Institución'], ['programa', 'Programa'], ['ciudad', 'Ciudad'], ['anio', 'Año']].map(([k, n]) => (
              <label key={k}>{n}<input value={doc.meta?.[k] || ''} onChange={e => cambiarMeta(k, e.target.value)} /></label>
            ))}
            {bloque?.chart && (<>
              <p className="sub">Datos del gráfico · {bloque.label}</p>
              {bloque.chart.categories.map((c, i) => (
                <label key={i}>{c}<input type="number" step="0.1" value={bloque.chart.series[0].values[i]} onChange={e => {
                  const values = [...bloque.chart.series[0].values]; values[i] = +e.target.value;
                  cambiarBloque(bloque.id, { chart: { ...bloque.chart, series: [{ ...bloque.chart.series[0], values }] } });
                }} /></label>
              ))}
            </>)}
            <p className="sub">Versiones</p>
            <button className="suave" onClick={traerRepo} disabled={!repo.token}>Traer la versión de GitHub</button>
            <button className="suave" onClick={volverPublicada}>Volver a la versión publicada</button>
          </div>
        )}
      </aside>

      {ajustes && <Ajustes repo={repo} cerrar={() => setAjustes(false)} guardar={guardarAjustes} />}
    </div>
  );
}

function Rango({ k, n, min, max, paso, e, f }) {
  return (
    <label className="rango">{n}<span>{e[k]}</span>
      <input type="range" min={min} max={max} step={paso} value={e[k]} onChange={ev => f(k, +ev.target.value)} />
    </label>
  );
}

function Ajustes({ repo, cerrar, guardar }) {
  const [r, setR] = useState(repo);
  const campo = (k, n, tipo = 'text') => <label>{n}<input type={tipo} value={r[k]} onChange={e => setR({ ...r, [k]: e.target.value.trim() })} /></label>;
  return (
    <div className="velo" onMouseDown={e => e.target === e.currentTarget && cerrar()}>
      <div className="dialogo lg-r">
        <h2>Guardar en GitHub</h2>
        <p className="ayuda">Pega un token de acceso de GitHub con permiso de escritura de contenidos (<em>Contents: Read and write</em>) solo para el repositorio <b>{r.owner}/{r.repo}</b>. Se guarda únicamente en este navegador.</p>
        <a className="enlace" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">Crear token en GitHub ↗</a>
        {campo('token', 'Token', 'password')}
        <details><summary>Repositorio</summary>
          {campo('owner', 'Cuenta')}{campo('repo', 'Repositorio')}{campo('rama', 'Rama')}{campo('ruta', 'Archivo del documento')}{campo('carpetaImg', 'Carpeta de imágenes')}
        </details>
        <div className="fila-btn">
          <button className="suave" onClick={cerrar}>Cancelar</button>
          <button className="primario" onClick={() => guardar(r)}>Guardar ajustes</button>
        </div>
      </div>
    </div>
  );
}
