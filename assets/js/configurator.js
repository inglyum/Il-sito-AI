/* ============================================================
   INGLY CONFIGURATOR — Anteprima personalizzazione live
   Canvas-based. Zero dipendenze. Ispirato a Cuttle.xyz.

   Uso:
     window.INGLY_CFG.init('cfgCanvas', product, config)
     window.INGLY_CFG.getDataURL()  → immagine preview
   ============================================================ */
(function(){
'use strict';

/* ---- Forme prodotto disponibili ---- */
const SHAPES = {
  rect:    { label:'Rettangolo',  w:340, h:220, r:18  },
  square:  { label:'Quadrato',    w:260, h:260, r:14  },
  circle:  { label:'Cerchio',     w:260, h:260, r:130 },
  tag:     { label:'Portachiavi', w:160, h:260, r:14  },
  oval:    { label:'Ovale',       w:300, h:200, r:100 },
  shield:  { label:'Scudo',       w:240, h:270, r:0   },
  hexagon: { label:'Esagono',     w:260, h:260, r:0   },
  bookmark:{ label:'Segnalibro',  w:140, h:300, r:14  },
};

/* ---- Materiali: sfondo + colore incisione ---- */
const MATERIALS = {
  Legno: {
    name:'Legno',
    bg:'#c4965a', bg2:'#9b6f3b',
    engrave:'rgba(40,20,5,0.82)',
    uvColor:'#ffffff',
    grain: true,
    label:'Legno Naturale',
  },
  Noce: {
    name:'Noce',
    bg:'#7a5230', bg2:'#4e3318',
    engrave:'rgba(20,8,2,0.85)',
    uvColor:'#fffbe6',
    grain: true,
    label:'Noce Scuro',
  },
  Metallo: {
    name:'Metallo',
    bg:'#c0c0c0', bg2:'#888',
    engrave:'rgba(30,30,40,0.75)',
    uvColor:'#1a1aff',
    grain: false,
    label:'Acciaio Inox',
  },
  'Acciaio Brunito': {
    name:'Acciaio Brunito',
    bg:'#2c2c2c', bg2:'#111',
    engrave:'rgba(220,200,140,0.9)',
    uvColor:'#ffd700',
    grain: false,
    label:'Acciaio Brunito',
  },
  Plexiglass: {
    name:'Plexiglass',
    bg:'rgba(210,235,255,0.55)', bg2:'rgba(170,210,255,0.3)',
    engrave:'rgba(255,255,255,0.92)',
    uvColor:'#e040fb',
    grain: false,
    label:'Plexiglass Trasparente',
    glass: true,
  },
  'Plexiglass Nero': {
    name:'Plexiglass Nero',
    bg:'#111827', bg2:'#0a0f1a',
    engrave:'rgba(255,255,255,0.88)',
    uvColor:'#00e5ff',
    grain: false,
    label:'Plexiglass Nero',
    glass: false,
  },
  Pelle: {
    name:'Pelle',
    bg:'#8b5e3c', bg2:'#6b4226',
    engrave:'rgba(30,10,5,0.8)',
    uvColor:'#c0392b',
    grain: false,
    label:'Pelle Naturale',
  },
  Ardesia: {
    name:'Ardesia',
    bg:'#4a4f5e', bg2:'#2d3142',
    engrave:'rgba(240,240,255,0.85)',
    uvColor:'#fffde7',
    grain: false,
    label:'Ardesia',
  },
};

/* ---- Font disponibili ---- */
const FONTS = [
  { id:'serif',    label:'Serif Classico',  css:'Georgia, serif',                style:'normal' },
  { id:'sans',     label:'Sans Modern',     css:'"Inter", "Helvetica Neue", sans-serif', style:'normal' },
  { id:'display',  label:'Display Bold',    css:'"Exo 2", "Arial Black", sans-serif',  style:'normal' },
  { id:'script',   label:'Script Elegante', css:'"Caveat", cursive',             style:'normal' },
  { id:'mono',     label:'Monospace',       css:'"Courier New", monospace',      style:'normal' },
  { id:'thin',     label:'Thin Minimal',    css:'"Space Grotesk", sans-serif',   style:'normal' },
];

/* ---- Modalità incisione ---- */
const MODES = [
  { id:'laser',  label:'Laser CO₂/MOPA',  icon:'🔴' },
  { id:'uv',     label:'Stampa UV',        icon:'🟣' },
  { id:'cut',    label:'Taglio & Contorno',icon:'✂️'  },
];

/* ---- Stato configuratore ---- */
let CFG = {
  shape:   'rect',
  mat:     'Legno',
  line1:   'Il tuo testo',
  line2:   '',
  line3:   '',
  font:    'script',
  mode:    'laser',
  size:    52,
  align:   'center',
  logo:    null,      // DataURL immagine logo
  showBorder: true,
  showHole:   false,
};

let _canvas, _ctx, _raf, _onchange;

/* ---- INIT ---- */
function init(canvasId, product, opts){
  _canvas = document.getElementById(canvasId);
  if(!_canvas) return;
  _ctx = _canvas.getContext('2d');
  _onchange = opts && opts.onchange;

  // Pre-popola dal prodotto INGLY se passato
  if(product){
    if(MATERIALS[product.mat]) CFG.mat = product.mat;
  }
  if(opts){
    if(opts.shape && SHAPES[opts.shape])  CFG.shape = opts.shape;
    if(opts.mode  && MODES.find(m=>m.id===opts.mode)) CFG.mode = opts.mode;
  }

  _startLoop();
}

/* ---- LOOP DI RENDERING ---- */
function _startLoop(){
  let last = 0;
  function tick(ts){
    if(ts - last > 30){ // ~30fps
      _render();
      last = ts;
    }
    _raf = requestAnimationFrame(tick);
  }
  _raf = requestAnimationFrame(tick);
}

function stop(){ if(_raf) cancelAnimationFrame(_raf); }

/* ---- RENDER PRINCIPALE ---- */
function _render(){
  if(!_canvas||!_ctx) return;
  const W = _canvas.width, H = _canvas.height;
  const ctx = _ctx;
  ctx.clearRect(0,0,W,H);

  const sh  = SHAPES[CFG.shape]  || SHAPES.rect;
  const mat = MATERIALS[CFG.mat] || MATERIALS.Legno;

  // Scala per centrare la forma nel canvas
  const scaleX = (W * 0.80) / sh.w;
  const scaleY = (H * 0.80) / sh.h;
  const scale  = Math.min(scaleX, scaleY);
  const pw = sh.w * scale, ph = sh.h * scale;
  const ox = (W - pw) / 2, oy = (H - ph) / 2;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  // 1 — ombra prodotto
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur  = 28;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 8;
  _drawShape(ctx, sh, 0, 0, sh.w, sh.h, mat, true);
  ctx.restore();

  // 2 — corpo prodotto
  _drawShape(ctx, sh, 0, 0, sh.w, sh.h, mat, false);

  // 3 — texture materiale
  if(mat.grain) _drawGrain(ctx, sh.w, sh.h, mat);
  if(mat.glass) _drawGlass(ctx, sh.w, sh.h);

  // 4 — bordo foro (portachiavi, segnalibro)
  if(CFG.showHole || CFG.shape==='tag' || CFG.shape==='bookmark'){
    _drawHole(ctx, sh.w, mat);
  }

  // 5 — bordo decorativo
  if(CFG.showBorder) _drawBorder(ctx, sh, sh.w, sh.h, mat);

  // 6 — logo/immagine caricata
  if(CFG.logo && CFG._logoImg) _drawLogo(ctx, sh.w, sh.h);

  // 7 — testo personalizzato
  _drawText(ctx, sh.w, sh.h, mat);

  // 8 — badge modalità
  _drawModeBadge(ctx, sh.w, sh.h, mat);

  ctx.restore();

  // 9 — overlay info
  _drawOverlay(ctx, W, H);
}

/* ---- FORMA ---- */
function _drawShape(ctx, sh, x, y, w, h, mat, shadowOnly){
  const r = sh.r;
  const grad = ctx.createLinearGradient(x, y, x+w, y+h);
  grad.addColorStop(0, mat.bg);
  grad.addColorStop(1, mat.bg2||mat.bg);

  ctx.beginPath();
  if(sh === SHAPES.circle || sh === SHAPES.oval){
    ctx.ellipse(x+w/2, y+h/2, w/2, h/2, 0, 0, Math.PI*2);
  } else if(sh === SHAPES.shield){
    _shieldPath(ctx, x, y, w, h);
  } else if(sh === SHAPES.hexagon){
    _hexPath(ctx, x+w/2, y+h/2, Math.min(w,h)/2);
  } else {
    ctx.roundRect(x, y, w, h, r||0);
  }
  if(!shadowOnly){
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

function _shieldPath(ctx, x, y, w, h){
  ctx.moveTo(x + w/2, y);
  ctx.lineTo(x + w,   y + h*0.35);
  ctx.lineTo(x + w,   y + h*0.65);
  ctx.quadraticCurveTo(x+w, y+h, x+w/2, y+h);
  ctx.quadraticCurveTo(x,   y+h, x,     y+h*0.65);
  ctx.lineTo(x, y+h*0.35);
  ctx.closePath();
}

function _hexPath(ctx, cx, cy, r){
  for(let i=0;i<6;i++){
    const a = Math.PI/180*(60*i-30);
    i===0 ? ctx.moveTo(cx+r*Math.cos(a), cy+r*Math.sin(a))
           : ctx.lineTo(cx+r*Math.cos(a), cy+r*Math.sin(a));
  }
  ctx.closePath();
}

/* ---- TEXTURE LEGNO ---- */
function _drawGrain(ctx, w, h, mat){
  ctx.save();
  ctx.globalAlpha = 0.13;
  const spacing = 9;
  ctx.strokeStyle = mat.bg2 || '#7a5c38';
  ctx.lineWidth   = 0.8;
  for(let i=0; i<w; i+=spacing){
    ctx.beginPath();
    ctx.moveTo(i + Math.sin(i*0.15)*6, 0);
    ctx.bezierCurveTo(
      i + Math.sin(i*0.2+1)*5, h*0.3,
      i + Math.sin(i*0.18+2)*7, h*0.6,
      i + Math.sin(i*0.22+3)*5, h
    );
    ctx.stroke();
  }
  ctx.restore();
}

/* ---- EFFETTO VETRO PLEXIGLASS ---- */
function _drawGlass(ctx, w, h){
  ctx.save();
  const gl = ctx.createLinearGradient(0, 0, w*0.6, h*0.4);
  gl.addColorStop(0,   'rgba(255,255,255,0.22)');
  gl.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  gl.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/* ---- FORO PORTACHIAVI ---- */
function _drawHole(ctx, w, mat){
  const hx = w/2, hy = 18, hr = 10;
  ctx.save();
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI*2);
  ctx.fillStyle   = 'rgba(0,0,0,0.55)';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur  = 6;
  ctx.fill();
  // anello metallico
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(200,200,200,0.7)';
  ctx.lineWidth   = 2.5;
  ctx.stroke();
  ctx.restore();
}

/* ---- BORDO DECORATIVO ---- */
function _drawBorder(ctx, sh, w, h, mat){
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  const r = sh.r;
  if(sh === SHAPES.circle || sh === SHAPES.oval){
    ctx.ellipse(w/2, h/2, w/2-4, h/2-4, 0, 0, Math.PI*2);
  } else if(sh === SHAPES.shield){
    _shieldPath(ctx, 5, 5, w-10, h-10);
  } else if(sh === SHAPES.hexagon){
    _hexPath(ctx, w/2, h/2, Math.min(w,h)/2-5);
  } else {
    ctx.roundRect(5, 5, w-10, h-10, Math.max(0,(r||0)-5));
  }
  ctx.strokeStyle = mat.engrave;
  ctx.lineWidth   = 1.8;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.restore();
}

/* ---- TESTO INCISO ---- */
function _drawText(ctx, w, h, mat){
  const font  = FONTS.find(f=>f.id===CFG.font) || FONTS[0];
  const color = CFG.mode==='uv' ? mat.uvColor : mat.engrave;
  const lines = [CFG.line1, CFG.line2, CFG.line3].filter(Boolean);
  if(!lines.length) return;

  const baseSize = CFG.size;
  const lineH    = baseSize * 1.35;
  const totalH   = lines.length * lineH;
  const startY   = (h - totalH) / 2 + baseSize * 0.5
    + (CFG.showHole || CFG.shape==='tag' || CFG.shape==='bookmark' ? 14 : 0);

  ctx.save();
  if(CFG.mode === 'laser'){
    // Effetto incisione: leggero rientro visivo
    ctx.shadowColor  = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur   = 3;
    ctx.shadowOffsetX = 0.5;
    ctx.shadowOffsetY = 1;
  } else if(CFG.mode === 'uv'){
    // Effetto UV: glow colorato
    ctx.shadowColor = color;
    ctx.shadowBlur  = 8;
  } else {
    // Taglio: solo outline
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur  = 2;
  }

  lines.forEach((line, i) => {
    const sz = i === 0 ? baseSize : baseSize * 0.72;
    ctx.font      = `${CFG.mode==='laser'?'bold':''} ${sz}px ${font.css}`;
    ctx.fillStyle = color;
    ctx.textAlign = CFG.align;
    ctx.textBaseline = 'middle';
    const tx = CFG.align==='center' ? w/2 : CFG.align==='right' ? w-24 : 24;
    const ty = startY + i * lineH;

    // Ridimensiona se testo troppo largo
    const maxW = w * 0.82;
    const tw   = ctx.measureText(line).width;
    if(tw > maxW) ctx.scale(maxW/tw, 1);

    if(CFG.mode === 'cut'){
      // Solo contorno per il taglio
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.2;
      ctx.strokeText(line, tx, ty);
    } else {
      ctx.fillText(line, tx, ty);
    }
    if(tw > maxW) ctx.setTransform(1,0,0,1,0,0);
  });
  ctx.restore();
}

/* ---- LOGO/IMMAGINE ---- */
function _drawLogo(ctx, w, h){
  const img = CFG._logoImg;
  const maxW = w * 0.4, maxH = h * 0.35;
  const scale = Math.min(maxW/img.width, maxH/img.height);
  const iw = img.width*scale, ih = img.height*scale;
  const ix = (w - iw)/2, iy = 20;
  ctx.save();
  if(CFG.mode==='laser'){
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.72;
  } else {
    ctx.globalAlpha = 0.85;
  }
  ctx.drawImage(img, ix, iy, iw, ih);
  ctx.restore();
}

/* ---- BADGE MODALITÀ ---- */
function _drawModeBadge(ctx, w, h){
  const mode = MODES.find(m=>m.id===CFG.mode)||MODES[0];
  ctx.save();
  ctx.font      = 'bold 10px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(mode.icon+' '+mode.label, w-10, h-8);
  ctx.restore();
}

/* ---- OVERLAY INFORMATIVO ---- */
function _drawOverlay(ctx, W, H){
  const mat = MATERIALS[CFG.mat] || MATERIALS.Legno;
  ctx.save();
  ctx.font      = '11px "Space Grotesk", sans-serif';
  ctx.fillStyle = 'rgba(160,160,180,0.75)';
  ctx.textAlign = 'center';
  ctx.fillText(mat.label+' · Anteprima non vincolante', W/2, H-10);
  ctx.restore();
}

/* ---- API pubblica ---- */
function set(key, value){
  if(key==='logo'){
    if(!value){ CFG.logo=null; CFG._logoImg=null; _notify(); return; }
    const img = new Image();
    img.onload = () => { CFG._logoImg = img; _notify(); };
    img.src = value;
    CFG.logo = value;
    return;
  }
  CFG[key] = value;
  _notify();
}

function get(key){ return CFG[key]; }
function getAll(){ return Object.assign({}, CFG); }
function getDataURL(type){ return _canvas ? _canvas.toDataURL(type||'image/png') : null; }

function _notify(){ if(_onchange) _onchange(getAll()); }

/* ---- Export ---- */
window.INGLY_CFG = { init, stop, set, get, getAll, getDataURL, SHAPES, MATERIALS, FONTS, MODES };

})();
