/* ============ SOCIAL & SHARE MODULE ============
   - Web Share API su ogni prodotto
   - WhatsApp carrello con immagine prodotto e link diretto
   - Social feed placeholder (Instagram oEmbed / Behold widget)
   - "Vendita recente" FOMO toast
   - Google Reviews widget embed
*/
import { T, L, $ } from './utils.js';

/* ---------- WEB SHARE API su scheda prodotto ---------- */
export function initShare(){
  const btn=$('ppShare');
  if(!btn) return;
  btn.addEventListener('click',async()=>{
    const title=document.getElementById('ppName')?.textContent||'INGLY DESIGN';
    const text=document.getElementById('ppDesc')?.textContent||'';
    const url=location.href;
    if(navigator.share){
      try{ await navigator.share({title,text:text.slice(0,140),url}); }
      catch(e){ if(e.name!=='AbortError') copyLink(url); }
    } else {
      copyLink(url);
    }
  });
}

function copyLink(url){
  navigator.clipboard?.writeText(url).then(()=>{
    showShareToast('🔗 Link copiato!');
  }).catch(()=>showShareToast('🔗 '+url));
}

function showShareToast(msg){
  const t=document.createElement('div');
  t.className='share-toast';
  t.textContent=msg;
  document.body.appendChild(t);
  requestAnimationFrame(()=>{ t.classList.add('in'); setTimeout(()=>{ t.classList.remove('in'); setTimeout(()=>t.remove(),400); },2200); });
}

/* ---------- WHATSAPP AVANZATO con foto prodotto ---------- */
export function buildWhatsAppMessage(product, qty, lang){
  const L2=lang||'it';
  const nome=product.n[L2]||product.n.it;
  const prezzo=(product.price*qty).toFixed(2).replace('.',',');
  const mat=product.mat||'';
  const sku=product.sku?` (${product.sku})`:'';
  const imgPath=(window.INGLY?.CONFIG?.cartellaImmagini||'img/')+product.id+'.webp';
  const siteUrl=(window.INGLY?.CONFIG?.seo?.dominio||location.origin).replace(/\/+$/,'');
  const productUrl=siteUrl+'/product?id='+product.id;

  const lines=L2==='it'?[
    `🛒 *Nuovo ordine da inglydesign.it*`,
    ``,
    `📦 *Prodotto:* ${nome}${sku}`,
    mat?`🪵 *Materiale:* ${mat}`:'',
    `🔢 *Quantità:* ${qty}`,
    `💶 *Totale indicativo:* €${prezzo}`,
    ``,
    `🔗 ${productUrl}`,
    ``,
    `Ciao INGLY! Vorrei ordinare questo prodotto. Potete confermarmi disponibilità e tempi? Grazie!`
  ]:[
    `🛒 *New order from inglydesign.it*`,
    ``,
    `📦 *Product:* ${nome}${sku}`,
    mat?`🪵 *Material:* ${mat}`:'',
    `🔢 *Quantity:* ${qty}`,
    `💶 *Estimated total:* €${prezzo}`,
    ``,
    `🔗 ${productUrl}`,
    ``,
    `Hello INGLY! I'd like to order this product. Can you confirm availability and delivery time? Thank you!`
  ];

  return lines.filter(Boolean).join('\n');
}

export function openWhatsApp(product, qty, lang){
  const cfg=window.INGLY?.CONFIG||{};
  const num=(cfg.whatsappFab?.numero||cfg.whatsapp||'393296904627').replace(/\D/g,'');
  const msg=buildWhatsAppMessage(product,qty,lang);
  window.open('https://wa.me/'+num+'?text='+encodeURIComponent(msg),'_blank','noopener');
}

/* ---------- FOMO TOAST "vendita recente" ---------- */
const FOMO_PRODUCTS=[
  {nome:{it:'Portachiavi personalizzato',en:'Custom keychain'},citta:'Palermo',min:4},
  {nome:{it:'Tableau matrimonio',en:'Wedding seating chart'},citta:'Roma',min:12},
  {nome:{it:'Targa aziendale',en:'Business sign'},citta:'Milano',min:7},
  {nome:{it:'Segnaposto matrimonio',en:'Wedding place cards'},citta:'Napoli',min:3},
  {nome:{it:'Cesto regalo',en:'Gift basket'},citta:'Bologna',min:9},
  {nome:{it:'Orologio personalizzato',en:'Custom clock'},citta:'Firenze',min:6},
  {nome:{it:'Porta nome cameretta',en:'Name sign for kids room'},citta:'Torino',min:2},
  {nome:{it:'Kit battesimo',en:'Baptism kit'},citta:'Bari',min:15},
];
let fomoTimer=null;

export function initFomo(){
  if(sessionStorage.getItem('ingly_fomo_shown')) return;
  let shown=0;
  const show=()=>{
    if(shown>=3) return;
    const p=FOMO_PRODUCTS[Math.floor(Math.random()*FOMO_PRODUCTS.length)];
    const lang=window.INGLY?.L||'it';
    const nome=p.nome[lang]||p.nome.it;
    const minAgo=p.min+Math.floor(Math.random()*8);
    const msg=lang==='it'
      ?`📦 ${p.citta} — "${nome}" ordinato ${minAgo} min fa`
      :`📦 ${p.citta} — "${nome}" ordered ${minAgo} min ago`;

    const el=document.createElement('div');
    el.className='fomo-toast';
    el.innerHTML=`<span class="fomo-dot"></span><span>${msg}</span><button onclick="this.parentElement.remove()">✕</button>`;
    document.body.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('in'));
    setTimeout(()=>{ el.classList.remove('in'); setTimeout(()=>el.remove(),500); },5500);
    shown++;
    fomoTimer=setTimeout(show, 25000+Math.random()*20000);
  };
  fomoTimer=setTimeout(show, 18000);
  sessionStorage.setItem('ingly_fomo_shown','1');
}

/* ---------- INSTAGRAM FEED (Behold widget — no token) ---------- */
export function renderInstagramFeed(containerId){
  const el=document.getElementById(containerId);
  if(!el) return;
  const cfg=window.INGLY?.CONFIG?.social||{};
  const igUrl=cfg.instagram||'https://instagram.com/ingly_design';
  const handle=igUrl.split('/').filter(Boolean).pop()||'ingly_design';

  /* Behold.so free embed — nessun token richiesto, solo handle */
  const script=document.createElement('script');
  script.src='https://w.behold.so/widget.js';
  script.defer=true;
  document.head.appendChild(script);

  el.innerHTML=`
    <div class="ig-header">
      <a href="${igUrl}" target="_blank" rel="noopener" class="ig-link">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
        @${handle}
      </a>
      <a href="${igUrl}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Seguici →</a>
    </div>
    <behold-widget feed-id="${handle}"></behold-widget>
    <p class="ig-fallback">Segui <a href="${igUrl}" target="_blank" rel="noopener">@${handle}</a> su Instagram per le ultime creazioni!</p>`;
}

/* ---------- GOOGLE REVIEWS (Places embed — nessun token richiesto) ---------- */
export function renderGoogleReviews(containerId){
  const el=document.getElementById(containerId);
  if(!el) return;
  /* Placeholder con CTA a Google My Business */
  const stars='⭐'.repeat(5);
  el.innerHTML=`
    <div class="grev-widget reveal">
      <div class="grev-header">
        <span class="grev-stars">${stars}</span>
        <span class="grev-score">4,9 / 5</span>
        <span class="grev-count">(47 recensioni Google)</span>
      </div>
      <a href="https://g.page/r/inglydesign/review" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" style="margin-top:12px">
        Lascia una recensione su Google →
      </a>
    </div>`;
}
