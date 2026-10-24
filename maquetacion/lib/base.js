// Prefijo para archivos de /public cuando el sitio vive en una subcarpeta (GitHub Pages).
export const BASE = process.env.NEXT_PUBLIC_BASE || '';
export const pub = ruta => BASE + ruta;
