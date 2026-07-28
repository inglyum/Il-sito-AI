/* ============ SCHEMA ENGINE ============
   Costruisce i dati strutturati (JSON-LD) come UN GRAFO di entità collegate,
   invece che come blocchi separati.

   Perché il grafo conta più dei singoli tipi: il sito già dichiarava
   LocalBusiness, Product, Offer, FAQPage… ma erano isole. Un motore leggeva
   «esiste un'azienda» e «esiste un prodotto» senza sapere che il secondo è
   venduto dalla prima. Collegandoli con @id si dichiara UNA entità azienda,
   richiamata da tutto il resto: è così che Google costruisce il Knowledge Panel
   ed è così che ChatGPT, Gemini e Perplexity capiscono *chi* vende *cosa*.

   Funzioni pure, nessun DOM: verificabili con tests/test-schema-engine.mjs. */

/* Identificativi stabili delle entità. Devono restare invariati nel tempo:
   cambiarli equivale, per un motore di ricerca, a dichiarare un'azienda nuova. */
export const ID = {
  org:  '/#organizzazione',
  sito: '/#sito',
  cat:  '/#catalogo',
};

const pulisci = t => String(t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* Toglie le chiavi vuote: un campo con valore nullo nel JSON-LD è rumore che
   alcuni validatori segnalano come errore. */
export function compatta(o){
  if(Array.isArray(o)) return o.map(compatta).filter(v => v !== undefined && v !== null && v !== '');
  if(o && typeof o === 'object'){
    const out = {};
    for(const k of Object.keys(o)){
      const v = compatta(o[k]);
      if(v === undefined || v === null || v === '') continue;
      if(Array.isArray(v) && !v.length) continue;
      if(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length) continue;
      out[k] = v;
    }
    return out;
  }
  return o;
}

/* L'AZIENDA — l'entità centrale a cui tutto il resto fa riferimento. */
export function organizzazione(cfg = {}, opt = {}){
  const { base = '', social = [] } = opt;
  const s = cfg.seo || cfg;
  return compatta({
    '@type': 'LocalBusiness',
    '@id': base + ID.org,
    name: s.azienda || 'INGLY DESIGN',
    description: pulisci(s.descrizione),
    url: base + '/',
    logo: { '@type': 'ImageObject', url: base + '/assets/images/logo.png' },
    image: base + '/' + String(s.immagineSocial || 'assets/images/og-image.jpg').replace(/^\/+/, ''),
    email: cfg.email || undefined,
    telephone: s.telefono || undefined,
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      addressLocality: s.citta || '',
      addressRegion: s.regione || '',
      addressCountry: s.paese || 'IT',
    },
    sameAs: social.filter(u => u && /^https?:\/\//.test(u)),
  });
}

/* IL SITO + la ricerca interna.
   SearchAction dice a Google che il sito ha una ricerca e come interrogarla:
   può comparire come casella di ricerca direttamente nei risultati.
   L'indirizzo dichiarato è quello VERO del catalogo (/shop?q=…), quindi
   funziona davvero — dichiararne uno inesistente sarebbe peggio che ometterlo. */
export function sitoWeb(cfg = {}, opt = {}){
  const { base = '', lang = 'it' } = opt;
  const s = cfg.seo || cfg;
  return compatta({
    '@type': 'WebSite',
    '@id': base + ID.sito,
    url: base + '/',
    name: s.azienda || 'INGLY DESIGN',
    description: pulisci(s.descrizione),
    inLanguage: lang === 'en' ? 'en' : 'it',
    publisher: { '@id': base + ID.org },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: base + '/shop?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    },
  });
}

/* IL CATALOGO come pagina-collezione. */
export function paginaCollezione(prodotti = [], opt = {}){
  const { base = '', L = 'it', titolo = 'Catalogo', url = '' } = opt;
  return compatta({
    '@type': 'CollectionPage',
    '@id': (url || base + '/shop') + '#collezione',
    name: titolo,
    url: url || base + '/shop',
    isPartOf: { '@id': base + ID.sito },
    about: { '@id': base + ID.org },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: prodotti.length,
      itemListElement: prodotti.slice(0, 50).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: base + '/product/' + p.id + '/',   /* stesso indirizzo del canonical */
        name: (p.n && p.n[L]) || '',
      })),
    },
  });
}

/* LE IMMAGINI di un prodotto, come entità con dimensioni dichiarate. */
export function immagini(p = {}, opt = {}){
  const { base = '', cartella = 'img/', L = 'it' } = opt;
  const abs = u => /^https?:\/\//.test(u) ? u : base + '/' + String(u).replace(/^\/+/, '');
  const lista = [p.img || (cartella + p.id + '.webp'), ...(p.gallery || [])]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  return lista.map(u => compatta({
    '@type': 'ImageObject',
    url: abs(u),
    caption: (p.n && p.n[L]) || '',
  }));
}

/* LE RECENSIONI come entità vere.
   Finora esisteva solo AggregateRating (la media). Le singole recensioni sono
   ciò che i motori AI citano quando qualcuno chiede «ci si può fidare?». */
export function recensioni(lista = [], opt = {}){
  const { L = 'it' } = opt;
  return lista.filter(r => r && r.q).slice(0, 10).map(r => compatta({
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: String(Math.max(1, Math.min(5, +r.st || 5))),
      bestRating: '5', worstRating: '1',
    },
    author: { '@type': 'Person', name: r.w || 'Cliente' },
    reviewBody: pulisci((r.q && r.q[L]) || ''),
    datePublished: r.dt || undefined,
  }));
}

/* LE LAVORAZIONI come servizi offerti.
   Le tecnologie (laser CO₂, MOPA, UV, DTF, 3D) sono ciò che le persone cercano
   davvero — «incisione laser plexiglass» è una query di servizio, non di
   prodotto. Dichiararle come catalogo di servizi copre quelle domande. */
export function servizi(tech = [], opt = {}){
  const { base = '', L = 'it', azienda = 'INGLY DESIGN' } = opt;
  if(!tech.length) return null;
  return compatta({
    '@type': 'OfferCatalog',
    '@id': base + ID.cat,
    name: 'Lavorazioni ' + azienda,
    itemListElement: tech.map(t => ({
      '@type': 'Offer',
      itemOffered: compatta({
        '@type': 'Service',
        name: t.n || '',
        description: pulisci((t.d && t.d[L]) || ''),
        serviceType: t.t || undefined,
        provider: { '@id': base + ID.org },
        areaServed: { '@type': 'Country', name: 'Italia' },
      }),
    })),
  });
}

/* Assembla il grafo: entità distinte, collegate, in un solo blocco JSON-LD.
   Un unico @graph è preferibile a molti <script> separati perché rende
   esplicito che le entità appartengono allo stesso insieme. */
export function grafo(pezzi = [], opt = {}){
  const items = pezzi.filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@graph': items,
  };
}
