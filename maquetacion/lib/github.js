// Guardado en el repositorio desde el navegador (API de contenidos de GitHub).
// El token se guarda solo en este navegador; nunca va dentro del repositorio.

export const REPO_BASE = {
  owner: 'diseno-unicesmag',
  repo: 'slqnd',
  rama: 'next',
  ruta: 'maquetacion/public/contenido/documento.json',
  carpetaImg: 'maquetacion/public/contenido/img',
  token: '',
};

const api = (c, ruta) => `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${ruta.split('/').map(encodeURIComponent).join('/')}`;
const cabeceras = c => ({ Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' });

const aBase64 = texto => { const bytes = new TextEncoder().encode(texto); let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
const deBase64 = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), ch => ch.charCodeAt(0)));

async function fallo(r) {
  let msg = r.status + ''; try { msg = (await r.json()).message || msg; } catch {}
  if (r.status === 401) return new Error('El token no es válido o venció.');
  if (r.status === 403 || r.status === 404) return new Error('El token no tiene permiso de escritura en ' + msg);
  return new Error('GitHub respondió: ' + msg);
}

async function sha(c, ruta) {
  const r = await fetch(api(c, ruta) + '?ref=' + encodeURIComponent(c.rama), { headers: cabeceras(c), cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw await fallo(r);
  return (await r.json()).sha;
}

export async function leerDocumento(c) {
  const r = await fetch(api(c, c.ruta) + '?ref=' + encodeURIComponent(c.rama), { headers: cabeceras(c), cache: 'no-store' });
  if (!r.ok) throw await fallo(r);
  const j = await r.json();
  if (j.content) return JSON.parse(deBase64(j.content));
  // Archivos de más de 1 MB: se piden por su blob.
  const b = await fetch(j.git_url, { headers: cabeceras(c) });
  return JSON.parse(deBase64((await b.json()).content));
}

async function subir(c, ruta, contenidoB64, mensaje) {
  for (let intento = 0; intento < 2; intento++) {
    const body = { message: mensaje, content: contenidoB64, branch: c.rama };
    const s = await sha(c, ruta); if (s) body.sha = s;
    const r = await fetch(api(c, ruta), { method: 'PUT', headers: cabeceras(c), body: JSON.stringify(body) });
    if (r.ok) return r.json();
    if (r.status !== 409 && r.status !== 422) throw await fallo(r);
  }
  throw new Error('No se pudo guardar: el archivo cambió en GitHub mientras guardabas. Intenta otra vez.');
}

export const guardarDocumento = (c, doc, mensaje = 'Actualiza la maquetación') =>
  subir(c, c.ruta, aBase64(JSON.stringify(doc, null, 1)), mensaje);

export async function subirImagen(c, archivo) {
  const limpio = archivo.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').toLowerCase();
  const nombre = Date.now().toString(36) + '-' + limpio;
  const b64 = await new Promise((ok, mal) => { const fr = new FileReader(); fr.onload = () => ok(fr.result.split(',')[1]); fr.onerror = mal; fr.readAsDataURL(archivo); });
  await subir(c, c.carpetaImg + '/' + nombre, b64, 'Añade imagen ' + nombre);
  return 'img/' + nombre;
}
