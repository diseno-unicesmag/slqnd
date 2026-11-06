# Fondo de portada con refracción de cristal que se estira hacia arriba-derecha y abajo-izquierda
import sys, numpy as np
from PIL import Image
src, dst, A = sys.argv[1], sys.argv[2], float(sys.argv[3])
im = Image.open(src).convert('RGB'); W0, H0 = im.size
w = round(H0 * 8.5 / 11); x0 = (W0 - w) // 2
im = im.crop((x0, 0, x0 + w, H0)); a = np.asarray(im).astype(np.float32); H, W = a.shape[:2]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
def muestra(ch, X, Y):
    X = np.clip(X, 0, W - 1.001); Y = np.clip(Y, 0, H - 1.001); x0 = np.floor(X).astype(int); y0 = np.floor(Y).astype(int); fx = X - x0; fy = Y - y0
    c = a[..., ch]; return (c[y0, x0] * (1 - fx) * (1 - fy) + c[y0, x0 + 1] * fx * (1 - fy) + c[y0 + 1, x0] * (1 - fx) * fy + c[y0 + 1, x0 + 1] * fx * fy)
out = np.zeros_like(a); R = 0.62 * H
for ch, k in ((0, 1.07), (1, 1.0), (2, 0.93)):     # aberración cromática: cada canal se dobla distinto
    X, Y = xx.copy(), yy.copy()
    for cx, cy in ((W, 0), (0, H)):
        dx, dy = cx - xx, cy - yy; d = np.sqrt(dx * dx + dy * dy)
        s = np.exp(-(d / R) ** 2) * A * k
        X += dx * s; Y += dy * s
    out[..., ch] = muestra(ch, X, Y)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst, quality=93); print('ok', W, H)
