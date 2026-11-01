"""Tercera pasada: lleva el documento estructurado al de la maquetación.
Copia las imágenes nuevas (sin duplicar las que ya existen), conserva las fotos y créditos
que se corrigieron a mano y el estilo del documento anterior.
Uso: python3 importar.py doc2.json out/img maquetacion/public/contenido"""
import json, os, re, shutil, hashlib, sys
src, img_src, dst = sys.argv[1:4]
md5 = lambda p: hashlib.md5(open(p, 'rb').read()).hexdigest()
old = json.load(open(os.path.join(dst, 'documento.json')))
d = json.load(open(src))
img = os.path.join(dst, 'img')
existentes = {md5(os.path.join(img, f)): f for f in sorted(os.listdir(img))}
def fix(s):
    if not s or not s.startswith('img/'): return s
    n = os.path.basename(s); p = os.path.join(img_src, n); k = md5(p)
    if k not in existentes:
        nn = 'p26-' + n
        shutil.copy(p, os.path.join(img, nn)); existentes[k] = nn
    return 'img/' + existentes[k]
for b in d['blocks']:
    if b.get('src'): b['src'] = fix(b['src'])
    if b.get('images'): b['images'] = [fix(x) for x in b['images']]
# Fotos y créditos corregidos a mano: se conservan por título
viejos = {b.get('title'): b for b in old['blocks'] if b['type'] == 'figure'}
for b in d['blocks']:
    o = viejos.get(b.get('title')) if b['type'] == 'figure' else None
    if not o: continue
    if (o.get('src') or '').startswith('img/referente-') or o.get('src') == 'img/figura9-matriz.jpeg': b['src'] = o['src']
    if 'Fotografía:' in (o.get('note') or '') and 'Fotografía:' not in (b.get('note') or ''): b['note'] = o['note']
for k in old:
    if k not in ('blocks', 'meta'): d[k] = old[k]
json.dump(d, open(os.path.join(dst, 'documento.json'), 'w'), ensure_ascii=False, indent=1)
print(len(d['blocks']), 'bloques')
