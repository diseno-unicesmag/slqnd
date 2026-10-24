# Sobre lo que no digo — sitio del proyecto

Sitio en Next.js (App Router) con exportación estática.

- `npm install` instala las dependencias.
- `npm run dev` abre el sitio en http://localhost:8765.
- `npm run build` genera el sitio estático en `out/`.
- `npm run datos` regenera `data/` desde las fuentes de `legacy/` y del instrumento CDPS.

Estructura: `app/` páginas y estilos, `components/` piezas compartidas (navegación, cristal líquido, lente),
`data/` contenidos, `public/` archivos estáticos y el aplicativo CDPS, `legacy/` la versión anterior en HTML.

## Ramas y publicación

- `next`: código fuente (esta rama).
- `main`: el sitio ya construido; es lo que sirve GitHub Pages.

Para publicar: `bash scripts/publicar.sh "mensaje"` desde Git Bash. Construye el sitio y lo sube a `main`.
