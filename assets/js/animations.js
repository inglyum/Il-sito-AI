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
  document.querySelectorAll('.reveal, .counter, .cta-band').forEach(el=>{
    /* salta solo ciò che sta in una pagina non attiva */
    const pg=el.closest('.page');
    if(pg && !pg.classList.contains('active')) return;
    const parent=el.parentElement||document.body;
    const i=(seen.get(parent)||0); seen.set(parent,i+1);
    if(i>0&&i<10) el.style.setProperty('--rd',(i*70)+'ms');
    io?io.observe(el):(el.classList.add('in'),runCounters(el));
  });
}

export function initAnimations(){
  initProductZoom();

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

  /* particelle (polvere blu + scintille arancio) */
  (function(){
    const cv=document.getElementById('fx');if(!cv)return;
    let ctx=null;try{ctx=cv.getContext('2d')}catch(e){}if(!ctx)return;
    if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let W,H,dpr=Math.min(2,devicePixelRatio||1);
    const rs=()=>{W=cv.width=innerWidth*dpr;H=cv.height=innerHeight*dpr};rs();addEventListener('resize',rs);
    const N=46,pts=[];
    for(let i=0;i<N;i++)pts.push({x:Math.random(),y:Math.random(),r:Math.random()*1.6+.4,s:Math.random()*.00022+.00005,o:Math.random()*.5+.15,sp:Math.random()<.18});
    (function draw(){
      if(document.hidden){requestAnimationFrame(draw);return}
      ctx.clearRect(0,0,W,H);
      for(const p of pts){
        p.y-=p.s;if(p.y<-.02){p.y=1.02;p.x=Math.random()}
        ctx.beginPath();
        if(p.sp){ctx.fillStyle=`rgba(255,138,60,${p.o})`;ctx.fillRect(p.x*W,p.y*H,2.4*dpr,2.4*dpr);
          ctx.strokeStyle=`rgba(255,138,60,${p.o*.4})`;ctx.lineWidth=dpr*.7;ctx.moveTo(p.x*W,p.y*H);ctx.lineTo(p.x*W-9*dpr,p.y*H+9*dpr);ctx.stroke();}
        else{ctx.fillStyle=`rgba(120,160,235,${p.o})`;ctx.arc(p.x*W,p.y*H,p.r*dpr,0,7);ctx.fill()}
      }
      requestAnimationFrame(draw)})();
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
