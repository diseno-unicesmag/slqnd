from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import os
F={w:TTFont(f'herramientas/fuentes/Montserrat-{w}.ttf') for w in (900,600)}
def linea(txt, w, x0, base, size, track):
    f=F[w]; gs=f.getGlyphSet(); cmap=f.getBestCmap(); s=size/1000; x=x0; d=[]; xs=[]
    for ch in txt:
        gn=cmap[ord(ch)]; pen=SVGPathPen(gs)
        gs[gn].draw(TransformPen(pen,(s,0,0,-s,x,base)))
        d.append(pen.getCommands()); xs.append((x, x+gs[gn].width*s))
        x+=gs[gn].width*s+track*size
    return ' '.join(d), xs, x-track*size
def logo(fg, acento, barra, fondo=None, tagline=True, tag_color=None, borde=None):
    S=100; tr=-0.05
    d1,_,w1=linea('Sobre lo que',900,0,S*0.73,S,tr)
    dno,xno,_=linea('no',900,0,S*1.62,S,tr)
    nx1=xno[-1][1]
    ddigo,_,w2=linea(' digo',900,nx1+tr*S,S*1.62,S,tr)
    W=max(w1,w2)
    out=[]
    H=S*1.78+(S*0.38 if tagline else 0)
    pad=S*0.12
    if fondo: out.append(f'<rect x="{-pad}" y="{-pad}" width="{W+2*pad}" height="{H+2*pad}" fill="{fondo}"/>')
    out.append(f'<path d="{d1}" fill="{fg}"/>')
    out.append(f'<path d="{dno}" fill="{acento}"/>')
    out.append(f'<path d="{ddigo}" fill="{fg}"/>')
    # barra que silencia el «no»
    bh=S*0.11; by=S*1.62-S*0.27-bh/2
    out.append(f'<rect x="{-S*0.05:.1f}" y="{by:.1f}" width="{nx1+S*0.07:.1f}" height="{bh:.1f}" rx="{bh/2:.1f}" fill="{barra}"'+(f' stroke="{borde}" stroke-width="{S*0.035:.1f}" paint-order="stroke"' if borde else '')+'/>')
    if tagline:
        dt,_,wt=linea('ELABORACIÓN EMOCIONAL',600,S*0.03,S*2.02,S*0.16,0.32)
        out.append(f'<path d="{dt}" fill="{tag_color or fg}"/>')
    vb=f'{-pad:.1f} {-pad:.1f} {W+2*pad:.1f} {H+2*pad:.1f}'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">'+''.join(out)+'</svg>'
o='public/contenido/logo/'; os.makedirs(o,exist_ok=True)
V={'logo-negativo':dict(fg='#ffffff',acento='#f5c542',barra='#ffffff',tag_color='#ddd2fa'),
   'logo-negativo-fondo':dict(fg='#ffffff',acento='#f5c542',barra='#ffffff',fondo='#2b1759',tag_color='#ddd2fa'),
   'logo-positivo':dict(fg='#2b1759',acento='#7455c2',barra='#f5c542',tag_color='#7455c2'),
   'logo-una-tinta':dict(fg='#000000',acento='#000000',barra='#000000',borde='#ffffff'),
   'logo-sin-lema':dict(fg='#ffffff',acento='#f5c542',barra='#ffffff',tagline=False)}
for k,v in V.items(): open(o+k+'.svg','w').write(logo(**v))
print(os.listdir(o))
