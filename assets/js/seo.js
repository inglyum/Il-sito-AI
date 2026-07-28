/* ============ SEO (modulo) ============
   Meta dinamici per pagina, Open Graph, Twitter Card, canonical, hreflang
   e dati strutturati Schema.org (Organization + Product sulla pagina prodotto).
   Tutto generato dai dati dell'admin: nessuna duplicazione. */
import * as ENG from './seo-engine.js';
import * as SCH from './schema-engine.js';
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
  /* Grafo delle entità: azienda, sito (con la ricerca interna) e lavorazioni,
     collegati fra loro con @id. Prima erano blocchi separati e un motore non
     poteva sapere che il prodotto è venduto da quell'azienda. */
  const opt={ base:base(), social:Object.values(CONFIG.social||{}) };
  jsonld('ld-org', SCH.grafo([
    SCH.organizzazione(CONFIG,opt),
    SCH.sitoWeb(CONFIG,opt),
    SCH.servizi((window.INGLY.TECH)||[],{base:opt.base,azienda:S.azienda||'INGLY DESIGN'}),
  ]));
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
  const azienda = S.azienda||'INGLY DESIGN';

  /* Title e description passano dal SEO Engine: nascono da modelli modificabili
     dall'Admin, così ogni prodotto ha un titolo suo invece di ripetere lo stesso
     schema fisso. Se un prodotto ha un titolo scritto a mano (p.seoTitolo)
     quello vince sempre: il modello è un buon default, non una gabbia. */
  let title, desc;
  if(isProd){
    const cat=(window.INGLY.CATS||[]).find(c=>c.id===product.cat);
    const MATN=window.INGLY.MATN||{};
    const ctx={ L, azienda, citta:S.citta||'',
      categoria:(cat&&cat.n&&cat.n[L])||'',
      materiale:(MATN[product.mat]&&MATN[product.mat][L])||product.mat||'' };
    title = product.seoTitolo || ENG.titoloProdotto(product,S,ctx);
    desc  = product.seoDescrizione || ENG.descrizioneProdotto(product,S,ctx);
  }else{
    title = ENG.titoloPagina(page,S,{
      pagina:(titles[page]||'').replace(/<[^>]+>/g,''),
      azienda, claim:S.claim||S.titolo||'' });
    /* la home tiene il titolo scritto a mano, se c'è: è il più curato del sito */
    if(page==='home' && S.titolo) title=S.titolo;
    desc = S.descrizione||'';
  }
  /* direttiva per i motori: sempre indicizzabile salvo scelta esplicita */
  set('meta[name="robots"]','content',ENG.robots(page,S));
  /* URL canonico REALE della pagina.
     Prima era base()+'/#/'+page: indirizzi con '#' che Google collassa tutti
     sulla home, quindi canonical, og:url e hreflang puntavano di fatto a '/'.
     Il router usa la History API con percorsi puliti: il canonico deve
     rispecchiarli, e per il prodotto includere l'id, altrimenti tutte le schede
     dichiarano lo stesso canonico e Google ne indicizza una sola. */
  const url = page==='home' ? base()+'/'
            : isProd        ? base()+'/product/'+product.id+'/'
            :                 base()+'/'+page;
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
    const cat=(window.INGLY.CATS||[]).find(c=>c.id===product.cat);
    jsonld('ld-product',{
      "@context":"https://schema.org","@type":"Product",
      "name":product.n[L], "sku":product.sku||('INGLY-'+product.id),
      "description":desc.replace(/<[^>]+>/g,''),
      "image":SCH.immagini(product,{base:base(),cartella:CONFIG.cartellaImmagini||"img/",L}),
      "review":SCH.recensioni((window.INGLY.REVIEWS)||[],{L}),
      "category":cat?cat.n[L]:undefined,
      "material":product.mat||undefined,
      "brand":{"@type":"Brand","name":S.azienda||"INGLY DESIGN"},
      "aggregateRating":product.rev?{"@type":"AggregateRating","ratingValue":String(product.rating||4.9),
        "reviewCount":product.rev,"bestRating":"5","worstRating":"1"}:undefined,
      "offers":{"@type":"Offer","price":product.price,"priceCurrency":"EUR",
        "availability":product.hidden?"https://schema.org/OutOfStock":"https://schema.org/InStock",
        "url":url,"itemCondition":"https://schema.org/NewCondition",
        "priceValidUntil":new Date(Date.now()+31536000000).toISOString().slice(0,10),
        "seller":{"@id":base()+SCH.ID.org},
        "hasMerchantReturnPolicy":{"@type":"MerchantReturnPolicy","applicableCountry":"IT",
          "returnPolicyCategory":"https://schema.org/MerchantReturnFiniteReturnWindow",
          "merchantReturnDays":14,"returnMethod":"https://schema.org/ReturnByMail",
          "returnFees":"https://schema.org/FreeReturn"},
        "shippingDetails":{"@type":"OfferShippingDetails","shippingRate":{"@type":"MonetaryAmount","value":"0","currency":"EUR"},
          "doesNotShip":false,"deliveryTime":{"@type":"ShippingDeliveryTime","businessDays":{"@type":"QuantitativeValue","minValue":3,"maxValue":7}}}}
    });
    /* briciole di pane: Home › Categoria › Prodotto */
    const crumbs=[{"@type":"ListItem","position":1,"name":"Home","item":base()+'/'}];
    if(cat)crumbs.push({"@type":"ListItem","position":2,"name":cat.n[L],"item":base()+'/shop?cat='+cat.id});
    crumbs.push({"@type":"ListItem","position":crumbs.length+1,"name":product.n[L],"item":url});
    jsonld('ld-crumbs',{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":crumbs});
  } else {
    ['ld-product','ld-crumbs'].forEach(id=>{const s=document.getElementById(id);if(s)s.remove()});
  }

  /* Il catalogo come CollectionPage, non come semplice elenco: dichiara che è
     una pagina del sito che parla dell'azienda, e i due riferimenti @id lo
     ancorano al grafo invece di lasciarlo isolato. */
  if(page==='shop'){
    const prods=(window.INGLY.P||[]).filter(p=>!p.hidden);
    jsonld('ld-list', SCH.grafo([ SCH.paginaCollezione(prods,{
      base:base(), L, titolo:(S.azienda||'INGLY DESIGN')+' — Catalogo', url })
    ]));
  } else { const s=document.getElementById('ld-list'); if(s) s.remove(); }

  /* FAQ strutturate: compaiono come domande espandibili nei risultati Google */
  const faqs=(window.INGLY.FAQS||[]);
  if(page==='faq' && faqs.length){
    jsonld('ld-faq',{"@context":"https://schema.org","@type":"FAQPage",
      "mainEntity":faqs.slice(0,20).map(f=>({"@type":"Question","name":(f[0]&&f[0][L])||'',
        "acceptedAnswer":{"@type":"Answer","text":((f[1]&&f[1][L])||'').replace(/<[^>]+>/g,'')}}))});
  } else { const s=document.getElementById('ld-faq'); if(s) s.remove(); }
}
