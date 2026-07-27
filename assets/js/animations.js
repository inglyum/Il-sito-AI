/* ============ ANIMATIONS (modulo) ============
   Reveal, contatori, glow, magnetici, parallax, loader, particelle, tilt 3D.
   Tutto rispetta prefers-reduced-motion. */
import { L } from './utils.js';

let magnets=[];
export function refreshMagnets(){magnets=[...document.querySelectorAll('.magnetic')]}

function runCounters(el){el.querySelectorAll('.count').forEach(c=>{if(c.dataset.done)return;c.dataset.done=1;const to=+c.dataset.to,t0=performance.now();
  const tick=t=>{const k=Math.min(1,(t-t0)/1800),e2=1-Math.pow(1-k,4);c.textContent=Math.round(to*e2).toLocaleString(L==='it'?'it-IT':'en-US');if(k<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)})}

const io=('IntersectionObserver' in window)?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');runCounters(e.target)}}),{threshold:.12}):null;
export function observeAll(){
  /* 3.2 — ritardo progressivo fra elementi della stessa griglia: dà ritmo all'ingresso.
     Il ritardo si azzera per chi preferisce meno movimento (gestito in CSS). */
  const seen=new Map();
  /* Selettore ampio: qualunque elemento .reveal del documento viene osservato, ovunque si trovi.
     Con la lista ristretta di prima, una sezione fuori da .page e da <footer> (es. Sponsor)
     restava a opacity:0 PER SEMPRE — visibile nel DOM ma invisibile a schermo. */
  document.querySelectorAll('.reveal, .reveal-blur, .counter, .cta-band').forEach(el=>{
    /* salta solo ciò che sta in una pagina non attiva */
    const pg=el.closest('.page');
    if(pg && !pg.classList.contains('active')) return;
    const parent=el.parentElement||document.body;
    const i=(seen.get(parent)||0); seen.set(parent,i+1);
    if(i>0&&i<10) el.style.setProperty('--rd',(i*70)+'ms');
    io?io.observe(el):(el.classList.add('in'),runCounters(el));
  });
}

/* ===== GLOW CURSOR =====
   Orb luminoso che segue il cursore con lerp — NON nasconde il cursore nativo.
   Puramente decorativo, non interferisce con selezione testo o click.
   Attivo solo su desktop con hover. Rispetta prefers-reduced-motion. */
function initLaserCursor(){
  if(!window.matchMedia) return;
  if(matchMedia('(hover:none)').matches) return;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if(document.getElementById('glow-orb')) return;

  const orb=Object.assign(document.createElement('div'),{id:'glow-orb'});
  document.body.appendChild(orb);

  let tx=0,ty=0,cx=0,cy=0,visible=false,hovered=false;

  document.addEventListener('mousemove',e=>{
    tx=e.clientX;ty=e.clientY;
    if(!visible){orb.style.opacity='1';visible=true}
  },{passive:true});

  document.addEventListener('mouseleave',()=>{orb.style.opacity='0';visible=false});

  /* cambia colore su elementi interattivi */
  document.addEventListener('mouseover',e=>{
    if(e.target.closest('a,button,[data-action],.pcard,.bcard,.mcard,.dcard')){
      orb.classList.add('hot');hovered=true;
    }
  },{passive:true});
  document.addEventListener('mouseout',e=>{
    if(e.target.closest('a,button,[data-action],.pcard,.bcard,.mcard,.dcard')){
      orb.classList.remove('hot');hovered=false;
    }
  },{passive:true});

  /* lerp fluido — velocità diversa in base allo stato */
  (function loop(){
    const k=hovered?.11:.07;
    cx+=(tx-cx)*k;cy+=(ty-cy)*k;
    orb.style.transform=`translate(${cx}px,${cy}px)`;
    requestAnimationFrame(loop);
  })();
}

export function initAnimations(){
  initProductZoom();
  initLaserCursor();

  /* barra avanzamento */
  const prog=document.getElementById('progress');
  addEventListener('scroll',()=>{prog.style.width=(scrollY/(document.body.scrollHeight-innerHeight)*100)+'%'},{passive:true});

  /* cursor glow */
  const glow=document.getElementById('glow');let gx=0,gy=0,mx=0,my=0;
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
  (function loop(){if(!document.hidden){gx+=(mx-gx)*.12;gy+=(my-gy)*.12;glow.style.left=gx+'px';glow.style.top=gy+'px'}requestAnimationFrame(loop)})();

  /* bottoni magnetici: lista in cache + un solo lavoro per frame */
  let magPending=false,magX=0,magY=0;
  document.addEventListener('mousemove',e=>{
    magX=e.clientX;magY=e.clientY;
    if(magPending)return;magPending=true;
    requestAnimationFrame(()=>{magPending=false;
      for(const b of magnets){
        const r=b.getBoundingClientRect(),dx=magX-(r.left+r.width/2),dy=magY-(r.top+r.height/2);
        if(Math.abs(dx)<r.width&&Math.abs(dy)<r.height*1.6)b.style.transform=`translate(${dx*.18}px,${dy*.22}px)`;
        else b.style.transform='';
      }});
  },{passive:true});

  /* parallax card hero */
  if(window.matchMedia&&matchMedia('(hover:hover)').matches){
    const fcards=[...document.querySelectorAll('.fcard')];
    addEventListener('mousemove',e=>{
      const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;
      fcards.forEach((c,i)=>{const d=(i+1)*7;c.style.translate=`${x*d}px ${y*d}px`})
    },{passive:true})}

  /* loader */
  addEventListener('load',()=>setTimeout(()=>document.getElementById('loader').classList.add('off'),900));
  setTimeout(()=>document.getElementById('loader').classList.add('off'),3500);

  /* ===== PARTICELLE LASER AVANZATE =====
     Tre tipi: polvere blu, scintille arancio, fasci laser che seguono il cursore */
  (function(){
    const cv=document.getElementById('fx');if(!cv)return;
    let ctx=null;try{ctx=cv.getContext('2d')}catch(e){}if(!ctx)return;
    if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let W,H,dpr=Math.min(2,devicePixelRatio||1);
    const rs=()=>{W=cv.width=innerWidth*dpr;H=cv.height=innerHeight*dpr};rs();addEventListener('resize',rs,{passive:true});

    /* particelle dust + scintille */
    const N=60,pts=[];
    for(let i=0;i<N;i++) pts.push({
      x:Math.random(),y:Math.random(),
      vx:(Math.random()-.5)*.0002,
      r:Math.random()*1.8+.3,
      s:Math.random()*.00028+.00004,
      o:Math.random()*.55+.1,
      sp:Math.random()<.22,
      trail:[]
    });

    /* fasci laser: partono dal cursore */
    let mx=.5,my=.5;
    addEventListener('mousemove',e=>{mx=e.clientX/innerWidth;my=e.clientY/innerHeight},{passive:true});

    const beams=Array.from({length:3},(_,i)=>({
      angle:Math.PI/6+i*Math.PI/5,
      len:Math.random()*.4+.3,
      o:Math.random()*.18+.06,
      speed:(Math.random()-.5)*.004
    }));

    (function draw(){
      if(document.hidden){requestAnimationFrame(draw);return}
      ctx.clearRect(0,0,W,H);

      /* fasci laser dal cursore */
      for(const b of beams){
        b.angle+=b.speed;
        const ex=(mx+Math.cos(b.angle)*b.len)*W;
        const ey=(my+Math.sin(b.angle)*b.len)*H;
        const g=ctx.createLinearGradient(mx*W,my*H,ex,ey);
        g.addColorStop(0,`rgba(255,200,80,${b.o*1.8})`);
        g.addColorStop(.6,`rgba(255,120,40,${b.o})`);
        g.addColorStop(1,'rgba(255,80,20,0)');
        ctx.beginPath();
        ctx.strokeStyle=g;
        ctx.lineWidth=dpr*(b.o*8);
        ctx.moveTo(mx*W,my*H);ctx.lineTo(ex,ey);ctx.stroke();
        /* glow al punto di origine */
        const glow=ctx.createRadialGradient(mx*W,my*H,0,mx*W,my*H,30*dpr);
        glow.addColorStop(0,`rgba(255,200,80,${b.o*.9})`);
        glow.addColorStop(1,'rgba(255,200,80,0)');
        ctx.beginPath();ctx.fillStyle=glow;ctx.arc(mx*W,my*H,30*dpr,0,7);ctx.fill();
      }

      /* particelle */
      for(const p of pts){
        p.y-=p.s;p.x+=p.vx;
        if(p.y<-.02){p.y=1.02;p.x=Math.random();p.trail=[]}
        if(p.x<0)p.x=1;if(p.x>1)p.x=0;
        /* trail leggero sulle scintille */
        if(p.sp){
          p.trail.push([p.x*W,p.y*H]);
          if(p.trail.length>8)p.trail.shift();
          if(p.trail.length>1){
            ctx.beginPath();
            ctx.strokeStyle=`rgba(255,138,60,${p.o*.35})`;
            ctx.lineWidth=dpr*.8;
            ctx.moveTo(p.trail[0][0],p.trail[0][1]);
            for(let t=1;t<p.trail.length;t++) ctx.lineTo(p.trail[t][0],p.trail[t][1]);
            ctx.stroke();
          }
          ctx.fillStyle=`rgba(255,165,60,${p.o})`;
          ctx.fillRect(p.x*W-dpr,p.y*H-dpr,2.8*dpr,2.8*dpr);
        } else {
          ctx.beginPath();
          ctx.fillStyle=`rgba(110,155,235,${p.o})`;
          ctx.arc(p.x*W,p.y*H,p.r*dpr,0,7);
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    })();
  })();

  /* ===== GRADIENT MESH ANIMATO — sfondo che respira =====
     Blob colorati che si muovono lentamente: cambia con il tema stagionale */
  (function(){
    if(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    const heroBg=document.querySelector('.hero-bg');
    if(!heroBg)return;
    const blobs=heroBg.querySelectorAll('.blob');
    let t=0;
    (function loop(){
      t+=.003;
      blobs.forEach((b,i)=>{
        const x=50+Math.sin(t+i*2.1)*18;
        const y=50+Math.cos(t*1.3+i*1.7)*15;
        const scale=1+Math.sin(t*.7+i)*0.2;
        b.style.transform=`translate(${x-50}%,${y-50}%) scale(${scale.toFixed(3)})`;
      });
      requestAnimationFrame(loop);
    })();
  })();

  /* tilt 3D su card e moneta */
  (function(){
    if(!(window.matchMedia&&matchMedia('(hover:hover)').matches))return;
    let el=null;
    document.addEventListener('pointermove',e=>{
      const t=e.target.closest?e.target.closest('.pcard,.bcard,.dcard,.coin,.fcard,.mcard'):null;
      if(el&&el!==t){el.style.transform='';el=null}
      if(t){el=t;const r=t.getBoundingClientRect();
        const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        const k=t.classList.contains('coin')?16:9;
        t.style.transform=`perspective(900px) rotateY(${(x*k).toFixed(2)}deg) rotateX(${(-y*k).toFixed(2)}deg) translateY(-6px)`}},{passive:true});
    document.addEventListener('pointerleave',()=>{if(el){el.style.transform='';el=null}});
  })();
}

/* ============ ZOOM GALLERIA PRODOTTO ============
   Desktop: la foto segue il cursore ingrandita (effetto lente).
   Touch: un tocco ingrandisce al centro, un secondo tocco torna normale.
   L'elemento #ppArt è statico nel DOM: un solo aggancio basta per tutti i prodotti. */
function initProductZoom(){
  const box=document.getElementById('ppArt');
  if(!box) return;
  const hoverCapable = window.matchMedia && matchMedia('(hover:hover)').matches;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;

  const getImg=()=>box.querySelector('img.pimgph');

  if(hoverCapable){
    box.addEventListener('mousemove',e=>{
      const img=getImg(); if(!img)return;
      const r=box.getBoundingClientRect();
      const x=((e.clientX-r.left)/r.width*100).toFixed(1);
      const y=((e.clientY-r.top)/r.height*100).toFixed(1);
      img.style.transformOrigin=x+'% '+y+'%';
      img.style.transform='scale(1.7)';
      box.classList.add('zooming');
    });
    box.addEventListener('mouseleave',()=>{
      const img=getImg(); if(img)img.style.transform='';
      box.classList.remove('zooming');
    });
  } else {
    box.addEventListener('click',()=>{
      const img=getImg(); if(!img)return;
      const on=box.classList.toggle('zoomed');
      img.style.transformOrigin='50% 50%';
      img.style.transform=on?'scale(1.7)':'';
    });
  }
}
