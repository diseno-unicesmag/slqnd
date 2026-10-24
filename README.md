# Sobre lo que no digo

Dos aplicaciones en Next.js con exportación estática, publicadas juntas en GitHub Pages:

| Carpeta | Qué es | Dirección |
|---|---|---|
| `web/` | El sitio del proyecto (actividades, ruta, CDPS, concepto) | https://diseno-unicesmag.github.io/slqnd/ |
| `maquetacion/` | El editor de la maquetación del documento de grado | https://diseno-unicesmag.github.io/slqnd/maquetacion/ |

## Ramas y publicación

- `next`: el código fuente (esta rama).
- `main`: lo publicado. No se toca a mano.

Cada cambio que llega a `next` se publica solo con la acción **Publicar** (`.github/workflows/publicar.yml`), en unos dos minutos.
Eso incluye lo que se guarda desde el botón «Guardar en GitHub» de la maquetación.

## Trabajar en local (opcional)

```bash
cd web && npm install && npm run dev            # http://localhost:8765
cd maquetacion && npm install && npm run dev    # http://localhost:8766
```

## Maquetación

- El contenido vive en `maquetacion/public/contenido/documento.json` y las imágenes en `maquetacion/public/contenido/img/`.
- En el editor: **Editar** para escribir sobre las hojas, **Páginas** para ver la paginación real (carta), **Exportar** para PDF, InDesign o un respaldo.
- Para guardar en el repositorio desde el navegador hace falta un token de GitHub con permiso de escritura de contenidos sobre este repositorio (se pide en ⚙ Ajustes y queda solo en ese navegador).
- `maquetacion/herramientas/` tiene los scripts que convirtieron el Word en `documento.json`, por si hay que volver a importar una versión nueva.
