import json, sys, os, re, shutil, html

src, media_root, out_dir = sys.argv[1:4]
d = json.load(open(src))
img_out = os.path.join(out_dir, "img")
os.makedirs(img_out, exist_ok=True)
images = []

def esc(s): return html.escape(s, quote=False)

def inl(xs, pulled):
    o = []
    for x in xs:
        t, c = x["t"], x.get("c")
        if t == "Str": o.append(esc(c))
        elif t in ("Space", "SoftBreak"): o.append(" ")
        elif t == "LineBreak": o.append("<br>")
        elif t == "Emph": o.append("<em>" + inl(c, pulled) + "</em>")
        elif t == "Strong": o.append("<strong>" + inl(c, pulled) + "</strong>")
        elif t == "Underline": o.append("<u>" + inl(c, pulled) + "</u>")
        elif t == "Superscript": o.append("<sup>" + inl(c, pulled) + "</sup>")
        elif t == "Subscript": o.append("<sub>" + inl(c, pulled) + "</sub>")
        elif t == "Quoted":
            q = "«»" if False else ('"', '"')
            o.append(q[0] + inl(c[1], pulled) + q[1])
        elif t == "Link": o.append('<a href="%s">%s</a>' % (esc(c[2][0]), inl(c[1], pulled)))
        elif t == "Image":
            p = c[2][0]; name = os.path.basename(p)
            shutil.copy(os.path.join(media_root, "..", p) if not os.path.exists(p) else p, os.path.join(img_out, name))
            pulled.append("img/" + name)
        elif t == "Span": o.append(inl(c[1], pulled))
        elif t == "Code": o.append("<code>" + esc(c[1]) + "</code>")
        elif t in ("Note",): pass
        elif t == "Cite": o.append(inl(c[1], pulled))
        elif t == "SmallCaps": o.append(inl(c, pulled))
        elif t == "Strikeout": o.append("<s>" + inl(c, pulled) + "</s>")
        else: o.append("")
    return "".join(o)

def cell_blocks(bs):
    pulled = []; parts = []
    for b in bs:
        if b["t"] in ("Para", "Plain"): parts.append(inl(b["c"], pulled))
        elif b["t"] == "BulletList":
            parts.append("<ul>" + "".join("<li>" + " ".join(inl(x["c"], pulled) for x in it if x["t"] in ("Para", "Plain")) + "</li>" for it in b["c"]) + "</ul>")
    return "<br>".join(parts), pulled

blocks = []; n = 0
def add(**k):
    global n; n += 1; k["id"] = "b%03d" % n; blocks.append(k)

for b in d["blocks"]:
    t, c = b["t"], b["c"]
    if t == "Header":
        pulled = []; txt = re.sub(r"\s+", " ", inl(c[2], pulled)).strip()
        add(type="heading", level=c[0], html=txt)
        for p in pulled: add(type="image", src=p)
    elif t == "Para":
        pulled = []; txt = inl(c, pulled).strip()
        if txt: add(type="p", html=txt)
        for p in pulled: add(type="image", src=p)
    elif t == "BlockQuote":
        pulled = []; txt = "<br>".join(inl(x["c"], pulled) for x in c if x["t"] in ("Para", "Plain"))
        add(type="quote", html=txt)
        for p in pulled: add(type="image", src=p)
    elif t == "BulletList":
        pulled = []; items = [" ".join(inl(x["c"], pulled) for x in it if x["t"] in ("Para", "Plain")) for it in c]
        add(type="list", items=items)
        for p in pulled: add(type="image", src=p)
    elif t == "Table":
        rows = []; pulled_all = []
        head, bodies = c[3], c[4]
        def rowcells(r):
            out = []
            for cell in r[1]:
                h, pl = cell_blocks(cell[4]); pulled_all.extend(pl); out.append(h)
            return out
        hrows = [rowcells(r) for r in head[1]]
        for body in bodies:
            for r in body[2] + body[3]: rows.append(rowcells(r))
        add(type="table", head=hrows, rows=rows, images=pulled_all)

json.dump({"title": "Sobre lo que no digo", "source": "Reescritura - V5.docx", "blocks": blocks},
          open(os.path.join(out_dir, "documento.json"), "w"), ensure_ascii=False, indent=1)
print(len(blocks), "bloques")
