/* ============ PRODUCTS (modulo) ============
   Catalogo, shop (filtri/ricerca/ordinamento), pagina prodotto con
   configuratore e prezzo live, digitale, carrello, wishlist. */
import { $, T, eur, imgTag, imgV, srcsetFor, focalOf, icon, toast, L } from './utils.js';
const { MAT_ART, MATN, CATS, P, DIG, CONFIG } = window.INGLY;
/* materiale sempre risolvibile: MAT_ART[mat] mancante faceva crollare l'intero sito */
const matArt = m => MAT_ART[m] || MAT_ART[Object.keys(MAT_ART)[0]] || { bg:'#3a2f26,#6b543e' };
import { go } from './navigation.js';

/* ---- stato ---- */
export const F={cat:new Set(),mat:new Set(),sub:new Set()};
const VIS = () => P.filter(x=>!x.hidden);   /* prodotti visibili sul sito */
let cart=[], wish=new Set(), cur=P[0], sel={qty:1}, collCur='best', SORT='rel', RV=[];

/* Luminanza del primo colore del gradiente → testo scuro su sfondi chiari.
   Risolve alla radice il problema dei titoli illeggibili (niente più flag manuali). */
export function isLightBg(bg){
  if(!bg) return false;
  const m=String(bg).match(/#([0-9a-f]{6})/i);
  if(!m) return false;
  const n=parseInt(m[1],16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  return (0.2126*r+0.7152*g+0.0722*b)/255 > 0.62;
}

/* ---- categorie (bento home) ---- */
function catCount(id){return VIS().filter(x=>x.cat===id).length}
/* ===== THEME ENGINE =====
   Sceglie il tema attivo: se la programmazione automatica è accesa vince il tema
   stagionale in finestra con priorità più alta, altrimenti quello selezionato a mano. */
export function activeTheme(){
  const TH=(window.INGLY&&window.INGLY.THEMES)||{};
  const list=Array.isArray(TH.temi)?TH.temi:[];
  if(!list.length) return null;
  if(TH.auto!==false){
    const d=new Date();
    const md=String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const inWin=(a,b)=>{ if(!a||!b) return false; return a<=b ? (md>=a&&md<=b) : (md>=a||md<=b); };
    const cand=list.filter(t=>t.stato==='attivo'&&inWin(t.dal,t.al))
                   .sort((x,y)=>(y.prio||0)-(x.prio||0));
    if(cand.length) return cand[0];
  }
  return list.find(t=>t.id===TH.attivo)||null;
}
export function applyThemeAccent(){
  const t=activeTheme();
  const root=document.documentElement;
  if(t&&Array.isArray(t.palette)&&t.palette[2]) root.style.setProperty('--theme-accent',t.palette[2]);
  if(t) root.setAttribute('data-theme',t.id); else root.removeAttribute('data-theme');
  /* 1.3 — lo stesso sfondo generato del tema anche su hero e fasce di sezione,
     a bassissima opacità: fa "cambiare stagione" a tutta la pagina, non solo alle 12 card. */
  if(t&&t.bg&&window.INGLY_ART){
    root.style.setProperty('--theme-bg',window.INGLY_ART.css(t.bg,t.palette,t.id+'-page'));
    root.classList.add('has-theme-bg');
  }else{
    root.style.removeProperty('--theme-bg');
    root.classList.remove('has-theme-bg');
  }
}
export function renderCats(){
  $('catBento').innerHTML=CATS.map(c=>{
    const light=isLightBg(c.bg);
    const dark=light?'color:#141830':'';
    const cnt=c.go?'':`<span class="cnt">${catCount(c.id)}</span>`;
    const act=c.go?`data-action="go" data-arg="${c.go}"`:`data-action="go-shop" data-arg="${c.id}"`;
    const th=activeTheme();
    const art=(th&&th.art&&th.art[c.id])||c.img;
    /* nessuna foto caricata ma il tema ha uno stile grafico → sfondo vettoriale generato */
    const gen=(!art&&th&&th.bg&&window.INGLY_ART)?window.INGLY_ART.css(th.bg,th.palette,th.id+'-'+c.id):'';
    const ph=art?`<img class="bimg" src="${imgV(art)}"${srcsetFor(art)}${focalOf(art)} alt="" loading="lazy" onerror="this.remove()">`:'';
    /* Lo sfondo generato viaggia in una VARIABILE CSS, non in background-image inline:
       scrivere altre proprietà su element.style riserializza l'attributo e farebbe
       sparire un data-URI lungo. La regola .bcard--gen lo applica dal CSS. */
    return `<div class="bcard ${c.big?'b-lg':''} ${c.w?'b-w':''} ${light&&!art&&!gen?'bcard--light':''} ${(art||gen)?'bcard--photo':''} ${gen?'bcard--gen':''} reveal" style="${gen?`--card-bg:${gen};`:(c.bg?'background:'+c.bg+';':'')}${(art||gen)?'':dark}" ${act} role="link" tabindex="0">
      ${ph}<span class="ic">${icon(c.icon, c.ic)}</span>${cnt}<h3>${c.n[L]}</h3><p style="${light&&!c.img?'color:#4a4f6b':''}">${c.s[L]}</p></div>`}).join('');
}

/* ---- card prodotto ---- */
function card(x){const a=matArt(x.mat);
  return `<article class="pcard reveal in" data-action="open-product" data-id="${x.id}">
    <div class="pimg" style="background:${a.bg}">
      ${x.tag?`<span class="ptag ${x.tag==='Limited'?'y':x.tag==='B2B'?'b':''}">${x.tag}</span>`:''}
      <button class="wish ${wish.has(x.id)?'on':''}" aria-label="Wishlist" data-action="wish" data-id="${x.id}"><svg viewBox="0 0 24 24"><path d="M19 14c1.5-1.5 2-3.2 2-5a5 5 0 0 0-9-3 5 5 0 0 0-9 3c0 1.8.5 3.5 2 5l7 7z"/></svg></button>
      <div class="art">${x.icon}</div>${imgTag(x)}
      <button class="qadd" data-action="quick-add" data-id="${x.id}">+ ${eur(x.price)}</button>
    </div>
    <div class="pbody"><span class="mat">${MATN[x.mat][L]} · ${CATS.find(c=>c.id===x.cat).n[L]}</span><h3>${x.n[L]}</h3>
    <div class="prow"><span class="price">${eur(x.price)}</span><span class="stars">★★★★★ <span>(${x.rev})</span></span></div></div></article>`}

export function toggleWish(id,el){wish.has(id)?wish.delete(id):wish.add(id);el.classList.toggle('on');
  const b=$('wishBadge');b.textContent=wish.size;b.classList.toggle('on',wish.size>0);
  toast(wish.has(id)?T('wAdd'):T('wRm'))}

export const currentProduct = () => cur;

/* ---- HERO: card evidenziate lette dal CATALOGO (nessun dato duplicato) ----
   Quali prodotti: CONFIG.heroFeatured = [id,id,id] (gestibile dall'admin).
   Se manca, usa i primi 3 prodotti marcati con hero:true, poi i primi 3 in evidenza. */
export function heroIds(){
  const cfg=(CONFIG.heroFeatured||[]).filter(id=>P.some(x=>x.id===+id)).map(Number);
  if(cfg.length) return cfg.slice(0,3);
  const flagged=VIS().filter(x=>x.hero).map(x=>x.id);
  if(flagged.length) return flagged.slice(0,3);
  return VIS().slice(0,3).map(x=>x.id);
}
export function renderHero(){
  heroIds().forEach((id,i)=>{
    const el=$('heroCard'+(i+1)); if(!el)return;
    const x=P.find(k=>k.id===id); if(!x){el.innerHTML='';return}
    const a=matArt(x.mat), c=CATS.find(k=>k.id===x.cat);
    const sub=MATN[x.mat][L]+(c&&c.sub[x.sub]?' · '+c.sub[x.sub][L]:'');
    el.dataset.action='open-product'; el.dataset.id=x.id;
    el.innerHTML=`<div class="ph" style="background:${a.bg}">
      <div style="position:absolute;inset:0;display:grid;place-items:center;font-size:46px">${x.icon}</div>${imgTag(x)}</div>
      <h4>${x.n[L]}</h4><p>${sub}</p><div class="pr">${T('from')} ${eur(x.price)}</div>`;
  });
}

/* ---- collezioni ---- */
export function renderColl(){$('collGrid').innerHTML=VIS().filter(x=>x.coll&&x.coll.includes(collCur)).slice(0,4).map(card).join('')}

/* ---- shop ---- */
const MATKEYS=Object.keys(MAT_ART).filter(k=>k!=='File');
const chip=(on,action,v,label,count)=>`<button class="chip ${on?'on':''} ${count===0?'chip--zero':''}" data-action="${action}" data-v="${v}">${label}${count!==undefined?` <i>${count}</i>`:''}</button>`;

/* Conteggio live: quanti risultati darebbe QUESTA opzione da sola,
   mantenendo invariati ricerca, prezzo e le altre dimensioni di filtro.
   Non un numero statico per categoria: si aggiorna con ogni ricerca/filtro. */
function matchesFacets(x, overrides){
  const q=$('q').value.trim().toLowerCase(), max=+$('pRange').value;
  const c=CATS.find(k=>k.id===x.cat), sub=c.sub[x.sub];
  const hay=(x.n.it+' '+x.n.en+' '+c.n.it+' '+c.n.en+' '+MATN[x.mat].it+' '+MATN[x.mat].en+(sub?' '+sub.it+' '+sub.en:'')).toLowerCase();
  if(q && !hay.includes(q)) return false;
  if(x.price>max) return false;
  const catSet=overrides.cat||F.cat, matSet=overrides.mat||F.mat, subSet=overrides.sub||F.sub;
  if(catSet.size && !catSet.has(x.cat)) return false;
  if(matSet.size && !matSet.has(x.mat)) return false;
  if(subSet.size && !subSet.has(x.sub)) return false;
  return true;
}
function countFor(dim, value){
  const ov={}; ov[dim]=new Set([value]);
  return VIS().filter(x=>matchesFacets(x,ov)).length;
}

export function renderChips(){
  $('fCat').innerHTML=CATS.filter(c=>!c.go).map(c=>chip(F.cat.has(c.id),'tog-cat',c.id,c.ic+' '+c.n[L],countFor('cat',c.id))).join('');
  $('fMat').innerHTML=MATKEYS.map(m=>chip(F.mat.has(m),'tog-mat',m,MATN[m][L],countFor('mat',m))).join('');
  const sw=$('subWrap');
  if(F.cat.size===1){const c=CATS.find(x=>x.id===[...F.cat][0]);
    if(c.sub.length){sw.classList.add('show');$('fSub').innerHTML=c.sub.map((s,i)=>chip(F.sub.has(i),'tog-sub',i,s[L],countFor('sub',i))).join('')}
    else sw.classList.remove('show');
  } else {sw.classList.remove('show');F.sub.clear()}
}
export function togCat(id){F.cat.has(id)?F.cat.delete(id):F.cat.add(id);F.sub.clear();renderChips();renderShop()}
export function togMat(m){F.mat.has(m)?F.mat.delete(m):F.mat.add(m);renderChips();renderShop()}
export function togSub(i){i=+i;F.sub.has(i)?F.sub.delete(i):F.sub.add(i);renderChips();renderShop()}
export function resetFilters(){F.cat.clear();F.mat.clear();F.sub.clear();$('q').value='';$('pRange').value=120;$('pv').textContent='€120';renderChips();renderShop()}
function filterProducts(){
  const q=$('q').value.trim().toLowerCase(),max=+$('pRange').value;
  return VIS().filter(x=>{
    const c=CATS.find(k=>k.id===x.cat), sub=c.sub[x.sub];
    const hay=(x.n.it+' '+x.n.en+' '+c.n.it+' '+c.n.en+' '+MATN[x.mat].it+' '+MATN[x.mat].en+(sub?' '+sub.it+' '+sub.en:'')).toLowerCase();
    return (!q||hay.includes(q))&&(F.cat.size===0||F.cat.has(x.cat))&&(F.mat.size===0||F.mat.has(x.mat))&&(F.sub.size===0||F.sub.has(x.sub))&&x.price<=max});
}
export function renderShop(){
  const res=filterProducts();
  if(SORT==='pa')res.sort((a,b)=>a.price-b.price);
  if(SORT==='pd')res.sort((a,b)=>b.price-a.price);
  if(SORT==='rv')res.sort((a,b)=>b.rev-a.rev);
  if(SORT==='nw')res.sort((a,b)=>b.id-a.id);   /* novità: gli ID più alti sono i più recenti */
  syncFiltersToURL();
  $('resN').textContent=res.length;
  $('shopGrid').innerHTML=res.length?res.map(card).join(''):`<div class="empty">
    <div class="empty-ill"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5"/><path d="M19 19l-4.3-4.3"/><path d="M7.5 10h5" opacity=".5"/></svg></div>
    <b>${T('empT')}</b>${T('empS')}</div>`;
  renderRV();
}
export function setSort(v){SORT=v;renderShop()}
export function fillSort(){const s=$('sortSel');if(!s)return;
  s.innerHTML=[['rel','sortRel'],['nw','sortNw'],['pa','sortPa'],['pd','sortPd'],['rv','sortRv']].map(o=>`<option value="${o[0]}" ${SORT===o[0]?'selected':''}>${T(o[1])}</option>`).join('')}
export function renderRV(){const w=$('rvWrap');if(!w)return;
  const items=RV.map(id=>P.find(x=>x.id===id)).filter(Boolean);
  w.classList.toggle('show',items.length>0);
  $('rvStrip').innerHTML=items.map(x=>`<div class="rv-it" data-action="open-product" data-id="${x.id}"><div class="ri" style="background:${matArt(x.mat).bg}">${x.icon}</div><div><b>${x.n[L]}</b><span>${eur(x.price)}</span></div></div>`).join('')}

/* ---- pagina prodotto / configuratore ---- */
export function openProduct(id){RV=[id,...RV.filter(x=>x!==id)].slice(0,8);
  cur=P.find(x=>x.id===id)||P[0];sel={qty:1};
  renderPP();go('product')}
export function renderPP(){
  const a=matArt(cur.mat), c=CATS.find(k=>k.id===cur.cat);
  $('crumbName').textContent=cur.n[L];
  $('ppCat').textContent=c.ic+' '+c.n[L]+(c.sub[cur.sub]?' · '+c.sub[cur.sub][L]:'');
  $('ppName').textContent=cur.n[L];
  $('ppStars').innerHTML=`★★★★★ <span>(${cur.rev} ${T('revs')})</span>`;
  $('ppProd').textContent=cur.prod+' '+T('days');
  $('ppMat').textContent=MATN[cur.mat][L];
  $('ppMain').style.background=a.bg;
  $('ppArt').innerHTML=cur.icon+imgTag(cur)
    +`<span class="pp-zoomhint">🔍 ${T('zoomHint')||'Clicca per ingrandire'}</span>`;
  /* Galleria: miniature solo se il prodotto ha più foto */
  const shots=galleryOf(cur), tw=$('ppThumbs');
  tw.style.display=shots.length>1?'':'none';
  tw.innerHTML=shots.length>1?shots.map((src,i)=>`<div class="thumb ${i===0?'on':''}" style="background:${a.bg}" data-action="pp-thumb" data-src="${src}" role="button" tabindex="0"><img src="${src}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"></div>`).join(''):'';
  $('ppQty').textContent=sel.qty;
  $('ppDesc').textContent=(cur.desc&&cur.desc[L])||T('descDefault');
  /* 🎬 video del prodotto (facoltativo) */
  $('ppVideo').innerHTML=cur.video?`<video src="${cur.video}" controls preload="none" playsinline ${cur.poster?`poster="${imgV(cur.poster)}"`:''}></video>`:'';
  /* 📐 tabella misure (facoltativa): [[etichetta, valore], …] */
  $('ppSizes').innerHTML=(Array.isArray(cur.misure)&&cur.misure.length)
    ? `<table class="sz-tab"><caption>${T('szH')||'Misure e dettagli'}</caption><tbody>`
      + cur.misure.map(r=>`<tr><th scope="row">${r[0]}</th><td>${r[1]}</td></tr>`).join('')
      + `</tbody></table>` : '';
  $('ppEmbed').innerHTML=cur.embed?`<h5 style="font-family:var(--fd);font-style:italic;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-soft);margin:18px 0 10px">${T('embedH')}</h5><iframe src="${cur.embed}" loading="lazy" title="Configuratore" style="width:100%;height:440px;border:1px solid var(--line);border-radius:20px;background:#fff"></iframe>`:'';
  renderDisc();price();
  /* 🔗 correlati: prima quelli scelti a mano dall'Admin, poi riempimento automatico */
  const manual=(cur.rel||[]).map(id=>P.find(x=>x.id===id)).filter(Boolean);
  const auto=VIS().filter(x=>x.id!==cur.id&&!manual.some(m=>m.id===x.id)&&(x.cat===cur.cat||x.mat===cur.mat));
  $('relGrid').innerHTML=[...manual,...auto].slice(0,4).map(card).join('');
}
export function galleryOf(x){
  const main=x.img||(CONFIG.cartellaImmagini+x.id+'.webp');
  return [main,...(x.gallery||[])].map(imgV);
}
export function ppThumb(el){
  el.parentNode.querySelectorAll('.thumb').forEach(x=>x.classList.remove('on'));
  el.classList.add('on');
  const src=el.dataset.src; if(!src)return;
  const art=$('ppArt'), img=art.querySelector('img.pimgph');
  if(img) img.src=src; else art.insertAdjacentHTML('beforeend',`<img class="pimgph" src="${src}" alt="" loading="lazy">`);
}
export function qty(d){sel.qty=Math.max(1,sel.qty+ +d);$('ppQty').textContent=sel.qty;renderDisc();price()}
const unit=()=>cur.price;
const disc=q=>q>=50?.85:q>=20?.9:q>=10?.95:1;
function price(){const u=unit(),d=disc(sel.qty);
  $('ppPrice').textContent=eur(u*d);
  $('ppUnit').textContent=d<1?T('bulk')+' −'+Math.round((1-d)*100)+'%':T('perPiece');
  $('ppTotal').textContent=eur(u*sel.qty*d);
  const sb=$('sbPrice');if(sb){sb.textContent=eur(u*sel.qty*d);$('sbName').textContent=cur.n[L]}}
function renderDisc(){const u=unit(),rows=[[1,9,1],[10,19,.95],[20,49,.9],[50,'∞',.85]];
  $('discTable').innerHTML=`<div class="row hd"><span>${T('dQty')}</span><span>${T('dDisc')}</span><span>${T('dUnit')}</span></div>`+rows.map(r=>{const hit=sel.qty>=r[0]&&(r[1]==='∞'||sel.qty<=r[1]);return `<div class="row ${hit?'hit':''}"><span>${r[0]}${r[1]==='∞'?'+':'–'+r[1]}</span><span>${r[2]===1?'—':'−'+Math.round((1-r[2])*100)+'%'}</span><span><b>${eur(u*r[2])}</b></span></div>`}).join('')}
export function addFromPP(){addToCart(cur.id,sel.qty,MATN[cur.mat][L],'',unit()*disc(sel.qty))}

/* ---- digitale ---- */
export function renderDigital(){$('digGrid').innerHTML=DIG.map(d=>`<div class="dcard reveal in">
  <div style="height:110px;border-radius:14px;background:${MAT_ART.File.bg};display:grid;place-items:center;font-size:42px">${d.icon}</div>
  <h3 style="font-size:17px;margin-top:14px">${d.n[L]}</h3>
  <div class="fmt">${d.f.map(f=>`<i>${f}</i>`).join('')}</div>
  <span class="lic">${T('lic')}</span>
  <div class="dl"><span class="price">${eur(d.price)}</span><button class="btn btn-blue" style="padding:10px 20px;font-size:13.5px" data-action="dig-add" data-id="${d.id}">⬇ ${T('buy')}</button></div></div>`).join('')}
export function addDigital(id){const d=DIG.find(x=>x.id===+id);cart.push({dig:d,q:1,u:d.price});renderCart();toast(T('added'));openCart()}

/* ---- carrello ---- */
export function addToCart(id,q=1,mat,txt,u){const x=P.find(k=>k.id===+id);cart.push({p:x,q,mat:mat||MATN[x.mat][L],txt:txt||'',u:u??x.price});renderCart();toast(T('added'));openCart()}
export function rmCart(i){cart.splice(+i,1);renderCart()}
export function cQty(i,d){i=+i;cart[i].q=Math.max(1,cart[i].q+ +d);renderCart()}
export function renderCart(){const n=cart.reduce((s,i)=>s+i.q,0),b=$('cartBadge');b.textContent=n;b.classList.toggle('on',n>0);
  $('drItems').innerHTML=cart.length?cart.map((i,x)=>{const nm=i.dig?i.dig.n[L]:i.p.n[L],ic=i.dig?i.dig.icon:i.p.icon,bg=i.dig?MAT_ART.File.bg:matArt(i.p.mat).bg,meta=i.dig?i.dig.f.join(' · '):i.mat+(i.txt?' · “'+i.txt+'”':'');
  return `<div class="ditem"><div class="di-img" style="background:${bg}">${ic}</div><div style="flex:1"><h4>${nm}</h4><div class="di-meta">${meta}</div>
  <div style="display:flex;align-items:center;gap:8px">${i.dig?'':`<div class="qty"><button data-action="cart-qty" data-i="${x}" data-d="-1" aria-label="−">−</button><b>${i.q}</b><button data-action="cart-qty" data-i="${x}" data-d="1" aria-label="+">+</button></div>`}<button style="font-size:12px;color:var(--ink-soft);text-decoration:underline" data-action="cart-rm" data-i="${x}">${T('rm')}</button></div></div>
  <div class="di-price">${eur(i.u*i.q)}</div></div>`}).join(''):`<div class="dr-empty"><div class="ill"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/><path d="M9.5 11v3M14.5 11v3" opacity=".5"/></svg></div><b style="font-family:var(--fd);font-size:19px;color:var(--ink)">${T('crtE')}</b><p style="font-size:14px;margin-top:6px">${T('crtE2')}</p></div>`;
  $('drTotal').textContent=eur(cart.reduce((s,i)=>s+i.u*i.q,0))}
export function openCart(){$('drawer').classList.add('open');$('overlay').classList.add('open')}
export function closeCart(){$('drawer').classList.remove('open');$('overlay').classList.remove('open')}
export function checkoutWhatsApp(){
  if(!cart.length){ toast(T('crtE')); return }
  const num=(CONFIG.whatsapp||'').replace(/\D/g,'');
  if(!num){ toast('Numero WhatsApp non configurato'); return }
  let msg = (L==='it'?'Ciao INGLY! Vorrei ordinare:':'Hi INGLY! I would like to order:')+'\n';
  cart.forEach(i=>{
    const nm=i.dig?i.dig.n[L]:i.p.n[L];
    const meta=i.dig?'':(i.mat?' ('+i.mat+')':'');
    msg += `\n• ${i.q}× ${nm}${meta} — ${eur(i.u*i.q)}`;
  });
  const tot=cart.reduce((s,i)=>s+i.u*i.q,0);
  msg += '\n\n'+(L==='it'?'Totale indicativo':'Estimated total')+': '+eur(tot);
  window.open('https://wa.me/'+num+'?text='+encodeURIComponent(msg),'_blank');
}

/* ---- controlli statici dello shop ---- */
export function setColl(c,btn){collCur=c;document.querySelectorAll('#collTabs .tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');renderColl()}
export function initShopControls(){
  $('q').addEventListener('input',()=>{renderShop();renderChips()});
  $('pRange').addEventListener('input',e=>{$('pv').textContent='€'+e.target.value;renderShop();renderChips()});
  $('sortSel').addEventListener('change',e=>setSort(e.target.value));
}


/* ===== 2.1 Zoom foto: lightbox con navigazione ===== */
let LBX={list:[],i:0};
export function openPhoto(src){
  LBX.list=[src]; LBX.i=0;
  const box=$('lightbox'); if(!box) return;
  box.hidden=false; document.body.style.overflow='hidden';
  document.body.classList.add('lbx-open'); paintLbx();
}
export function openLightbox(startSrc){
  LBX.list=galleryOf(cur);
  /* confronta i percorsi senza query (?v=) per trovare la foto giusta */
  const norm=s=>String(s||'').split('?')[0];
  const idx=LBX.list.findIndex(s=>norm(s)===norm(startSrc));
  LBX.i=idx>=0?idx:0;
  const box=$('lightbox'); if(!box) return;
  box.hidden=false; document.body.style.overflow='hidden';
  document.body.classList.add('lbx-open');
  paintLbx();
}
function paintLbx(){
  const im=$('lbxImg'); if(!im) return;
  im.src=LBX.list[LBX.i]||''; im.alt=cur?cur.n[L]:'';
  const multi=LBX.list.length>1;
  $('lbxPrev').style.display=multi?'':'none';
  $('lbxNext').style.display=multi?'':'none';
  $('lbxCount').textContent=multi?(LBX.i+1)+' / '+LBX.list.length:'';
}
export function lbxMove(d){ if(!LBX.list.length)return;
  LBX.i=(LBX.i+d+LBX.list.length)%LBX.list.length; paintLbx(); }
export function closeLightbox(){
  const box=$('lightbox'); if(!box) return;
  box.hidden=true; document.body.style.overflow='';
  document.body.classList.remove('lbx-open');
}


/* ===== 2.2 Filtri condivisibili: stato nell'URL ===== */
let URL_LOCK=false;
export function syncFiltersToURL(){
  if(URL_LOCK) return;
  try{
    const q=[];
    const t=($('q')&&$('q').value||'').trim();
    if(t) q.push('q='+encodeURIComponent(t));
    if(F.cat.size) q.push('cat='+[...F.cat].join(','));
    if(F.mat.size) q.push('mat='+[...F.mat].join(','));
    if(F.sub.size) q.push('sub='+[...F.sub].join(','));
    const pr=$('pRange'); if(pr && +pr.value<120) q.push('max='+pr.value);
    if(SORT&&SORT!=='rel') q.push('sort='+SORT);
    const base=location.hash.split('?')[0]||'#/shop';
    const next=base+(q.length?'?'+q.join('&'):'');
    if(location.hash!==next) history.replaceState(null,'',next);
  }catch(e){}
}
export function readFiltersFromURL(){
  try{
    const raw=location.hash.split('?')[1]; if(!raw) return false;
    const pr=new URLSearchParams(raw);
    URL_LOCK=true;
    F.cat.clear(); F.mat.clear(); F.sub.clear();
    if(pr.get('cat')) pr.get('cat').split(',').filter(Boolean).forEach(v=>F.cat.add(v));
    if(pr.get('mat')) pr.get('mat').split(',').filter(Boolean).forEach(v=>F.mat.add(v));
    if(pr.get('sub')) pr.get('sub').split(',').filter(Boolean).forEach(v=>F.sub.add(+v));
    if(pr.get('q')&&$('q')) $('q').value=pr.get('q');
    if(pr.get('max')&&$('pRange')){ $('pRange').value=pr.get('max');
      if($('pv')) $('pv').textContent='€'+pr.get('max'); }
    if(pr.get('sort')) SORT=pr.get('sort');
    URL_LOCK=false;
    return true;
  }catch(e){ URL_LOCK=false; return false }
}

/* ===== 2.2 Suggerimenti di ricerca ===== */
export function searchSuggest(term){
  const t=String(term||'').trim().toLowerCase();
  if(t.length<2) return [];
  const out=[];
  const seen=new Set();
  const push=(label,kind,action,arg)=>{ const k=kind+':'+arg; if(seen.has(k))return; seen.add(k); out.push({label,kind,action,arg}) };
  VIS().forEach(x=>{ if((x.n[L]||'').toLowerCase().includes(t)) push(x.n[L],'prodotto','open-product',x.id) });
  CATS.forEach(c=>{ if((c.n[L]||'').toLowerCase().includes(t)) push(c.n[L],'categoria','go-shop',c.id) });
  Object.keys(MATN).forEach(m=>{ const nm=(MATN[m]&&MATN[m][L])||m;
    if(nm.toLowerCase().includes(t)) push(nm,'materiale','sugg-mat',m) });
  return out.slice(0,7);
}


/* Apre una serie di immagini nella lightbox partendo da quella cliccata (portfolio) */
export function openSeries(list,startSrc){
  const clean=(list||[]).filter(Boolean);
  if(!clean.length) return;
  LBX.list=clean;
  const i=clean.findIndex(s=>String(s).split('?')[0]===String(startSrc||'').split('?')[0]);
  LBX.i=i>=0?i:0;
  const box=$('lightbox'); if(!box) return;
  box.hidden=false; document.body.style.overflow='hidden';
  document.body.classList.add('lbx-open');
  paintLbx();
}


/* ===== Scheda progetto portfolio ===== */
export function openProject(idx){
  const t=(window.INGLY.PORT||[])[idx]; if(!t) return;
  const D=t[5]||{}; if(!Object.keys(D).length) return false;
  const box=document.getElementById('projModal'), body=document.getElementById('projBody');
  if(!box||!body) return false;
  const cover=t[3]||(D.foto&&D.foto[0]);
  const facts=[];
  if(D.cliente)facts.push(['Cliente',D.cliente]);
  if(D.data)facts.push(['Data',D.data]);
  if(D.durata)facts.push(['Durata',D.durata]);
  if(D.settore)facts.push(['Settore',D.settore]);
  if(D.macchina)facts.push(['Macchina',D.macchina]);
  if((D.materiali||[]).length)facts.push(['Materiali',D.materiali.join(', ')]);
  const story=(D.racconto&&(D.racconto[L]||D.racconto.it))||'';
  const linked=(D.prodotti||[]).map(id=>(window.INGLY.P||[]).find(x=>x.id===id)).filter(Boolean);
  body.innerHTML=
    (cover?`<img class="proj-hero" src="${imgV(cover)}" alt="${(t[1][L]||'').replace(/"/g,'')}">`:'')
    +`<div class="proj-eyebrow">${D.settore||'Progetto'}</div>`
    +`<h2 class="proj-title">${t[1][L]||t[1].it}</h2>`
    +((D.tag||[]).length?`<div class="proj-tags">${D.tag.map(x=>`<span class="proj-tag">${x}</span>`).join('')}</div>`:'')
    +(facts.length?`<div class="proj-facts">${facts.map(f=>`<div class="proj-fact"><b>${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div>`:'')
    +(story?`<p class="proj-story">${story}</p>`:'')
    +(D.prima&&D.dopo?`<div class="proj-ba">
        <figure><figcaption>Prima</figcaption><img src="${imgV(D.prima)}" alt="Prima"></figure>
        <figure><figcaption>Dopo</figcaption><img src="${imgV(D.dopo)}" alt="Dopo"></figure></div>`:'')
    +((D.foto||[]).length?`<div class="proj-gallery">${D.foto.map(f=>
        `<img src="${imgV(f)}" alt="" loading="lazy" data-action="proj-photo" data-arg="${f}">`).join('')}</div>`:'')
    +(D.video?`<div class="proj-video"><video src="${D.video}" controls preload="none" playsinline></video></div>`:'')
    +(linked.length?`<div class="proj-eyebrow" style="margin-top:18px">Prodotti del progetto</div>
        <div class="proj-linked">${linked.map(pr=>
        `<a class="btn" href="#/product?id=${pr.id}" data-action="close-proj">${pr.n[L]}</a>`).join('')}</div>`:'')
    +((D.social||t[4])?`<div class="proj-linked"><a class="btn btn-primary" href="${D.social||t[4]}" target="_blank" rel="noopener">Guarda su Instagram ↗</a></div>`:'');
  box.hidden=false; document.body.style.overflow='hidden';
  return true;
}
export function closeProject(){
  const box=document.getElementById('projModal'); if(!box) return;
  box.hidden=true; document.body.style.overflow='';
}
