// Copia el polyfill de Paged.js a public/ para la vista de páginas (corre después de npm install).
import { copyFileSync, mkdirSync } from 'node:fs';
mkdirSync('public/vendor', { recursive: true });
copyFileSync('node_modules/pagedjs/dist/paged.polyfill.min.js', 'public/vendor/paged.polyfill.min.js');
