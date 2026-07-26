/* ============ WISHLIST + LOYALTY + PROMO POPUP ============
   Wishlist persistente (localStorage), link condivisibile, loyalty points,
   exit-intent popup configurabile dall'admin via content.json. */
import { $, T, eur, imgTag, toast, L } from './utils.js';
import { addToCart } from './products.js';
const { P, CONFIG } = window.INGLY;

/* ===== WISHLIST ===== */
let wish = new Set();
try { const w = localStorage.getItem('ingly_wish'); if (w) wish = new Set(JSON.parse(w)); } catch(e){}

function saveWish(){ try{ localStorage.setItem('ingly_wish', JSON.stringify([...wish])) }catch(e){} }

export function initWish(){
  updateBadge();
  /* parse ?wish= from URL share link */
  try{
    const sp = new URLSearchParams(location.search);
    const ids = sp.get('wish');
    if(ids){ ids.split(',').filter(Boolean).forEach(id=>wish.add(+id)); saveWish(); updateBadge(); }
  }catch(e){}
}

export function openWish(){
  const d = $('wishDrawer'); if(!d) return;
  d.hidden = false;
  d.classList.add('open');
  const ov = $('overlayWish'); if(ov) ov.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderWishDrawer();
}

export function closeWish(){
  const d = $('wishDrawer'); if(!d) return;
  d.classList.remove('open');
  const ov = $('overlayWish'); if(ov) ov.classList.remove('open');
  /* nasconde dopo la transizione */
  setTimeout(()=>{ d.hidden = true; document.body.style.overflow = ''; }, 560);
}

export function toggleWishItem(id, el){
  if(wish.has(id)) wish.delete(id); else wish.add(id);
  if(el) el.classList.toggle('on', wish.has(id));
  saveWish(); updateBadge();
  toast(wish.has(id) ? T('wAdd') : T('wRm'));
  /* aggiorna la wishlist se aperta */
  const d = $('wishDrawer');
  if(d && !d.hidden) renderWishDrawer();
}

function updateBadge(){
  const b = $('wishBadge'); if(!b) return;
  b.textContent = wish.size;
  b.classList.toggle('on', wish.size > 0);
}

function renderWishDrawer(){
  const items = [...wish].map(id => P.find(p => p.id === id)).filter(Boolean);
  const cnt = $('wishCount'); if(cnt) cnt.textContent = items.length ? `${items.length} ${L==='it'?'prodotti':'items'}` : '';
  const foot = $('wishFoot'); if(foot) foot.style.display = items.length ? '' : 'none';

  const pts = calcPoints();
  const ptsEl = $('wishPts');
  if(ptsEl) ptsEl.innerHTML = pts > 0 ? `<span>⭐ ${pts} punti fedeltà accumulati</span>` : '';

  if(!items.length){
    $('wishItems').innerHTML = `<div class="dr-empty"><b>❤</b><p>${L==='it'?'La tua wishlist è vuota':'Your wishlist is empty'}</p></div>`;
    return;
  }
  $('wishItems').innerHTML = items.map(p => `
    <div class="ditem wish-item">
      <div class="di-img">${imgTag(p)}</div>
      <div class="di-body">
        <div class="di-name">${p.n[L]}</div>
        <div class="di-price">${eur(p.price)}</div>
        <div class="di-actions">
          <button class="btn btn-primary" style="font-size:12px;padding:5px 12px" data-action="wish-add-cart" data-id="${p.id}">+🛒</button>
          <button class="di-rm" data-action="wish-rm" data-id="${p.id}" aria-label="Rimuovi">✕</button>
        </div>
      </div>
    </div>`).join('');
}

export function shareWish(){
  const ids = [...wish].join(',');
  if(!ids){ toast(L==='it'?'Wishlist vuota':'Empty wishlist'); return; }
  const url = location.origin + location.pathname + '?wish=' + ids + '#/shop';
  try{
    if(navigator.share){ navigator.share({ title:'La mia Wishlist INGLY', url }); return; }
    navigator.clipboard.writeText(url);
    toast(L==='it'?'Link copiato! 🔗':'Link copied! 🔗');
  }catch(e){ toast(url) }
}

export function wishToCart(){
  const items = [...wish].map(id => P.find(p => p.id === id)).filter(Boolean);
  items.forEach(p => addToCart(p.id));
  toast(L==='it'?`${items.length} prodotti aggiunti al carrello`:`${items.length} items added to cart`);
  closeWish();
}

/* ===== LOYALTY POINTS ===== */
const POINTS_KEY = 'ingly_points';
let pts = 0;
try{ pts = +(localStorage.getItem(POINTS_KEY)||0); }catch(e){}

export function calcPoints(){
  /* 1 punto ogni €1 speso (solo prodotti in wishlist come anteprima) */
  const wishItems = [...wish].map(id => P.find(p => p.id === id)).filter(Boolean);
  return Math.floor(wishItems.reduce((s,p) => s + p.price, 0));
}

export function addPoints(amount){
  pts += amount;
  try{ localStorage.setItem(POINTS_KEY, pts) }catch(e){}
  showLoyaltyToast(amount);
}

export function getPoints(){ return pts; }

function showLoyaltyToast(earned){
  const t = $('loyaltyToast'); if(!t) return;
  const title = $('loyaltyToastTitle'); const sub = $('loyaltyToastSub');
  if(title) title.textContent = `+${earned} punti fedeltà!`;
  if(sub) sub.textContent = `Totale: ${pts} punti`;
  t.hidden = false;
  setTimeout(()=>{ t.hidden = true; }, 3500);
}

/* ===== EXIT-INTENT PROMO POPUP ===== */
let popShown = false;

export function initPromoPopup(){
  /* Legge configurazione da content.json → POPUP (caricato dal data-loader) */
  const cfg = window.INGLY && window.INGLY.POPUP;
  /* Il popup si mostra SOLO se esplicitamente attivo:true e ha un titolo */
  if(!cfg || cfg.attivo !== true || (!cfg.titolo && !cfg.testo)) return;

  /* non mostrare se già visto nella sessione */
  const seenKey = 'ingly_pop_' + (cfg.id || 'default');
  if(sessionStorage.getItem(seenKey)) return;

  /* minimo 4 secondi di delay per non disturbare il primo caricamento */
  const delay = Math.max((cfg.delay || 8) * 1000, 4000);
  let fired = false;

  function showPop(){
    if(fired || popShown) return;
    fired = true; popShown = true;
    sessionStorage.setItem(seenKey, '1');
    renderPopup(cfg);
  }

  /* exit-intent: mouse lascia la finestra in alto */
  document.addEventListener('mouseleave', e=>{
    if(e.clientY < 40) showPop();
  }, { once: true });

  /* fallback timer */
  setTimeout(showPop, delay);

  /* scroll 60% */
  const onScroll = () => {
    if((window.scrollY + window.innerHeight) / document.body.scrollHeight > .6){ showPop(); window.removeEventListener('scroll', onScroll); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

function renderPopup(cfg){
  /* Crea il DOM dinamicamente — non dipende da HTML statici nell'index */
  const title = cfg.titolo && cfg.titolo[L] || '';
  const sub   = cfg.testo  && cfg.testo[L]  || '';
  const code  = cfg.codice || '';
  const cta   = cfg.cta    && cfg.cta[L]    || (L==='it'?'Continua':'OK');
  const emoji = cfg.emoji  || '🎁';

  /* rimuovi eventuale popup precedente */
  const old = document.getElementById('promoPopOv'); if(old) old.remove();

  const ov = document.createElement('div');
  ov.id = 'promoPopOv'; ov.className = 'promo-pop-ov';
  ov.innerHTML = `
    <div class="promo-pop" role="dialog" aria-modal="true">
      <button class="promo-pop-x" id="promoPopX" aria-label="Chiudi">✕</button>
      <div class="promo-pop-emoji">${emoji}</div>
      ${title?`<h2 class="promo-pop-title">${title}</h2>`:''}
      ${sub?`<p class="promo-pop-sub">${sub}</p>`:''}
      ${code?`<div class="promo-pop-code">Codice: <b class="pop-code">${code}</b> <button class="btn btn-ghost" style="font-size:11px;padding:3px 8px" id="popCopyBtn">Copia</button></div>`:''}
      <button class="btn btn-primary" id="promoPopCta" style="margin-top:8px">${cta}</button>
    </div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';

  ov.addEventListener('click', e=>{
    if(e.target===ov || e.target.id==='promoPopX' || e.target.id==='promoPopCta') closePromoPopup();
  });
  const copyBtn = document.getElementById('popCopyBtn');
  if(copyBtn) copyBtn.addEventListener('click', ()=>{ try{ navigator.clipboard.writeText(code); toast(L==='it'?'Codice copiato!':'Code copied!'); }catch(e){} });
}

export function closePromoPopup(){
  const ov = document.getElementById('promoPopOv');
  if(ov){ ov.style.opacity='0'; setTimeout(()=>ov.remove(),300); }
  document.body.style.overflow = '';
}
