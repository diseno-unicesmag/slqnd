"""Segunda pasada: agrupa figuras y tablas con su rótulo, título y nota, marca subtítulos,
preliminares y referencias, y quita la tabla de contenido del Word (la web genera la suya)."""
import json, re, sys

src, dst = sys.argv[1:3]
doc = json.load(open(src))
B = doc["blocks"]

def txt(h): return re.sub(r"<[^>]+>", "", h or "").strip()
def is_p(b): return b and b["type"] == "p"
LABEL_APA = re.compile(r"^(Figura|Tabla) (\d+)$")
LABEL_REF = re.compile(r"^Figura (R?\d+)\. (.+)$")
CHARTS = {"4": "chart1", "5": "chart2", "6": "chart3", "7": "chart4", "11": "chart5"}
charts = json.load(open(sys.argv[3]))

out = []; i = 0; n = len(B)
mode = "pre"
while i < n:
    b = B[i]; t = txt(b.get("html"))
    nxt = lambda k: B[i + k] if i + k < n else None

    # Tabla de contenido del Word: se omite
    if is_p(b) and t == "Tabla de Contenido":
        i += 1
        while i < n and B[i]["type"] == "p" and "<a href=" in B[i]["html"]: i += 1
        continue

    if b["type"] == "heading":
        if t.startswith("Referencias"): mode = "refs"
        elif mode == "pre": mode = "body"
        h = dict(b, html=re.sub(r"\s*[-–]\s*", " – ", b["html"], count=1) if b["level"] == 1 else b["html"])
        if b["level"] == 1: h["breakBefore"] = True
        out.append(h); i += 1; continue

    # Figura/Tabla APA: rótulo, título, imagen o tabla, nota
    m = LABEL_APA.match(t) if is_p(b) else None
    if m:
        kind, num = m.group(1), m.group(2)
        title = txt(nxt(1)["html"]) if is_p(nxt(1)) else ""
        j = i + 2
        blk = {"id": b["id"], "label": f"{kind} {num}", "title": title}
        if kind == "Figura":
            blk["type"] = "figure"
            imgs = []
            while j < n and B[j]["type"] == "image": imgs.append(B[j]["src"]); j += 1
            blk["src"] = imgs[0] if imgs else None
            if len(imgs) > 1: blk["images"] = imgs
            if num in CHARTS: blk["chart"] = charts[CHARTS[num]]
        else:
            t2 = nxt(2)
            blk.update(type="table", head=t2["head"], rows=t2["rows"]); j += 1
        if j < n and is_p(B[j]) and txt(B[j]["html"]).startswith("Nota"):
            blk["note"] = B[j]["html"]; j += 1
        out.append(blk); i = j; continue

    # Figura de referente: imagen, «Figura Rn. título», nota (o sin imagen)
    if b["type"] == "image" and is_p(nxt(1)) and LABEL_REF.match(txt(nxt(1)["html"])):
        mm = LABEL_REF.match(txt(nxt(1)["html"]))
        blk = {"id": b["id"], "type": "figure", "label": f"Figura {mm.group(1)}", "title": mm.group(2), "src": b["src"]}
        j = i + 2
        if j < n and is_p(B[j]) and txt(B[j]["html"]).startswith("Nota"): blk["note"] = B[j]["html"]; j += 1
        out.append(blk); i = j; continue
    if is_p(b) and LABEL_REF.match(t):
        mm = LABEL_REF.match(t)
        blk = {"id": b["id"], "type": "figure", "label": f"Figura {mm.group(1)}", "title": mm.group(2), "src": None}
        j = i + 1
        if j < n and is_p(B[j]) and txt(B[j]["html"]).startswith("Nota"): blk["note"] = B[j]["html"]; j += 1
        out.append(blk); i = j; continue

    if b["type"] == "image":  # imagen suelta (p. ej. la que quedó pegada al título 2.1.1, duplicada de la Figura 2)
        if any(x.get("src") == b["src"] for x in B if x["type"] == "image" and x is not b):
            i += 1; continue
        out.append(b); i += 1; continue

    if is_p(b) and re.match(r"^\[Imagen pendiente|^<em>Captura de pantalla pendiente", t if t.startswith("[") else b["html"]):
        i += 1; continue
    if is_p(b):
        h = b["html"]
        if mode == "refs": out.append(dict(b, style="referencia")); i += 1; continue
        if re.match(r"^<em><strong>[A-F]\. ", h) and h.endswith("</strong></em>"):
            out.append({"id": b["id"], "type": "heading", "level": 5, "html": txt(h)}); i += 1; continue
        if mode == "pre":
            if re.fullmatch(r"<strong>[^<]+</strong>", h) and t in ("Nota de responsabilidad", "Nota de aceptación", "Agradecimientos", "Dedicatoria", "Resumen", "Abstract", "Nota de autor:"):
                out.append({"id": b["id"], "type": "heading", "level": 1, "html": t.rstrip(":"), "pre": True, "breakBefore": True}); i += 1; continue
            out.append(dict(b, style="centrado" if i < 18 else None)); i += 1; continue
    out.append(b); i += 1

# Portada y portadilla: saltos de página
for b in out:
    if b["id"] in ("b001", "b009"): b["breakBefore"] = True
    if b["id"] == "b001": b["style"] = "portada-titulo"
    if b["id"] == "b009": b["style"] = "portadilla-titulo"
    if b.get("style") is None: b.pop("style", None)

doc["blocks"] = out
doc["meta"] = {"titulo": "Sobre lo que no digo", "autor": "Shamuel Woodcock Salomón", "asesor": "Edward Mauricio Montenegro Córdoba",
               "institucion": "Universidad CESMAG", "programa": "Programa de Diseño Gráfico", "ciudad": "San Juan de Pasto", "anio": "2027"}
json.dump(doc, open(dst, "w"), ensure_ascii=False, indent=1)
from collections import Counter
print(len(out), Counter(x["type"] for x in out))
print([x["label"] for x in out if x["type"] in ("figure", "table")])
print([x["label"] for x in out if x["type"] == "figure" and not x["src"]])
