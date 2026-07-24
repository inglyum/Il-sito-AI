/* ============ APP (entry module) ============
   Bootstrap: configurazione, lingua, render, delega eventi, avvio router. */
const { CONFIG, D, SOCIALS, TECH, MATERIALS, STEPS, REVIEWS, BIZ, FAQS, PORT } = window.INGLY;
import { $, T, L, setL, toast } from './utils.js';
import * as u from './utils.js';
import { initNav, show, go, goShop, toggleMenu, currentPage } from './navigation.js';
import { initAnimations, observeAll, refreshMagnets } from './animations.js';
import * as prod from './products.js';
import { renderUrg, initForms } from './forms.js';
import { initLazy } from './lazyload.js';
import { initSeo, updateSeo } from './seo.js';

/* ---- config → DOM ---- */
function initHeroVideo(){
  const url=(CONFIG.heroVideo||'').trim();
  const scene=document.querySelector('.coin-scene');
  if(!url || !scene) return;                 // nessun video configurato: hero invariata
  const reduce=window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const v=document.createElement('video');
  v.className='hero-video'; v.muted=true; v.playsInline=true; v.loop=true;
  v.setAttribute('aria-hidden','true');
  v.src=url;
  scene.parentNode.insertBefore(v, scene);
  scene.style.display='none';                // il video sostituisce la moneta 3D, non si sovrappone
  if(!reduce){ v.autoplay=true; try{ const p=v.play&&v.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
}

function applyConfig(){
  document.title = CONFIG.titolo;
  const md=document.querySelector('meta[name="description"]'); if(md) md.content=CONFIG.descrizione;
  const s=CONFIG.social, map=[s.instagram,s.facebook,s.tiktok,s.pinterest,s.whatsapp,s.etsy];
  map.forEach((u,i)=>{ if(u&&SOCIALS[i]) SOCIALS[i][1]=u });
  document.querySelectorAll('a[href^="https://instagram.com"]').forEach(a=>a.href=s.instagram);
  document.querySelectorAll('a[href^="https://wa.me"]').forEach(a=>a.href=CONFIG.whatsapp);
  document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{a.href='mailto:'+CONFIG.email;a.textContent=CONFIG.email});
  $('ftCopy').textContent=CONFIG.copyright;
  $('ftLegal').textContent=CONFIG.legale;
  const st=CONFIG.statistiche, hb=document.querySelectorAll('.hero-meta .hm b');
  if(hb.length===3){hb[0].textContent=st.pezzi.toLocaleString('it-IT')+'+';hb[1].textContent=st.materiali;hb[2].textContent=st.rating}
  document.querySelectorAll('#page-about .count').forEach((c,i)=>{const v=[st.pezzi,st.clienti,st.materiali,st.puntualita][i];if(v!=null)c.dataset.to=v});
}
function renderSocials(){['soc1','soc2','soc3'].forEach(id=>{const el=$(id);if(el)el.innerHTML=SOCIALS.map(s=>`<a href="${s[1]}" target="_blank" rel="noopener" aria-label="${s[0]}" title="${s[0]}">${s[2]}</a>`).join('')})}

/* ---- i18n ---- */
function applyI18n(){
  document.documentElement.lang=L;
  document.querySelectorAll('[data-i18n]').forEach(el=>{const v=D[L][el.dataset.i18n];if(v!==undefined)el.innerHTML=v});
  document.querySelectorAll('[data-ph]').forEach(el=>{const v=D[L][el.dataset.ph];if(v!==undefined)el.placeholder=v});
  $('heroH1').innerHTML=T('heroH1');
  $('langIT').classList.toggle('on',L==='it');
  $('langEN').classList.toggle('on',L==='en');
  prod.fillSort();
  const l=$('ldrTxt');if(l)l.textContent=T('ldr');
  const sb=$('sbBtn');if(sb)sb.firstChild.textContent=T('ppAdd')+' ';
}
function setLang(l){setL(l);applyI18n();renderAll();const pg=currentPage();updateSeo(pg,L,T,pg==='product'?prod.currentProduct():null)}

/* ---- contenuti statici ---- */
function renderTech(){const html=TECH.map(t=>`<div class="mcard ${t.lg?'m-lg':''} reveal"><span class="mtype">${t.icon?u.icon(t.icon,''):''}${t.t}</span><h3>${t.n}</h3><p>${t.d[L]}</p><div class="spec">${t.s.map(s=>`<i>${s}</i>`).join('')}</div></div>`).join('');
  $('techGrid').innerHTML=html;const g2=$('techGrid2');if(g2)g2.innerHTML=html}
function renderSteps(){$('stepsGrid').innerHTML=STEPS.map((s,i)=>`<div class="step reveal"><span class="n">0${i+1}</span><h3>${s[L][0]}</h3><p>${s[L][1]}</p></div>`).join('')}
function renderReviews(){
  $('revGrid').innerHTML=REVIEWS.map(r=>{
    const n=Math.max(1,Math.min(5,+r.st||5));
    const stelle='★'.repeat(n)+'<span class="off">'+'★'.repeat(5-n)+'</span>';
    const foto=(r.ph||[]).filter(Boolean);
    return `<div class="rcard reveal">
      <div class="stars" aria-label="${n} su 5">${stelle}</div>
      <p class="q">${r.q[L]}</p>
      ${foto.length?`<div class="rphotos">${foto.map(f=>
        `<button class="rph" data-action="rev-photo" data-arg="${f}" aria-label="Ingrandisci">
          <img src="${u.imgV(f)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></button>`).join('')}</div>`:''}
      <div class="who">
        <div class="av" style="background:${r.c}">${r.i}</div>
        <div><b>${r.w}${r.vf?` <span class="vfd" title="Cliente verificato">✔</span>`:''}</b>
        <span>${r.s[L]}${r.dt?` · ${r.dt}`:''}</span></div>
      </div></div>`}).join('')}
/* eventi della lightbox (zoom foto prodotto) */
/* 2.2 — suggerimenti di ricerca con tastiera */
function bindSuggest(){
  const q=document.getElementById('q'), box=document.getElementById('sugg');
  if(!q||!box) return;
  let items=[], cur=-1;
  const close=()=>{box.hidden=true;q.setAttribute('aria-expanded','false');cur=-1};
  const paint=()=>{
    if(!items.length) return close();
    box.innerHTML='<b>'+(u.T('suggT')||'Suggerimenti')+'</b>'+items.map((s,i)=>
      `<button role="option" data-i="${i}" class="${i===cur?'on':''}"><span>${s.label}</span><span class="k">${s.kind}</span></button>`).join('');
    box.hidden=false;q.setAttribute('aria-expanded','true');
    box.querySelectorAll('button').forEach(b=>b.addEventListener('mousedown',e=>{e.preventDefault();choose(+b.dataset.i)}));
  };
  const choose=i=>{
    const s=items[i]; if(!s) return;
    close();
    if(s.action==='open-product'){ location.hash='#/product?id='+s.arg; }
    else if(s.action==='go-shop'){ q.value=''; prod.togCat(s.arg); location.hash='#/shop'; }
    else if(s.action==='sugg-mat'){ q.value=''; prod.togMat(s.arg); location.hash='#/shop'; }
  };
  q.addEventListener('input',()=>{ items=prod.searchSuggest(q.value); cur=-1; paint() });
  q.addEventListener('keydown',e=>{
    if(box.hidden) return;
    if(e.key==='ArrowDown'){e.preventDefault();cur=Math.min(cur+1,items.length-1);paint()}
    else if(e.key==='ArrowUp'){e.preventDefault();cur=Math.max(cur-1,-1);paint()}
    else if(e.key==='Enter'&&cur>=0){e.preventDefault();choose(cur)}
    else if(e.key==='Escape'){close()}
  });
  q.addEventListener('blur',()=>setTimeout(close,120));
}
/* ===== Modalità chiara / scura ===== */
function bindMode(){
  const btn=document.getElementById('modeBtn'); if(!btn) return;
  const set=v=>{
    document.documentElement.setAttribute('data-mode',v);
    try{ localStorage.setItem('ingly_mode',v) }catch(e){}
    btn.setAttribute('aria-pressed', v==='light'?'true':'false');
    btn.title = v==='light' ? 'Passa al tema scuro' : 'Passa al tema chiaro';
  };
  set(document.documentElement.getAttribute('data-mode')||'dark');
  btn.addEventListener('click',()=>{
    document.documentElement.classList.add('theme-anim');
    set(document.documentElement.getAttribute('data-mode')==='light'?'dark':'light');
    setTimeout(()=>document.documentElement.classList.remove('theme-anim'),450);
  });
  /* se l'utente non ha mai scelto, segue le preferenze del sistema anche a sito aperto */
  try{
    matchMedia('(prefers-color-scheme: light)').addEventListener('change',e=>{
      if(!localStorage.getItem('ingly_mode')) set(e.matches?'light':'dark');
    });
  }catch(e){}
}
function bindLightbox(){
  const box=document.getElementById('lightbox'); if(!box) return;
  const main=document.getElementById('ppMain');
  if(main) main.addEventListener('click', e=>{
    if(e.target.closest('[data-action="pp-thumb"]')) return;
    const img=document.querySelector('#ppArt img');
    prod.openLightbox(img?img.getAttribute('src'):'');
  });
  /* clic su una miniatura → apre QUELLA foto nello zoom (non riparte dalla principale) */
  const thumbs=document.getElementById('ppThumbs');
  if(thumbs) thumbs.addEventListener('click', e=>{
    const th=e.target.closest('[data-action="pp-thumb"]');
    if(!th) return;
    e.stopPropagation();
    prod.ppThumb(th);               /* aggiorna la foto principale */
    prod.openLightbox(th.dataset.src);  /* e apre lo zoom proprio su quella */
  });
  document.addEventListener('click', e=>{
    const t=e.target.closest('[data-action="rev-photo"]');
    if(t) prod.openPhoto(t.dataset.arg);
    /* portfolio: se la tessera ha una scheda progetto la apre, altrimenti zoom */
    const g=e.target.closest('.gtile');
    if(g && !e.target.closest('.gtile-go')){
      const idx=+g.dataset.pi;
      if(!isNaN(idx) && prod.openProject(idx)) return;
      const img=g.querySelector('img');
      if(img){
        const all=(window.INGLY.PORT||[]).map(p=>p[3]).filter(Boolean);
        prod.openSeries(all.length?all:[img.getAttribute('src')], img.getAttribute('src'));
      }
    }
    /* foto dentro la scheda progetto → zoom */
    const pp=e.target.closest('[data-action="proj-photo"]');
    if(pp) prod.openPhoto(pp.dataset.arg);
    if(e.target.closest('[data-action="close-proj"]')) prod.closeProject();
  });
  const pjClose=document.getElementById('projClose');
  if(pjClose) pjClose.addEventListener('click', prod.closeProject);
  const pjBox=document.getElementById('projModal');
  if(pjBox) pjBox.addEventListener('click', e=>{ if(e.target===pjBox) prod.closeProject() });
  document.getElementById('lbxClose').addEventListener('click', prod.closeLightbox);
  document.getElementById('lbxPrev').addEventListener('click', e=>{e.stopPropagation();prod.lbxMove(-1)});
  document.getElementById('lbxNext').addEventListener('click', e=>{e.stopPropagation();prod.lbxMove(1)});
  box.addEventListener('click', e=>{ if(e.target===box) prod.closeLightbox() });
  document.addEventListener('keydown', e=>{
    if(box.hidden) return;
    if(e.key==='Escape'){ prod.closeLightbox(); prod.closeProject(); }
    if(e.key==='ArrowLeft') prod.lbxMove(-1);
    if(e.key==='ArrowRight') prod.lbxMove(1);
  });
}
/* 2.4 — fascia promozionale con finestra di date (stessa logica del calendario dei temi) */
function promoAttiva(){
  const p=(window.INGLY&&window.INGLY.PROMO)||null;
  if(!p||p.attivo===false||!(p.testo&&(p.testo.it||p.testo.en))) return null;
  if(p.dal&&p.al){
    const d=new Date();
    const md=String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const dentro = p.dal<=p.al ? (md>=p.dal&&md<=p.al) : (md>=p.dal||md<=p.al);
    if(!dentro) return null;
  }
  return p;
}
function renderPromo(){
  const bar=document.getElementById('promoBar'); if(!bar) return;
  const p=promoAttiva();
  if(!p||sessionStorage.getItem('ingly_promo_x')===(p.id||p.testo[L]||'1')){ bar.innerHTML=''; return }
  const cta=(p.cta&&p.cta[L])||'';
  bar.innerHTML=`<div class="promo" style="${p.colori?`--promo-a:${p.colori.split(',')[0]};--promo-b:${p.colori.split(',')[1]||p.colori.split(',')[0]}`:''}">
    <span>${p.testo[L]||p.testo.it}</span>
    ${cta&&p.link?`<a href="${p.link}">${cta}</a>`:''}
    <button class="promo-x" aria-label="Chiudi">✕</button></div>`;
  bar.querySelector('.promo-x').addEventListener('click',()=>{
    try{sessionStorage.setItem('ingly_promo_x',p.id||p.testo[L]||'1')}catch(e){}
    bar.innerHTML='';
  });
}
/* ===== Sponsor & Partner ===== */
const SP_ORDER={gold:0,silver:1,bronze:2,'':3};
function renderSponsors(){
  const sec=document.getElementById('sponsorSec'); if(!sec) return;
  const S=(window.INGLY&&window.INGLY.SPONSORS)||{};
  const list=(S.lista||[]).filter(x=>x&&x.nome&&x.attivo!==false);
  if(S.attivo===false||!list.length){ sec.hidden=true; return }
  sec.hidden=false;
  sec.classList.toggle('color', S.grigio!==true);   /* a colori salvo scelta contraria */
  document.getElementById('spTitle').textContent=(S.titolo&&S.titolo[L])||'';
  document.getElementById('spSub').textContent=(S.sottotitolo&&S.sottotitolo[L])||'';
  const ordered=[...list].sort((a,b)=>(SP_ORDER[a.livello||'']??3)-(SP_ORDER[b.livello||'']??3));
  document.getElementById('spGrid').innerHTML=ordered.map(s=>{
    const tier=s.livello||'';
    const inner=`${s.logo
        ? `<img class="sp-logo" src="${u.imgV(s.logo)}" alt="${(s.nome||'').replace(/"/g,'')}" loading="lazy" onerror="this.remove()">`
        : ''}
      <span class="sp-name">${s.nome}</span>
      ${s.desc&&s.desc[L]?`<span class="sp-desc">${s.desc[L]}</span>`:''}
      ${tier?`<span class="sp-tier ${tier}">${tier}</span>`:''}`;
    return s.link
      ? `<a class="sp-it ${tier}" href="${s.link}" target="_blank" rel="noopener sponsored">${inner}</a>`
      : `<div class="sp-it ${tier}">${inner}</div>`;
  }).join('');
  const cta=document.getElementById('spCta');
  cta.innerHTML=(S.cta&&S.cta[L])
    ? (S.ctaLink?`<a href="${S.ctaLink}">${S.cta[L]}</a>`:S.cta[L]) : '';
}
function renderWaFab(){
  const w=CONFIG.whatsappFab||{};
  const el=document.getElementById('waFab');if(!el)return;
  const num=String(w.numero||'').replace(/[^0-9]/g,'');
  const url=num?('https://wa.me/'+num+(w.messaggio?'?text='+encodeURIComponent(w.messaggio):'')):(CONFIG.whatsapp||'');
  if(w.attivo===false||!url){el.style.display='none';return}
  el.href=url;el.style.display='';
  const lbl=el.querySelector('.wa-lbl');if(lbl)lbl.textContent=(w.etichetta&&w.etichetta[L])||(L==='it'?'Scrivici su WhatsApp':'Chat on WhatsApp');
}
function renderAboutArt(){
  const box=document.querySelector('.about-art');if(!box)return;
  const am=CONFIG.aboutMedia||{};
  const v=(window.INGLY&&window.INGLY.__v)||0;
  if(am.tipo==='immagine'&&am.src){
    box.innerHTML=`<div class="about-media"><img src="${am.src}${am.src.includes('?')?'':'?v='+v}" alt="INGLY" loading="lazy"></div>`;
  }else if(am.tipo==='video'&&am.src){
    box.innerHTML=`<div class="about-media"><video src="${am.src}" autoplay muted loop playsinline aria-hidden="true"></video></div>`;
  } /* tipo 'logo' o vuoto: resta il logo animato già nel markup */
}
function renderBiz(){$('bizCards').innerHTML=BIZ.map((b,i)=>`<div class="rcard reveal" style="transition-delay:${i*.06}s"><div style="font-size:30px">${b[0]}</div><h3 style="margin:14px 0 8px;font-size:20px">${b[1][L]}</h3><p style="font-size:14.5px;color:var(--ink-soft)">${b[2][L]}</p></div>`).join('')}
function renderFaq(){$('faqList').innerHTML=FAQS.map(f=>`<details class="fitem reveal"><summary>${f[0][L]}<span class="pl" aria-hidden="true">+</span></summary><div class="fbody"><p>${f[1][L]}</p></div></details>`).join('')}
const MAT_ICON={Legno:'legno',Bamboo:'legno',MDF:'legno',Metallo:'metallo',Alluminio:'metallo',
  Plexiglass:'materiali',Acrilico:'materiali',Vetro:'materiali',Pelle:'materiali',PLA:'3d',Carta:'materiali',Tessuto:'dtf'};
function renderMat(){const g=$('matGrid');if(!g)return;g.innerHTML=MATERIALS.map(m=>`<div class="matcard reveal"><div class="sw2" style="background:linear-gradient(140deg,${m[2]})">${u.icon(MAT_ICON[m[0]]||'materiali','')}</div><b>${L==='it'?m[0]:m[1]}</b><span>${m[3][L]}</span></div>`).join('')}
/* Tessera portfolio: usa la FOTO se presente (g[3] = percorso immagine),
   altrimenti resta il segnaposto grafico. Gestibile dal pannello. */
const tile=(g)=>{
  const img=g[3], link=g[4];
  const idx=(window.INGLY.PORT||[]).indexOf(g);
  const hasProj=g[5]&&typeof g[5]==='object'&&Object.keys(g[5]).length>0;
  const inner=`<figure class="gtile${img?' gtile--photo':''}${hasProj?' gtile--proj':''}" data-pi="${idx}" style="background:linear-gradient(140deg,${g[2]})">`
    +(img?`<img src="${img+(img.includes("?")?"":"?v="+((window.INGLY&&window.INGLY.__v)||0))}" alt="${(g[1][L]||'').replace(/"/g,'')}" loading="lazy" class="gimg"${(window.INGLY.FOCAL&&window.INGLY.FOCAL[img])?` style="object-position:${window.INGLY.FOCAL[img]}"`:""}>`
        :`<div class="ph-badge" aria-hidden="true">${g[0]}</div>`)
    +`<figcaption class="lbl">${g[1][L]}${hasProj?' <span class="proj-hint">Vedi il progetto →</span>':''}</figcaption></figure>`;
  /* con link: la foto apre lo zoom, la freccia ↗ porta a Instagram (due azioni distinte) */
  return link
    ? `<div class="gtile-w">${inner}<a class="gtile-go" href="${link}" target="_blank" rel="noopener" aria-label="Apri su Instagram">↗</a></div>`
    : inner;
};
function renderPort(){
  /* velocità della striscia decisa dall'Admin (secondi per giro completo) */
  const sp=+(window.INGLY.GALSPEED)||96;
  document.documentElement.style.setProperty('--gal-speed',sp+'s');
  const conFoto=PORT.filter(p=>p[3]).length;
  $('gal1').innerHTML=[...PORT.slice(0,8),...PORT.slice(0,8)].map(tile).join('');
  $('gal2').innerHTML=[...PORT.slice(4),...PORT.slice(4)].map(tile).join('');
  /* se nessuna tessera ha foto, la striscia mostra i segnaposto: nascondi la seconda riga
     per non raddoppiare l'effetto "vuoto" */
  const g2=$('gal2'); if(g2) g2.style.display=conFoto?'':'none';
  $('portGrid').innerHTML=PORT.map(tile).join('')}

function renderAll(){prod.applyThemeAccent();renderPromo();renderSponsors();renderWaFab();renderAboutArt();prod.renderHero();prod.renderCats();prod.renderColl();prod.renderChips();prod.renderShop();prod.renderPP();prod.renderDigital();renderTech();renderSteps();renderReviews();renderBiz();renderFaq();renderMat();renderPort();renderUrg();prod.renderCart();observeAll();refreshMagnets()}

/* ---- delega eventi (niente handler inline) ---- */
const actions={
  'go':el=>go(el.dataset.arg),
  'go-shop':el=>goShop(el.dataset.arg),
  'open-product':el=>prod.openProduct(+el.dataset.id),
  'wish':(el,e)=>{e.stopPropagation();prod.toggleWish(+el.dataset.id,el)},
  'quick-add':(el,e)=>{e.stopPropagation();prod.addToCart(el.dataset.id)},
  'open-cart':()=>prod.openCart(),
  'close-cart':()=>prod.closeCart(),
  'menu-open':()=>toggleMenu(true),
  'menu-close':()=>toggleMenu(false),
  'lang':el=>setLang(el.dataset.l),
  'tog-cat':el=>prod.togCat(el.dataset.v),
  'tog-mat':el=>prod.togMat(el.dataset.v),
  'tog-sub':el=>prod.togSub(el.dataset.v),
  'reset-filters':()=>prod.resetFilters(),
  'pp-thumb':el=>prod.ppThumb(el),
  'pp-qty':el=>prod.qty(el.dataset.d),
  'pp-add':()=>prod.addFromPP(),
  'dig-add':el=>prod.addDigital(el.dataset.id),
  'cart-qty':el=>prod.cQty(el.dataset.i,el.dataset.d),
  'cart-rm':el=>prod.rmCart(el.dataset.i),
  'coll':el=>prod.setColl(el.dataset.coll,el),
  'pill':el=>{el.parentNode.querySelectorAll('.pill').forEach(x=>x.classList.remove('on'));el.classList.add('on')},
  'fake-upload':el=>{el.classList.toggle('done');el.textContent=el.classList.contains('done')?('✓ '+(el.dataset.done||'file')):el.dataset.t},
  'toast-soon':()=>toast(T('soon')),
  'checkout-wa':()=>prod.checkoutWhatsApp(),
  'search':()=>{go('shop');setTimeout(()=>$('q').focus(),400)},
  'quote-scroll':()=>{const q=document.querySelector('.quote-form');if(q)q.scrollIntoView({behavior:'smooth'})}
};
function initDelegation(){
  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-action]');if(!el)return;
    const fn=actions[el.dataset.action];if(fn){if(el.tagName==='A'&&el.getAttribute('href')==='#')e.preventDefault();fn(el,e)}
  });
}

/* ---- avvio ---- */
$('mq').innerHTML+=$('mq').innerHTML;
applyConfig();renderSocials();initHeroVideo();
initSeo();
initNav();initAnimations();initLazy();initForms();prod.initShopControls();initDelegation();
applyI18n();prod.readFiltersFromURL();renderAll();bindLightbox();bindSuggest();bindMode();
/* rete di sicurezza: nessuna sezione può restare invisibile per un errore di animazione */
setTimeout(()=>{
  const stuck=[...document.querySelectorAll('.reveal')].filter(el=>{
    const pg=el.closest('.page'); if(pg&&!pg.classList.contains('active')) return false;
    const r=el.getBoundingClientRect();
    return !el.classList.contains('in') && r.top < innerHeight && r.bottom > 0;
  });
  if(stuck.length){ document.documentElement.classList.add('reveal-failsafe');
    console.warn('[INGLY] '+stuck.length+' sezioni non rivelate: attivata la rete di sicurezza'); }
},3000);
show(currentPage());
