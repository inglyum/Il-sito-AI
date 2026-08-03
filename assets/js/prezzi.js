/* ============ PREZZI IN VETRINA, OPPURE NO ============
   Un interruttore nell'Admin decide se il catalogo mostra i prezzi oppure
   invita a chiedere.

   Perché serve: su una lavorazione personalizzata il prezzo esposto è spesso
   una promessa che non si può mantenere — dipende da quantità, materiale,
   grafica, tempi. Chi lavora su misura preferisce parlare prima. Ma è una
   scelta che cambia nel tempo e per stagione, quindi deve stare nell'Admin,
   non nel codice.

   Il punto delicato non è nascondere i numeri: è che quando i prezzi non ci
   sono, «Aggiungi al carrello» non ha più senso. Un carrello che non sa dire
   quanto costa il totale è un vicolo cieco. Con i prezzi spenti ogni azione
   di acquisto diventa una richiesta di preventivo, e il carrello diventa un
   elenco di cose su cui farsi fare un prezzo.

   Predefinito: prezzi VISIBILI. Chi non tocca niente non vede cambiare nulla.

   Funzioni pure, nessun DOM: verificabili in tests/test-prezzi.mjs. */

const TESTO_PREDEFINITO = {
  it: 'Prezzo su richiesta',
  en: 'Price on request',
};
const AZIONE_PREDEFINITA = {
  it: 'Richiedi il prezzo',
  en: 'Request a price',
};

/* La configurazione buona, comunque siano i dati.
   Un valore mancante o strano non deve MAI far sparire i prezzi per sbaglio:
   si nascondono solo se qualcuno lo ha chiesto per davvero. */
export function impostazioni(config = {}){
  const p = (config && typeof config.prezzi === 'object' && config.prezzi) || {};
  return {
    mostra: p.mostra !== false,                    /* solo un false esplicito li spegne */
    testo: { ...TESTO_PREDEFINITO, ...(p.testo && typeof p.testo === 'object' ? p.testo : {}) },
    azione: { ...AZIONE_PREDEFINITA, ...(p.azione && typeof p.azione === 'object' ? p.azione : {}) },
  };
}

export function mostraPrezzi(config = {}){
  return impostazioni(config).mostra;
}

/* «Prezzo su richiesta» nella lingua giusta, con l'italiano di riserva. */
export function etichetta(config = {}, L = 'it'){
  const t = impostazioni(config).testo;
  return t[L] || t.it || TESTO_PREDEFINITO.it;
}

/* Il testo del pulsante che sostituisce «Aggiungi al carrello». */
export function etichettaAzione(config = {}, L = 'it'){
  const a = impostazioni(config).azione;
  return a[L] || a.it || AZIONE_PREDEFINITA.it;
}

/* Il prezzo da scrivere: la cifra, oppure l'invito a chiedere.
   `eur` arriva da fuori perché la formattazione dei numeri vive già in
   utils.js e non ha senso duplicarla qui. */
export function testoPrezzo(valore, config = {}, opt = {}){
  const { L = 'it', eur = n => '€' + Number(n || 0).toFixed(2) } = opt;
  if(!mostraPrezzi(config)) return etichetta(config, L);
  return eur(valore);
}

/* Con i prezzi spenti il carrello non può dire un totale: al suo posto va
   l'etichetta, non «€0,00» — che sarebbe una bugia. */
export function testoTotale(valore, config = {}, opt = {}){
  return testoPrezzo(valore, config, opt);
}

/* Un prodotto senza prezzo pubblico non può dichiarare un'offerta con prezzo
   nei dati strutturati. Dichiararlo a zero sarebbe un dato falso, e Google
   sanziona i prezzi che non corrispondono alla pagina. Si dichiara invece che
   il prodotto esiste ed è disponibile, senza cifra. */
export function offertaSchema(prodotto = {}, config = {}, opt = {}){
  const { url = '', valuta = 'EUR', venditore = null, disponibile = true } = opt;
  const base = {
    '@type': 'Offer',
    availability: disponibile ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url,
  };
  if(venditore) base.seller = venditore;
  if(!mostraPrezzi(config)) return base;           /* nessuna cifra dichiarata */
  return { ...base, price: prodotto.price, priceCurrency: valuta };
}
