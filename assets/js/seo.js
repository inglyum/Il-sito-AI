/* ============ SEO (modulo) ============
   Meta dinamici per pagina, Open Graph, Twitter Card, canonical, hreflang
   e dati strutturati Schema.org (Organization + Product sulla pagina prodotto).
   Tutto generato dai dati dell'admin: nessuna duplicazione. */
const { CONFIG } = window.INGLY;
const S = CONFIG.seo || {};
const base = () => (S.dominio || location.origin).replace(/\/+$/,'');
const abs = p => base() + '/' + String(p||'').replace(/^\/+/,'');

const set = (sel, attr, val) => {
  let el = document.head.querySelector(sel);
  if(!el){ el=document.createElement(sel.startsWith('link')?'link':'meta');
    const m=sel.match(/\[(\w+)="([^"]+)"\]/); if(m) el.setAttribute(m[1],m[2]);
    document.head.appendChild(el); }
  el.setAttribute(attr,val); return el;
};
const jsonld = (id,obj) => {
  let s=document.getElementById(id);
  if(!s){ s=document.createElement('script'); s.type='application/ld+json'; s.id=id; document.head.appendChild(s) }
  s.textContent=JSON.stringify(obj);
};

/* dati strutturati fissi: chi è INGLY (aiuta Google a mostrare il brand) */
export function initSeo(){
  jsonld('ld-org',{
    "@context":"https://schema.org","@type":"LocalBusiness",
    "name":S.azienda||"INGLY DESIGN",
    "description":S.descrizione||"",
    "url":base(),
    "logo":abs('assets/images/logo.png'),
    "image":abs(S.immagineSocial||'assets/images/og-image.jpg'),
    "email":CONFIG.email||undefined,
    "telephone":S.telefono||undefined,
    "address":{"@type":"PostalAddress","addressLocality":S.citta||"","addressRegion":S.regione||"","addressCountry":S.paese||"IT"},
    "sameAs":Object.values(CONFIG.social||{}).filter(u=>u&&u.startsWith('http')),
    "priceRange":"€€"
  });
  set('meta[name="keywords"]','content',S.keywords||'');
  set('meta[name="theme-color"]','content','#0a0d18');
  set('meta[property="og:site_name"]','content',S.azienda||'INGLY DESIGN');
  set('meta[property="og:type"]','content','website');
  set('meta[name="twitter:card"]','content','summary_large_image');
}

/* meta della pagina corrente (chiamato dal router a ogni cambio pagina) */
export function updateSeo(page, L, T, product){
  const titles = {
    home:S.titolo||document.title, shop:T('shopH2'), digital:T('digEye'), business:T('bizH2'),
    portfolio:T('portH2'), about:T('abH2'), faq:T('faqH2'), quote:T('qH2')
  };
  const isProd = page==='product' && product;
  const title = isProd
      ? `${product.n[L]} — ${S.azienda||'INGLY DESIGN'}`
      : (page==='home' ? (S.titolo||'INGLY DESIGN') : `${(titles[page]||'').replace(/<[^>]+>/g,'')} — ${S.azienda||'INGLY DESIGN'}`);
  const desc = isProd
      ? ((product.desc&&product.desc[L])||S.descrizione||'')
      : (S.descrizione||'');
  const url = base()+'/#/'+page;
  const img = isProd ? abs((CONFIG.cartellaImmagini||'img/')+product.id+'.webp') : abs(S.immagineSocial||'assets/images/og-image.jpg');

  document.title = title;
  set('meta[name="description"]','content',desc);
  set('link[rel="canonical"]','href',url);
  set('meta[property="og:title"]','content',title);
  set('meta[property="og:description"]','content',desc);
  set('meta[property="og:url"]','content',url);
  set('meta[property="og:image"]','content',img);
  set('meta[property="og:locale"]','content',L==='it'?'it_IT':'en_US');
  set('meta[name="twitter:title"]','content',title);
  set('meta[name="twitter:description"]','content',desc);
  set('meta[name="twitter:image"]','content',img);
  /* hreflang: stessa pagina, due lingue */
  set('link[rel="alternate"][hreflang="it"]','href',url);
  set('link[rel="alternate"][hreflang="en"]','href',url);
  set('link[rel="alternate"][hreflang="x-default"]','href',url);

  if(isProd){
    /* tutte le immagini del prodotto: cover + gallery, in assoluto */
    const imgs=[img, ...((product.gallery||[]).map(g=>abs(g)))].filter((v,i,a)=>v&&a.indexOf(v)===i);
    const cat=(window.INGLY.CATS||[]).find(c=>c.id===product.cat);
    jsonld('ld-product',{
      "@context":"https://schema.org","@type":"Product",
      "name":product.n[L], "sku":product.sku||('INGLY-'+product.id),
      "description":desc.replace(/<[^>]+>/g,''),
      "image":imgs,
      "category":cat?cat.n[L]:undefined,
      "material":product.mat||undefined,
      "brand":{"@type":"Brand","name":S.azienda||"INGLY DESIGN"},
      "aggregateRating":product.rev?{"@type":"AggregateRating","ratingValue":String(product.rating||4.9),
        "reviewCount":product.rev,"bestRating":"5","worstRating":"1"}:undefined,
      "offers":{"@type":"Offer","price":product.price,"priceCurrency":"EUR",
        "availability":"https://schema.org/InStock","url":url,"itemCondition":"https://schema.org/NewCondition",
        "priceValidUntil":new Date(Date.now()+31536000000).toISOString().slice(0,10),
        "seller":{"@type":"Organization","name":S.azienda||"INGLY DESIGN"}}
    });
    /* briciole di pane: Home › Categoria › Prodotto */
    const crumbs=[{"@type":"ListItem","position":1,"name":"Home","item":base()+'/'}];
    if(cat)crumbs.push({"@type":"ListItem","position":2,"name":cat.n[L],"item":base()+'/#/shop?cat='+cat.id});
    crumbs.push({"@type":"ListItem","position":crumbs.length+1,"name":product.n[L],"item":url});
    jsonld('ld-crumbs',{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":crumbs});
  } else {
    ['ld-product','ld-crumbs'].forEach(id=>{const s=document.getElementById(id);if(s)s.remove()});
  }

  /* FAQ strutturate: compaiono come domande espandibili nei risultati Google */
  const faqs=(window.INGLY.FAQS||[]);
  if(page==='faq' && faqs.length){
    jsonld('ld-faq',{"@context":"https://schema.org","@type":"FAQPage",
      "mainEntity":faqs.slice(0,20).map(f=>({"@type":"Question","name":(f[0]&&f[0][L])||'',
        "acceptedAnswer":{"@type":"Answer","text":((f[1]&&f[1][L])||'').replace(/<[^>]+>/g,'')}}))});
  } else { const s=document.getElementById('ld-faq'); if(s) s.remove(); }
}
