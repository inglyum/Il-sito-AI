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
function stockBadge(x){
  if(x.stock===undefined||x.stock===null)return '';
  if(x.stock===0)return `<span class="ptag" style="background:#dc2626;top:auto;bottom:8px">${L==='it'?'Esaurito':'Sold out'}</span>`;
  if(x.stock<=3)return `<span class="ptag y" style="top:auto;bottom:8px">${L==='it'?'Ultimi '+x.stock:'Only '+x.stock+' left'}</span>`;
  return '';}
function card(x){const a=matArt(x.mat);
  return `<article class="pcard reveal in" data-action="open-product" data-id="${x.id}">
    <div class="pimg" style="background:${a.bg}">
      ${x.tag?`<span class="ptag ${x.tag==='Limited'?'y':x.tag==='B2B'?'b':''}">${x.tag}</span>`:''}
      <button class="wish ${wish.has(x.id)?'on':''}" aria-label="Wishlist" data-action="wish" data-id="${x.id}"><svg viewBox="0 0 24 24"><path d="M19 14c1.5-1.5 2-3.2 2-5a5 5 0 0 0-9-3 5 5 0 0 0-9 3c0 1.8.5 3.5 2 5l7 7z"/></svg></button>
      <div class="art">${x.icon}</div>${imgTag(x)}${stockBadge(x)}
      ${x.stock===0?'':`<button class="qadd" data-action="quick-add" data-id="${x.id}">+ ${eur(x.price)}</button>`}
    </div>
    <div class="pbody"><span class="mat">${MATN[x.mat][L]} · ${CATS.find(c=>c.id===x.cat).n[L]}</span><h3>${x.n[L]}</h3>
    <div class="prow"><span class="price">${eur(x.price)}</span><span class="stars">★★★★★ <span>(${x.rev})</span></span></div></div></article>`}

export function toggleWish(id,el){wish.has(id)?wish.delete(id):wish.add(id);el.classList.toggle('on');
  const b=$('wishBadge');b.textContent=wish.size;b.classList.toggle('on',wish.size>0);
  saveWish();toast(wish.has(id)?T('wAdd'):T('wRm'))}

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
let galIdx=0, galShots=[];

export function openProduct(id){RV=[id,...RV.filter(x=>x!==id)].slice(0,8);
  cur=P.find(x=>x.id===id)||P[0];sel={qty:1};galIdx=0;
  renderPP();go('product')}

export function renderPP(){
  const a=matArt(cur.mat), c=CATS.find(k=>k.id===cur.cat);

  /* breadcrumb con sottocategoria */
  $('crumbName').textContent=cur.n[L];
  const sub=c&&c.sub&&c.sub[cur.sub-1];
  const catLink=$('crumbCatLink'), sep=$('crumbSubSep');
  if(c&&catLink){
    catLink.textContent=c.ic+' '+c.n[L];
    catLink.setAttribute('data-action','go-shop');
    catLink.setAttribute('data-arg',c.id);
    catLink.style.display='';
    if(sep) sep.style.display='';
  }

  /* badge dinamici */
  const badges=[];
  if(cur.tag==='New'||(cur.coll&&cur.coll.includes('new'))) badges.push('<span class="pp-badge pp-badge-new">'+(L==='it'?'Nuovo':'New')+'</span>');
  if(cur.tag==='Best'||(cur.coll&&cur.coll.includes('best'))) badges.push('<span class="pp-badge pp-badge-best">'+(L==='it'?'Bestseller':'Bestseller')+'</span>');
  if(cur.tag==='Limited') badges.push('<span class="pp-badge pp-badge-ltd">'+(L==='it'?'Edizione Limitata':'Limited')+'</span>');
  if(cur.stock===0) badges.push('<span class="pp-badge pp-badge-out">'+(L==='it'?'Esaurito':'Sold out')+'</span>');
  else if(cur.stock>0&&cur.stock<=3) badges.push('<span class="pp-badge pp-badge-low">'+(L==='it'?'Ultimi '+cur.stock+' pezzi':'Only '+cur.stock+' left')+'</span>');
  $('ppBadges').innerHTML=badges.join('');

  $('ppCat').textContent=c.ic+' '+c.n[L]+(sub?' · '+sub[L]:'');
  $('ppName').textContent=cur.n[L];

  /* rating row */
  const pct=Math.min(100,Math.round((cur.rev||0)/2));
  $('ppStars').innerHTML='★★★★★';
  $('ppRevCount').textContent='('+((cur.rev||0))+' '+T('revs')+')';

  $('ppProd').textContent=cur.prod+' '+T('days');
  $('ppMat').textContent=MATN[cur.mat][L];
  $('ppMain').style.background=a.bg;

  /* galleria principale con frecce */
  galShots=galleryOf(cur);
  galIdx=0;
  renderGalFrame();

  const tw=$('ppThumbs');
  tw.style.display=galShots.length>1?'':'none';
  tw.innerHTML=galShots.length>1?galShots.map((src,i)=>`<div class="thumb ${i===0?'on':''}" style="background:${a.bg}" data-action="pp-thumb" data-src="${src}" data-idx="${i}" role="button" tabindex="0"><img src="${src}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"></div>`).join(''):'';

  /* frecce: mostra solo se più di 1 foto */
  const show=galShots.length>1?'':'none';
  document.querySelectorAll('.gal-arrow').forEach(a=>a.style.display=show);

  /* swipe touch */
  initGalSwipe();

  $('ppQty').textContent=sel.qty;
  $('ppDesc').textContent=(cur.desc&&cur.desc[L])||T('descDefault');

  /* tab misure */
  $('ppSizes').innerHTML=(Array.isArray(cur.misure)&&cur.misure.length)
    ? `<table class="sz-tab"><caption>${T('szH')||'Misure e dettagli'}</caption><tbody>`
      + cur.misure.map(r=>`<tr><th scope="row">${r[0]}</th><td>${r[1]}</td></tr>`).join('')
      + `</tbody></table>`
    : `<p class="pp-empty-tab">${L==='it'?'Nessuna misura disponibile per questo prodotto.':'No measurements available for this product.'}</p>`;

  /* tab recensioni — breakdown visivo */
  renderReviews();

  /* video */
  $('ppVideo').innerHTML=cur.video?`<video src="${cur.video}" controls preload="none" playsinline ${cur.poster?`poster="${imgV(cur.poster)}"`:''}></video>`:'';

  /* embed */
  if(cur.embed){
    $('ppEmbed').innerHTML=`<h5 style="font-family:var(--fd);font-style:italic;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-soft);margin:24px 0 10px">${T('embedH')||'Configuratore'}</h5>
  <iframe src="${cur.embed}" loading="lazy" title="Configuratore" allow="clipboard-write" style="width:100%;height:480px;border:1px solid var(--line);border-radius:20px;background:var(--bg-deep)"></iframe>`;
  } else {
    $('ppEmbed').innerHTML='';
  }

  renderDisc();price();
  ppTabShow('desc');

  /* correlati: prima manuale, poi auto, fino a 6 */
  const manual=(cur.rel||[]).map(id=>P.find(x=>x.id===id)).filter(Boolean);
  const auto=VIS().filter(x=>x.id!==cur.id&&!manual.some(m=>m.id===x.id)&&(x.cat===cur.cat||x.mat===cur.mat));
  const rel=[...manual,...auto].slice(0,6);
  const rs=$('relSec');
  if(rs) rs.style.display=rel.length?'':'none';
  $('relGrid').innerHTML=rel.map(card).join('');
}

function renderGalFrame(){
  const src=galShots[galIdx]||'';
  const art=$('ppArt');
  art.innerHTML=cur.icon+`<img class="pimgph" src="${src}" alt="${cur.n[L].replace(/"/g,'')}" loading="eager">`
    +`<span class="pp-zoomhint">🔍 ${T('zoomHint')||'Clicca per ingrandire'}</span>`;
  /* sincronizza thumbnail */
  document.querySelectorAll('#ppThumbs .thumb').forEach((el,i)=>el.classList.toggle('on',i===galIdx));
}

function initGalSwipe(){
  const box=$('ppMain'); if(!box||box._swipeInit) return;
  box._swipeInit=true;
  let sx=0;
  box.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});
  box.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-sx;
    if(Math.abs(dx)>40){dx<0?galNext():galPrev();}
  },{passive:true});
}

export function galPrev(){galIdx=(galIdx-1+galShots.length)%galShots.length;renderGalFrame()}
export function galNext(){galIdx=(galIdx+1)%galShots.length;renderGalFrame()}

function renderReviews(){
  const total=cur.rev||0;
  /* genera distribuzione realistica basata sul totale */
  const d5=Math.round(total*.68), d4=Math.round(total*.20), d3=Math.round(total*.07),
        d2=Math.round(total*.03), d1=total-d5-d4-d3-d2;
  const rows=[5,4,3,2,1].map((s,i)=>{
    const n=[d5,d4,d3,d2,d1][i], pct=total?Math.round(n/total*100):0;
    return `<div class="rv-row">
      <span class="rv-star">${s}★</span>
      <div class="rv-bar"><div class="rv-fill" style="width:${pct}%"></div></div>
      <span class="rv-pct">${pct}%</span>
    </div>`;
  }).join('');
  $('ppReviews').innerHTML=`
    <div class="rv-overview">
      <div class="rv-big">
        <span class="rv-score">4.8</span>
        <div class="rv-stars-big">★★★★★</div>
        <span class="rv-tot">${total} ${T('revs')}</span>
      </div>
      <div class="rv-bars">${rows}</div>
    </div>
    <p class="pp-empty-tab" style="margin-top:20px;font-size:13px;color:var(--ink-soft)">
      ${L==='it'?'Le recensioni dei clienti verificati sono raccolte via WhatsApp e mostrate nell\'app.':'Verified customer reviews are collected via WhatsApp and shown in the app.'}
    </p>`;
}

/* ---- tab switching ---- */
export function ppTabShow(tab){
  document.querySelectorAll('.pp-tab').forEach(b=>{
    const on=b.dataset.tab===tab;
    b.classList.toggle('active',on);
    b.setAttribute('aria-selected',on);
  });
  document.querySelectorAll('.pp-panel').forEach(p=>p.classList.remove('active'));
  const panel=$('ppPanel'+tab.charAt(0).toUpperCase()+tab.slice(1));
  if(panel) panel.classList.add('active');
}

export function galleryOf(x){
  const main=x.img||(CONFIG.cartellaImmagini+x.id+'.webp');
  return [main,...(x.gallery||[])].map(imgV);
}
export function ppThumb(el){
  galIdx=+(el.dataset.idx||0);
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
export function renderDigital(){$('digGrid').innerHTML=DIG.map(d=>{
  const stripeUrl=(CONFIG.stripeLinks||{})[d.id];
  const buyBtn=stripeUrl
    ?`<a class="btn btn-blue" href="${stripeUrl}" target="_blank" rel="noopener" style="padding:10px 20px;font-size:13.5px;text-decoration:none">💳 ${T('buy')}</a>`
    :`<button class="btn btn-blue" style="padding:10px 20px;font-size:13.5px" data-action="dig-add" data-id="${d.id}">⬇ ${T('buy')}</button>`;
  return `<div class="dcard reveal in">
  <div style="height:110px;border-radius:14px;background:${MAT_ART.File.bg};display:grid;place-items:center;font-size:42px">${d.icon}</div>
  <h3 style="font-size:17px;margin-top:14px">${d.n[L]}</h3>
  <div class="fmt">${d.f.map(f=>`<i>${f}</i>`).join('')}</div>
  <span class="lic">${T('lic')}</span>
  <div class="dl"><span class="price">${eur(d.price)}</span>${buyBtn}</div></div>`}).join('')}
export function addDigital(id){const d=DIG.find(x=>x.id===+id);cart.push({dig:d,q:1,u:d.price});renderCart();saveCart();toast(T('added'));openCart()}

/* ---- carrello ---- */
const FREE_SHIP=79; /* soglia spedizione gratuita */
const COUPONS={'INGLY10':{pct:.10,label:'−10%'},'INGLY15':{pct:.15,label:'−15%'},'LASER20':{pct:.20,label:'−20% Laser'}};
let activeCoupon=null;

function saveCart(){try{localStorage.setItem('ingly_cart',JSON.stringify(cart.map(i=>i.dig?{dig:i.dig.id,q:i.q,u:i.u}:{id:i.p.id,q:i.q,mat:i.mat,txt:i.txt,u:i.u})))}catch(e){}}
function loadCart(){try{const c=localStorage.getItem('ingly_cart');if(!c)return;JSON.parse(c).forEach(i=>{if(i.dig){const d=DIG.find(x=>x.id===i.dig);if(d)cart.push({dig:d,q:i.q,u:i.u})}else{const p=P.find(x=>x.id===i.id);if(p)cart.push({p,q:i.q,mat:i.mat,txt:i.txt,u:i.u})}})}catch(e){}}
function saveWish(){try{localStorage.setItem('ingly_wish',JSON.stringify([...wish]))}catch(e){}}
function loadWish(){try{const w=localStorage.getItem('ingly_wish');if(w)wish=new Set(JSON.parse(w))}catch(e){}}

export function addToCart(id,q=1,mat,txt,u){
  const x=P.find(k=>k.id===+id); if(!x) return;
  /* aggrega se già nel carrello con stesso materiale */
  const ex=cart.find(i=>!i.dig&&i.p.id===x.id&&i.mat===(mat||MATN[x.mat][L]));
  if(ex){ ex.q+=q; } else { cart.push({p:x,q,mat:mat||MATN[x.mat][L],txt:txt||'',u:u??x.price}); }
  renderCart();saveCart();toast(T('added'));openCart();
}
export function rmCart(i){cart.splice(+i,1);renderCart();saveCart()}
export function cQty(i,d){i=+i;cart[i].q=Math.max(1,cart[i].q+ +d);renderCart();saveCart()}

export function applyCoupon(){
  const code=($('drCouponInput').value||'').trim().toUpperCase();
  const msg=$('drCouponMsg');
  const cp=COUPONS[code];
  if(cp){ activeCoupon={...cp,code}; msg.textContent='✓ '+cp.label+' applicato!'; msg.className='dr-coupon-msg ok'; }
  else { activeCoupon=null; msg.textContent=L==='it'?'Codice non valido.':'Invalid code.'; msg.className='dr-coupon-msg err'; }
  renderCart();
}

export function renderCart(){
  const n=cart.reduce((s,i)=>s+i.q,0);
  const b=$('cartBadge'); b.textContent=n; b.classList.toggle('on',n>0);
  const dc=$('drCount'); if(dc) dc.textContent=n?n+(L==='it'?' articoli':' items'):'';

  /* items */
  $('drItems').innerHTML=cart.length
    ? cart.map((i,x)=>{
        const nm=i.dig?i.dig.n[L]:i.p.n[L];
        const ic=i.dig?i.dig.icon:i.p.icon;
        const bg=i.dig?MAT_ART.File.bg:matArt(i.p.mat).bg;
        const meta=i.dig?i.dig.f.join(' · '):i.mat+(i.txt?' · “'+i.txt+'”':'');
        const unitPrice=eur(i.u);
        return `<div class=”ditem”>
          <div class=”di-img” style=”background:${bg}”>${ic}</div>
          <div style=”flex:1;min-width:0”>
            <h4>${nm}</h4>
            <div class=”di-meta”>${meta}</div>
            <div class=”di-actions”>
              ${i.dig?'':`<div class=”qty”><button data-action=”cart-qty” data-i=”${x}” data-d=”-1” aria-label=”−”>−</button><b>${i.q}</b><button data-action=”cart-qty” data-i=”${x}” data-d=”1” aria-label=”+”>+</button></div>`}
              <button class=”di-rm” data-action=”cart-rm” data-i=”${x}”>${T('rm')}</button>
            </div>
          </div>
          <div class=”di-price-col”>
            <span class=”di-price”>${eur(i.u*i.q)}</span>
            ${i.q>1?`<span class=”di-unit”>${unitPrice} cad.</span>`:''}
          </div>
        </div>`;
      }).join('')
    : `<div class=”dr-empty”>
        <div class=”ill”><svg viewBox=”0 0 24 24”><path d=”M6 7h12l-1 13H7z”/><path d=”M9 7a3 3 0 0 1 6 0”/><path d=”M9.5 11v3M14.5 11v3” opacity=”.5”/></svg></div>
        <b>${T('crtE')}</b><p>${T('crtE2')}</p>
        <button class=”btn btn-primary” style=”margin-top:16px” data-action=”go” data-arg=”shop”>${L==='it'?'Vai allo shop':'Go to shop'}</button>
      </div>`;

  /* barra spedizione gratuita */
  const sub=cart.reduce((s,i)=>s+i.u*i.q,0);
  const bar=$('drShipBar'), fill=$('drShipFill'), msg=$('drShipMsg');
  if(bar){
    if(!cart.length){ bar.style.display='none'; }
    else if(sub>=FREE_SHIP){
      bar.style.display='';
      fill.style.width='100%';
      msg.textContent=L==='it'?'🎉 Spedizione gratuita inclusa!':'🎉 Free shipping included!';
      msg.className='dr-ship-msg ok';
    } else {
      bar.style.display='';
      const pct=Math.min(100,Math.round(sub/FREE_SHIP*100));
      fill.style.width=pct+'%';
      const manca=eur(FREE_SHIP-sub);
      msg.textContent=(L==='it'?`Aggiungi ancora ${manca} per la spedizione gratuita`:`Add ${manca} more for free shipping`);
      msg.className='dr-ship-msg';
    }
  }

  /* totali con coupon */
  const discountAmt=activeCoupon?Math.round(sub*activeCoupon.pct*100)/100:0;
  const total=sub-discountAmt;
  const subEl=$('drSubtotal'); if(subEl) subEl.textContent=eur(sub);
  const dr=$('drDiscountRow');
  if(dr){
    dr.style.display=activeCoupon?'flex':'none';
    const lbl=$('drCouponLabel'); if(lbl) lbl.textContent=activeCoupon?activeCoupon.label:'Sconto';
    const dv=$('drDiscountVal'); if(dv) dv.textContent='−'+eur(discountAmt);
  }
  $('drTotal').textContent=eur(total);
}

export function openCart(){
  $('drawer').classList.add('open');$('overlay').classList.add('open');
  $('drawer').focus();
}
export function closeCart(){$('drawer').classList.remove('open');$('overlay').classList.remove('open')}

export function checkoutWhatsApp(){
  if(!cart.length){ toast(T('crtE')); return }
  const num=(CONFIG.whatsapp||'').replace(/\D/g,'');
  if(!num){ toast('Numero WhatsApp non configurato in admin'); return }
  const sub=cart.reduce((s,i)=>s+i.u*i.q,0);
  const discountAmt=activeCoupon?Math.round(sub*activeCoupon.pct*100)/100:0;
  const total=sub-discountAmt;
  const ship=sub>=FREE_SHIP?(L==='it'?'Spedizione: GRATUITA':'Shipping: FREE'):(L==='it'?'Spedizione: da concordare':'Shipping: to be agreed');
  let msg=(L==='it'?'👋 Ciao INGLY Design! Vorrei ordinare:':'👋 Hi INGLY Design! I would like to order:')+'\n\n';
  cart.forEach(i=>{
    const nm=i.dig?i.dig.n[L]:i.p.n[L];
    const meta=i.dig?'':(i.mat?' ['+i.mat+']':'')+(i.txt?' “'+i.txt+'”':'');
    const sku=(!i.dig&&i.p.sku)?` (${i.p.sku})`:'';
    msg+=`• ${i.q}× ${nm}${meta}${sku} — ${eur(i.u*i.q)}\n`;
  });
  msg+='\n'+ship;
  if(activeCoupon) msg+=`\n${L==='it'?'Codice sconto':'Discount code'}: ${activeCoupon.code} (${activeCoupon.label})`;
  msg+='\n'+(L==='it'?'Totale stimato':'Estimated total')+': *'+eur(total)+'*';
  msg+='\n\n'+(L==='it'?'📍 Confermate il preventivo definitivo con prova grafica prima della produzione.':'📍 We\'ll confirm the final quote with a graphic proof before production.');
  window.open('https://wa.me/'+num+'?text='+encodeURIComponent(msg),'_blank');
  /* premia l'utente con punti fedeltà */
  const pts = Math.floor(total);
  try{
    const w = window._wish;
    if(w && w.addPoints) w.addPoints(pts);
  }catch(e){}
}

export function checkoutEmail(){
  if(!cart.length){ toast(T('crtE')); return }
  /* porta alla pagina preventivo con prodotti pre-compilati nel campo note */
  const summary=cart.map(i=>`${i.q}× ${i.dig?i.dig.n[L]:i.p.n[L]}`).join(', ');
  go('quote');
  setTimeout(()=>{
    const note=document.getElementById('qNote');
    if(note&&!note.value) note.value=(L==='it'?'Prodotti carrello: ':'Cart items: ')+summary;
  },400);
  closeCart();
}

/* ---- controlli statici dello shop ---- */
export function setColl(c,btn){collCur=c;document.querySelectorAll('#collTabs .tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');renderColl()}
export function initShopControls(){
  loadCart();loadWish();renderCart();
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
