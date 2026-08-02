/* ============ PAGINE DI SETTORE (B2B) ============
   Una pagina per ogni tipo di cliente aziendale: ristoranti, uffici e studi,
   hotel, eventi.

   Perché esistono, invece di un secondo negozio «per le aziende»:
   nessuno cerca «catalogo B2B». Un ristoratore cerca «menu qr personalizzato
   ristorante», un dentista «targa studio medico plexiglass». Sono ricerche
   diverse, con parole diverse, e vanno intercettate con una pagina che parli
   quella lingua. Il catalogo invece resta uno solo: la stessa targa la compra
   sia lo studio sia il privato, e duplicarla significherebbe doppio lavoro per
   chi la gestisce e contenuti doppi per Google.

   Ogni pagina pesca i prodotti dal catalogo unico — per id oppure per
   categoria — quindi non c'è niente da tenere allineato a mano: se un prodotto
   cambia nome o prezzo, cambia dappertutto.

   Funzioni pure: nessun DOM, nessun filesystem. Verificabili in
   tests/test-verticali.mjs. */

const esc = t => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const testo = t => String(t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* Un testo può essere una stringa o una coppia {it,en}: la lingua richiesta,
   con l'italiano come rete di sicurezza. Restituisce sempre una stringa —
   mai l'oggetto, che finirebbe stampato come [object Object]. */
export function lingua(v, L = 'it'){
  if(v == null) return '';
  if(typeof v === 'string') return v;
  return String(v[L] || v.it || v.en || '');
}

/* Solo i settori accesi e con un identificativo utilizzabile in un indirizzo. */
export function attive(lista = []){
  return (lista || []).filter(v =>
    v && v.attivo !== false && /^[a-z0-9-]+$/.test(String(v.id || '')));
}

export function perId(lista = [], id){
  return attive(lista).find(v => v.id === id) || null;
}

/* /business/ristoranti — sotto la pagina Business, non un ramo separato:
   l'autorità della sezione resta una sola. */
export function indirizzo(v, base = ''){
  return String(base || '').replace(/\/+$/, '') + '/business/' + (v && v.id ? v.id : '');
}

/* I prodotti del settore: quelli scelti a mano (nell'ordine indicato) più
   quelli delle categorie collegate. Niente nascosti, niente doppioni. */
export function prodottiDi(v = {}, prodotti = [], opt = {}){
  const max = opt.max != null ? opt.max : 8;
  const visibili = (prodotti || []).filter(p => p && !p.hidden);
  const presi = [];
  const visti = new Set();

  for(const id of (v.prodotti || [])){
    const p = visibili.find(x => x.id === Number(id));
    if(p && !visti.has(p.id)){ visti.add(p.id); presi.push(p) }
  }
  for(const cat of (v.categorie || [])){
    for(const p of visibili.filter(x => x.cat === cat)){
      if(!visti.has(p.id)){ visti.add(p.id); presi.push(p) }
    }
  }
  return presi.slice(0, max);
}

/* Titolo e descrizione per i motori di ricerca. Se non sono scritti a mano si
   compongono dai testi della pagina: meglio un titolo derivato che un titolo
   vuoto, che vale come non averlo. */
export function meta(v = {}, opt = {}){
  const { L = 'it', azienda = 'INGLY DESIGN', citta = '' } = opt;
  const nome = lingua(v.n, L);
  const titolo = lingua(v.seoTitolo, L) ||
    (lingua(v.titolo, L) || nome) + ' — ' + azienda + (citta ? ' · ' + citta : '');
  const descrizione = testo(lingua(v.seoDescrizione, L)) ||
    testo(lingua(v.sottotitolo, L)) || testo(lingua(v.intro, L));
  return { titolo, descrizione };
}

/* Il corpo leggibile della pagina, per chi non esegue JavaScript.
   Deve contenere i fatti che un motore cita: per chi è, cosa produciamo,
   quali prodotti, a che prezzo, e le domande che quel settore fa davvero. */
export function corpo(v = {}, opt = {}){
  const { L = 'it', prodotti = [], base = '', prezzo = n => '€' + Number(n || 0).toFixed(2) } = opt;
  const righe = [];
  const nome = lingua(v.n, L);
  righe.push('<h1>' + esc(lingua(v.titolo, L) || nome) + '</h1>');

  const sotto = testo(lingua(v.sottotitolo, L));
  if(sotto) righe.push('<p>' + esc(sotto) + '</p>');
  const intro = testo(lingua(v.intro, L));
  if(intro) righe.push('<p>' + esc(intro) + '</p>');

  const servizi = (v.servizi || []).filter(s => s && lingua(s.t, L));
  if(servizi.length){
    righe.push('<h2>' + esc(L === 'it' ? 'Cosa produciamo per ' + nome.toLowerCase() : 'What we make') + '</h2><ul>' +
      servizi.map(s => '<li><b>' + esc(lingua(s.t, L)) + '</b>' +
        (testo(lingua(s.d, L)) ? ' — ' + esc(testo(lingua(s.d, L))) : '') + '</li>').join('') + '</ul>');
  }

  const lista = prodottiDi(v, prodotti, opt);
  if(lista.length){
    righe.push('<h2>' + esc(L === 'it' ? 'Prodotti per il settore' : 'Products for this sector') + '</h2><ul>' +
      lista.map(p => '<li><a href="' + esc(String(base).replace(/\/+$/, '') + '/product/' + p.id + '/') + '">' +
        esc(lingua(p.n, L)) + '</a> — ' + esc(prezzo(p.price)) + '</li>').join('') + '</ul>');
  }

  const faq = (v.faq || []).filter(f => Array.isArray(f) && lingua(f[0], L));
  if(faq.length){
    righe.push('<h2>' + esc(L === 'it' ? 'Domande frequenti' : 'FAQ') + '</h2>' +
      faq.map(f => '<h3>' + esc(lingua(f[0], L)) + '</h3><p>' + esc(testo(lingua(f[1], L))) + '</p>').join(''));
  }
  return righe.join('\n');
}

/* Dati strutturati: il servizio offerto a quel settore, e le FAQ della pagina.
   Il servizio è agganciato con @id all'azienda già dichiarata nel grafo, così
   un motore sa CHI lo offre invece di leggere un'entità isolata. */
export function schema(v = {}, opt = {}){
  const { L = 'it', base = '', azienda = 'INGLY DESIGN', idAzienda = '/#organizzazione', area = 'IT' } = opt;
  const nome = lingua(v.n, L);
  const url = indirizzo(v, base);
  const fuori = [];

  const servizio = {
    '@type': 'Service',
    '@id': url + '#servizio',
    name: lingua(v.titolo, L) || nome,
    serviceType: nome,
    url,
    provider: { '@id': String(base).replace(/\/+$/, '') + idAzienda },
    areaServed: area,
  };
  const desc = testo(lingua(v.sottotitolo, L)) || testo(lingua(v.intro, L));
  if(desc) servizio.description = desc;

  const servizi = (v.servizi || []).filter(s => s && lingua(s.t, L));
  if(servizi.length){
    servizio.hasOfferCatalog = {
      '@type': 'OfferCatalog', name: nome,
      itemListElement: servizi.map(s => ({
        '@type': 'Offer', itemOffered: { '@type': 'Service', name: lingua(s.t, L) } })),
    };
  }
  fuori.push(servizio);

  const faq = (v.faq || []).filter(f => Array.isArray(f) && lingua(f[0], L) && lingua(f[1], L));
  if(faq.length){
    fuori.push({
      '@type': 'FAQPage', '@id': url + '#faq',
      mainEntity: faq.map(f => ({
        '@type': 'Question', name: lingua(f[0], L),
        acceptedAnswer: { '@type': 'Answer', text: testo(lingua(f[1], L)) } })),
    });
  }
  return fuori;
}

/* Briciole di pane: Home › Business › Settore. */
export function briciole(v = {}, opt = {}){
  const { L = 'it', base = '' } = opt;
  const b = String(base).replace(/\/+$/, '');
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: b + '/' },
      { '@type': 'ListItem', position: 2, name: 'Business', item: b + '/business' },
      { '@type': 'ListItem', position: 3, name: lingua(v.n, L), item: indirizzo(v, base) },
    ],
  };
}
