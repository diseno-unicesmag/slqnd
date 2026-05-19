/* lluvia-ideas.js — Sobre lo que no digo */
const MAPS_DATA=[
{id:'arquitectura',title:'+ Arquitectura',image:'Recursos/Lluvia de Ideas/Lluvia de Ideas - Desarrollo.png',ideas:['Escenarios arquitectónicos 3D con RA como espacios narrativos del libro','Ilustraciones con alta carga conceptual en la arquitectura de los espacios','Obras arquitectónicas abstractas extraídas de las ilustraciones como escena RA','Plano arquitectónico del lugar donde transcurre la historia','Elementos de las ilustraciones aplicados a diseño de interior','Estructura inspirada en el libro e ilustraciones','Museo donde se exhiban los libros con experiencia personalizada','Espacio de exposición con mapping que genere RA por ilustración','Mural con Realidad Aumentada','Proyección del libro en un espacio, pared o lugar','Video mapping para presentar el libro a comunidades','Cada página del libro proyectada en un monumento diferente de la ciudad']},
{id:'musica',title:'+ Música',image:null,ideas:['Composición de paisajes sonoros subconscientes como capas inmersivas en la RA','Páginas diseñadas como partituras abstractas que reproducen auditivamente el vacío','El producto físico es la funda de un vinilo o casete, la RA revela el estado del artista','Letras de canciones ocultas entre los trazos, visibles y audibles mediante RA','Libro físico como caja de música interactiva modulada desde la pantalla en RA','Marcadores físicos adicionales que desatan monólogos internos','Narrativa sonora: sonidos caóticos iniciales que el usuario puede armonizar','La ilustración vibra o baila en RA al compás del ruido ambiental de la habitación','Separadores con patrones que activan diferentes pistas de audio','Colores mapeados a frecuencias de sonido (sinestesia) para "tocar" la ilustración','Álbum conceptual impreso donde la RA es el videoclip inmersivo de cada canción']},
{id:'escultura',title:'+ Escultura',image:null,ideas:['Art Toys coleccionables de resina como marcadores físicos de la carga emocional','Piezas de cerámica intervenidas con Kintsugi; la RA revela las historias de sus grietas','Objeto escultórico tridimensional (pop-up) con animaciones proyectadas en RA','Esculturas de máscaras en arcilla que se agrietan digitalmente mostrando la ilustración','Empaque escultórico rígido que debe manipularse físicamente para acceder al libro','Maqueta topográfica de la "mente"; la RA proyecta escenas sobre sus valles','Bloque moldeable para que el usuario esculpa su emoción y la RA le asigne una metáfora','Escultura monumental central; caminar alrededor revela páginas flotantes en RA','Cubiertas en alto relieve cuyas texturas interactúan con la iluminación digital','Esculturas cinéticas; la posición física altera el desenlace visual en RA','Fragmentos esparcidos para reunir; al juntarlos, la RA proyecta la escena completa']},
{id:'museos',title:'+ Museos',image:null,ideas:['Museo del Silencio: pedestales vacíos donde la RA revela la obra emocional','El libro es el catálogo del museo, cada página es una sala del subconsciente','Instalación interactiva con post-its anónimos transformados en galería virtual animada','Tickets de entrada al museo como marcadores RA con "tráilers" de la emoción','Escape Room emocional: pistas ocultas en ilustraciones esparcidas por el salón','Curaduría inversa: usuario restaura ilustraciones sin contexto aplicando el Kintsugi','Museo de Máscaras Sociales en papel que proyectan el verdadero rostro del agotamiento']},
{id:'videojuegos',title:'+ Videojuegos',image:null,ideas:['Mecánica Tamagotchi: sanar a una criatura en RA dando nombre a las emociones diarias','Sistema de Rachas (Duolingo): la racha transforma el entorno caótico en armónico','Kintsugi Puzzle: responder preguntas de introspección para ganar piezas doradas','Coleccionismo: interactuar en distintos momentos del día para desbloquear emociones','Puntos de Liberación: la máscara se agrieta con el uso, desbloqueando nuevos capítulos','Novela Visual: opciones de diálogo en RA alteran la animación de la página impresa','Minijuegos de respiración: seguir el ritmo de la animación RA proyectada sobre la página']}
];

const PALETTE=[
{bg:'rgba(245,197,66,.18)',border:'rgba(245,197,66,.45)',text:'#f5c542'},
{bg:'rgba(124,156,191,.18)',border:'rgba(124,156,191,.45)',text:'#7c9cbf'},
{bg:'rgba(122,173,138,.18)',border:'rgba(122,173,138,.45)',text:'#7aad8a'},
{bg:'rgba(167,139,250,.18)',border:'rgba(167,139,250,.45)',text:'#a78bfa'},
{bg:'rgba(244,114,182,.18)',border:'rgba(244,114,182,.45)',text:'#f472b6'},
{bg:'rgba(251,146,60,.18)',border:'rgba(251,146,60,.45)',text:'#fb923c'}
];

const DEFAULTS={
musica:{"0":"check","1":"check","2":"star","3":"check","4":"cross","5":"cross","6":"cross","7":"cross","8":"check","9":"cross","10":"star"},
escultura:{"0":"star","1":"check","2":"cross","3":"check","4":"cross","5":"cross","6":"cross","7":"cross","8":"check","9":"cross","10":"cross"},
museos:{"0":"star","1":"check","2":"cross","3":"check","4":"cross","5":"cross","6":"star"},
videojuegos:{"0":"cross","1":"check","2":"cross","3":"star","4":"check","5":"cross","6":"cross"}
};

function applyCardState(card,pal,state){
  card.querySelectorAll('.marker-btn').forEach(b=>b.classList.remove('active'));
  if(!state){
    card.classList.remove('has-state');
    card.style.background=pal.bg;
    card.style.border=`1px solid ${pal.border}`;
    card.style.color=pal.text;
    card.style.boxShadow='none';card.style.opacity='1';card.style.zIndex=2;
  } else {
    card.classList.add('has-state');
    const btn=card.querySelector('.marker-btn.'+state);
    if(btn)btn.classList.add('active');
    if(state==='star'){card.style.background='rgba(245,197,66,.18)';card.style.border='1.5px solid #f5c542';card.style.color='#f5c542';card.style.boxShadow='0 0 0 2px rgba(245,197,66,.2),0 4px 20px rgba(0,0,0,.4)';card.style.zIndex=10;card.style.opacity='1';}
    else if(state==='check'){card.style.background='rgba(16,185,129,.15)';card.style.border='1px solid rgba(16,185,129,.4)';card.style.color='#10b981';card.style.boxShadow='none';card.style.zIndex=8;card.style.opacity='1';}
    else if(state==='cross'){card.style.background='rgba(239,68,68,.1)';card.style.border='1px dashed rgba(239,68,68,.35)';card.style.color='#ef4444';card.style.boxShadow='none';card.style.zIndex=1;card.style.opacity='.55';}
  }
}

function makeDraggable(el,getState,onSave){
  let ox=0,oy=0,sx=0,sy=0,drag=false;
  el.addEventListener('mousedown',e=>{
    if(e.target.closest('.card-actions'))return;
    drag=true;sx=e.clientX;sy=e.clientY;
    ox=parseInt(el.style.left)||0;oy=parseInt(el.style.top)||0;
    el.style.transition='none';el.style.zIndex=20;e.preventDefault();
  });
  const mF=e=>{if(!drag)return;el.style.left=(ox+e.clientX-sx)+'px';el.style.top=(oy+e.clientY-sy)+'px';if(onSave.draw)onSave.draw();};
  const uF=()=>{if(!drag)return;drag=false;el.style.transition='';el.style.zIndex=getState()?10:2;onSave();};
  document.addEventListener('mousemove',mF);
  document.addEventListener('mouseup',uF);
}

function drawSvgLines(svgEl,cards,savedStates,boardEl){
  const W=boardEl.offsetWidth,H=boardEl.offsetHeight;
  svgEl.setAttribute('viewBox',`0 0 ${W} ${H}`);svgEl.innerHTML='';
  const cx=W/2,cy=H/2;
  cards.forEach((card,idx)=>{
    const el=card.el;
    const pos={x:(parseInt(el.style.left)||0)+el.offsetWidth/2,y:(parseInt(el.style.top)||0)+el.offsetHeight/2};
    const key=card.key!==undefined?card.key:idx;
    const state=savedStates[key];
    let color,opacity,width,dash;
    if(state==='star')      {color='#f5c542';opacity='.75';width='2';dash='';}
    else if(state==='check'){color='#10b981';opacity='.65';width='1.5';dash='';}
    else if(state==='cross'){color='#ef4444';opacity='.12';width='1';dash='2 4';}
    else                   {color='rgba(255,255,255,.25)';opacity='1';width='1';dash='4 8';}
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',cx);line.setAttribute('y1',cy);line.setAttribute('x2',pos.x);line.setAttribute('y2',pos.y);
    line.setAttribute('stroke',color);line.setAttribute('stroke-width',width);line.setAttribute('stroke-opacity',opacity);
    if(dash)line.setAttribute('stroke-dasharray',dash);
    svgEl.appendChild(line);
  });
}

class IdeaBoard{
  constructor(data,container){
    this.data=data;this.container=container;this.cards=[];
    this.stateKey='lluvia_states_'+data.id;this.posKey='lluvia_pos_'+data.id;
    if(data.id==='arquitectura'){
      const os=localStorage.getItem('lluvia_states');const op=localStorage.getItem('lluvia_positions_v2');
      if(os&&!localStorage.getItem(this.stateKey))localStorage.setItem(this.stateKey,os);
      if(op&&!localStorage.getItem(this.posKey))localStorage.setItem(this.posKey,op);
    }
    let st=JSON.parse(localStorage.getItem(this.stateKey))||{};
    if(data.id!=='arquitectura'){st=Object.assign({},st,DEFAULTS[data.id]);localStorage.setItem(this.stateKey,JSON.stringify(st));}
    this.savedStates=st;
    this.savedPos=JSON.parse(localStorage.getItem(this.posKey))||{};
    this.render();
  }
  save(){localStorage.setItem(this.stateKey,JSON.stringify(this.savedStates));localStorage.setItem(this.posKey,JSON.stringify(this.savedPos));}
  render(){
    const s=document.createElement('div');s.className='section';s.style.marginBottom='8px';s.style.paddingBottom='12px';
    const imgBtn=this.data.image?`<a class="btn btn-accent" href="${this.data.image}" download style="padding:5px 11px;font-size:11px;">↓ Imagen</a>`:'';
    s.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;"><h3 style="margin:0;font-size:20px;font-weight:700;color:var(--accent);font-family:var(--font-display);">${this.data.title}</h3><div class="flex gap-12">${imgBtn}<button class="btn btn-ghost clear-btn" style="padding:5px 11px;font-size:11px;">Limpiar</button></div></div><p class="tip-text" style="margin-bottom:12px;">Arrastra las tarjetas · ✖ inviable · ✔ buena idea · ★ prioritaria</p>`;
    const bw=document.createElement('div');bw.className='board-wrap';
    bw.innerHTML=`<svg class="lines"></svg><div class="center-pill"><h3>Prototipo editorial phygital</h3><span>${this.data.title}</span></div>`;
    if(this.data.image){
      const tb=document.createElement('button');
      tb.className='btn btn-ghost';tb.style.cssText='position:absolute;bottom:14px;right:14px;z-index:30;font-size:11px;padding:6px 12px;';
      tb.textContent='📷 Ver registro';
      const ov=document.createElement('div');
      ov.style.cssText='position:absolute;inset:0;z-index:25;display:none;background:var(--bg2);padding:14px 14px 60px;';
      ov.innerHTML=`<img src="${this.data.image}" style="width:100%;height:100%;object-fit:contain;border-radius:10px;">`;
      tb.onclick=()=>{const h=ov.style.display==='none';ov.style.display=h?'block':'none';tb.textContent=h?'📷 Ocultar':'📷 Ver registro';};
      bw.appendChild(tb);bw.appendChild(ov);
    }
    s.appendChild(bw);this.container.appendChild(s);
    this.boardEl=bw;this.svg=bw.querySelector('.lines');this.pill=bw.querySelector('.center-pill');
    s.querySelector('.clear-btn').onclick=()=>this.clear();
    setTimeout(()=>{this.posCenter();this.createCards();},50);
    window.addEventListener('resize',()=>{this.posCenter();this.draw();});
  }
  posCenter(){const W=this.boardEl.offsetWidth,H=this.boardEl.offsetHeight;this.pill.style.left=W/2+'px';this.pill.style.top=H/2+'px';}
  initPos(){
    const W=this.boardEl.offsetWidth||800,H=this.boardEl.offsetHeight||640,cx=W/2,cy=H/2,n=this.data.ideas.length,r=Math.min(W,H)*.38;
    return this.data.ideas.map((_,i)=>{const a=(i/n)*Math.PI*2-Math.PI/2;return{x:cx+Math.cos(a)*r-90,y:cy+Math.sin(a)*r-40};});
  }
  createCards(){
    const pos=this.initPos();
    this.data.ideas.forEach((text,i)=>{
      const pal=PALETTE[i%PALETTE.length];
      const card=document.createElement('div');card.className='idea-card';
      const p=this.savedPos[i]||pos[i];
      card.style.cssText=`left:${p.x}px;top:${p.y}px;background:${pal.bg};border:1px solid ${pal.border};color:${pal.text};`;
      card.innerHTML=`<p style="font-size:12px;line-height:1.45;margin:0;pointer-events:none;padding-right:6px;">${text}</p><div class="card-actions"><button class="marker-btn cross" data-action="cross">✖</button><button class="marker-btn check" data-action="check">✔</button><button class="marker-btn star" data-action="star">★</button></div>`;
      card.querySelectorAll('.marker-btn').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const a=btn.dataset.action;this.savedStates[i]=(this.savedStates[i]===a)?null:a;applyCardState(card,pal,this.savedStates[i]);this.save();this.draw();if(window.globalFilterBoard)window.globalFilterBoard.refresh();}));
      makeDraggable(card,()=>this.savedStates[i],Object.assign(()=>{this.savedPos[i]={x:parseInt(card.style.left),y:parseInt(card.style.top)};this.save();},{draw:()=>this.draw()}));
      this.boardEl.appendChild(card);this.cards.push({el:card,pal,key:i});
      if(this.savedStates[i])applyCardState(card,pal,this.savedStates[i]);
    });
    this.draw();
  }
  draw(){drawSvgLines(this.svg,this.cards,this.savedStates,this.boardEl);}
  clear(){
    this.savedStates={};this.savedPos={};this.save();
    const pos=this.initPos();
    this.cards.forEach((c,i)=>{applyCardState(c.el,c.pal,null);c.el.style.left=pos[i].x+'px';c.el.style.top=pos[i].y+'px';c.el.style.transition='top .3s,left .3s';setTimeout(()=>c.el.style.transition='',300);});
    this.draw();if(window.globalFilterBoard)window.globalFilterBoard.refresh();
  }
}

class FilterBoard{
  constructor(container){
    this.container=container;this.stateKey='lluvia_states_filtro';this.posKey='lluvia_pos_filtro';
    const DF={"musica_2":"check","musica_10":"star","escultura_0":"star","museos_0":"star","museos_6":"cross","videojuegos_3":"check"};
    let st=JSON.parse(localStorage.getItem(this.stateKey))||{};
    st=Object.assign({},st,DF);localStorage.setItem(this.stateKey,JSON.stringify(st));
    this.savedStates=st;this.savedPos=JSON.parse(localStorage.getItem(this.posKey))||{};
    this.cards=[];this.ideas=[];
    this.section=document.createElement('div');this.section.className='section';this.section.style.marginBottom='8px';this.section.style.paddingBottom='12px';
    this.container.appendChild(this.section);this.refresh();
  }
  save(){localStorage.setItem(this.stateKey,JSON.stringify(this.savedStates));localStorage.setItem(this.posKey,JSON.stringify(this.savedPos));}
  refresh(){
    const ni=[];
    MAPS_DATA.forEach(map=>{
      const st=JSON.parse(localStorage.getItem('lluvia_states_'+map.id))||{};
      map.ideas.forEach((text,i)=>{if(st[i]==='star')ni.push({id:map.id+'_'+i,text,mapTitle:map.title});});
    });
    this.ideas=ni;
    let changed=false;
    this.ideas.forEach(idea=>{if(!this.savedStates[idea.id]){this.savedStates[idea.id]='check';changed=true;}});
    if(changed)this.save();
    this.render();
  }
  render(){
    this.section.innerHTML='';
    if(this.ideas.length===0){this.section.innerHTML=`<div style="text-align:center;color:var(--muted);padding:60px 20px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);">⭐<p style="margin-top:10px;">No hay ideas marcadas como prioritarias (★) aún.</p></div>`;return;}
    const bw=document.createElement('div');bw.className='board-wrap';
    bw.innerHTML=`<svg class="lines"></svg><div class="center-pill"><h3>Taller Combinatorio</h3><span>Las finalistas</span></div>`;
    this.section.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><h3 style="margin:0;font-size:20px;font-weight:700;color:var(--accent);font-family:var(--font-display);">Matriz consolidada</h3><button class="btn btn-ghost clear-btn" style="padding:5px 11px;font-size:11px;">Limpiar filtro</button></div><p class="tip-text" style="margin-bottom:12px;">Las mejores ideas reunidas. Define las finalistas absolutas del taller.</p>`;
    this.section.appendChild(bw);
    this.boardEl=bw;this.svg=bw.querySelector('.lines');this.pill=bw.querySelector('.center-pill');
    this.section.querySelector('.clear-btn').onclick=()=>{this.savedStates={};this.savedPos={};this.save();this.render();};
    setTimeout(()=>{this.posCenter();this.createCards();},50);
    window.addEventListener('resize',()=>{if(!this.boardEl)return;this.posCenter();this.draw();});
  }
  posCenter(){const W=this.boardEl.offsetWidth,H=this.boardEl.offsetHeight;this.pill.style.left=W/2+'px';this.pill.style.top=H/2+'px';}
  initPos(){const W=this.boardEl.offsetWidth||800,H=this.boardEl.offsetHeight||640,cx=W/2,cy=H/2,n=this.ideas.length,r=Math.min(W,H)*.38;return this.ideas.map((_,i)=>{const a=(i/n)*Math.PI*2-Math.PI/2;return{x:cx+Math.cos(a)*r-90,y:cy+Math.sin(a)*r-40};});}
  createCards(){
    const pos=this.initPos();this.cards=[];
    this.ideas.forEach((ideaObj,i)=>{
      const pal=PALETTE[i%PALETTE.length];const card=document.createElement('div');card.className='idea-card';
      const p=this.savedPos[ideaObj.id]||pos[i];
      card.style.cssText=`left:${p.x}px;top:${p.y}px;background:${pal.bg};border:1px solid ${pal.border};color:${pal.text};`;
      card.innerHTML=`<p style="font-size:12px;line-height:1.45;margin:0 0 5px;pointer-events:none;padding-right:6px;">${ideaObj.text}</p><span style="font-size:10px;color:var(--accent);display:block;border-top:1px solid rgba(255,255,255,.08);padding-top:4px;font-weight:600;">${ideaObj.mapTitle}</span><div class="card-actions"><button class="marker-btn cross" data-action="cross">✖</button><button class="marker-btn check" data-action="check">✔</button><button class="marker-btn star" data-action="star">★</button></div>`;
      card.querySelectorAll('.marker-btn').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const a=btn.dataset.action;this.savedStates[ideaObj.id]=(this.savedStates[ideaObj.id]===a)?null:a;applyCardState(card,pal,this.savedStates[ideaObj.id]);this.save();this.draw();}));
      makeDraggable(card,()=>this.savedStates[ideaObj.id],Object.assign(()=>{this.savedPos[ideaObj.id]={x:parseInt(card.style.left),y:parseInt(card.style.top)};this.save();},{draw:()=>this.draw()}));
      this.boardEl.appendChild(card);this.cards.push({el:card,pal,key:ideaObj.id});
      if(this.savedStates[ideaObj.id])applyCardState(card,pal,this.savedStates[ideaObj.id]);
    });
    this.draw();
  }
  draw(){drawSvgLines(this.svg,this.cards,this.savedStates,this.boardEl);}
}

const container=document.getElementById('boards-container');
MAPS_DATA.forEach(data=>new IdeaBoard(data,container));
const filterContainer=document.getElementById('filter-board-container');
window.globalFilterBoard=new FilterBoard(filterContainer);
