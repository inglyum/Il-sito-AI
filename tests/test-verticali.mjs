/* Pagine di settore B2B: /business/ristoranti e simili.
   Il valore di queste pagine è tutto nel contenuto che un motore legge senza
   eseguire JavaScript e nel fatto che i prodotti arrivino dal catalogo unico:
   se si scollegassero, resterebbero quattro pagine di parole senza niente da
   comprare — e due elenchi di prodotti da tenere allineati a mano. */
import * as V from '../assets/js/verticali.js';
import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const check = (n, c, x = '') => { if (c) { pass++; console.log('  ✔ ' + n) } else { fail++; console.log('  ✖ ' + n + (x ? ' → ' + x : '')) } };

const P = [
  { id: 11, cat: 'b2b',    n: { it: 'QR Menu Plexiglass per Locale' }, price: 22 },
  { id: 30, cat: 'b2b',    n: { it: 'Set QR Menu Ristorante ×10' },    price: 75 },
  { id: 26, cat: 'b2b',    n: { it: 'Targa Professionale per Ufficio' }, price: 42 },
  { id: 99, cat: 'b2b',    n: { it: 'Prodotto nascosto' }, price: 10, hidden: true },
  { id: 7,  cat: 'eventi', n: { it: 'Cake Topper' }, price: 16 },
];
const RIST = {
  id: 'ristoranti', attivo: true, icona: '🍽',
  n: { it: 'Ristoranti, bar e locali', en: 'Restaurants' },
  titolo: { it: 'Menu QR per il tuo locale', en: 'QR menus for your venue' },
  sottotitolo: { it: 'Menu digitali incisi a laser.', en: 'Laser engraved digital menus.' },
  intro: { it: 'Un menu stampato si sporca.', en: 'A printed menu gets dirty.' },
  prodotti: [30, 11], categorie: ['b2b'],
  servizi: [{ t: { it: 'Menu QR da tavolo' }, d: { it: 'Plexiglass o legno inciso.' } }],
  faq: [[{ it: 'Quanto costa?' }, { it: 'Il set da 10 parte da €75.' }]],
};

console.log('\n=== QUALI SETTORI SONO PUBBLICATI ===');
check('un settore spento non compare', V.attive([RIST, { id: 'x', attivo: false }]).length === 1);
/* l'id finisce in un indirizzo: se contenesse spazi o barre romperebbe il percorso */
check('un id non valido viene scartato',
  V.attive([{ id: 'con spazi', attivo: true }, { id: '../fuga', attivo: true }]).length === 0);
check('si trova il settore per id', V.perId([RIST], 'ristoranti').id === 'ristoranti');
check('un id inesistente non restituisce niente', V.perId([RIST], 'boh') === null);

console.log('\n=== INDIRIZZO ===');
/* sotto /business, non in un ramo separato: l'autorità della sezione resta una */
check('sta sotto la pagina Business',
  V.indirizzo(RIST, 'https://x.it') === 'https://x.it/business/ristoranti');
check('non raddoppia la barra finale della base',
  V.indirizzo(RIST, 'https://x.it/') === 'https://x.it/business/ristoranti');

console.log('\n=== PRODOTTI DAL CATALOGO UNICO ===');
const lista = V.prodottiDi(RIST, P);
check('i prodotti scelti a mano vengono per primi, nell\'ordine indicato',
  lista[0].id === 30 && lista[1].id === 11);
check('poi arrivano quelli della categoria collegata', lista.some(p => p.id === 26));
check('un prodotto nascosto non compare', !lista.some(p => p.id === 99));
check('nessun doppione', new Set(lista.map(p => p.id)).size === lista.length);
check('i prodotti di altre categorie restano fuori', !lista.some(p => p.id === 7));
check('si può limitare quanti mostrarne', V.prodottiDi(RIST, P, { max: 2 }).length === 2);

console.log('\n=== TESTI E LINGUE ===');
check('legge la lingua richiesta', V.lingua(RIST.n, 'en') === 'Restaurants');
/* se manca la traduzione meglio l'italiano che una pagina vuota */
check('senza traduzione ripiega sull\'italiano',
  V.lingua({ it: 'solo italiano' }, 'en') === 'solo italiano');
check('una stringa semplice passa intatta', V.lingua('testo', 'it') === 'testo');
/* mai restituire l'oggetto: finirebbe stampato come [object Object] */
check('non restituisce mai un oggetto', typeof V.lingua(RIST.n, 'it') === 'string');
check('un valore assente diventa stringa vuota', V.lingua(null) === '');

console.log('\n=== TITOLO E DESCRIZIONE PER I MOTORI ===');
const m = V.meta(RIST, { L: 'it', azienda: 'INGLY DESIGN', citta: 'Cesena' });
check('il titolo nasce dal titolo del settore', /Menu QR per il tuo locale/.test(m.titolo));
check('il titolo porta il nome dell\'azienda', /INGLY DESIGN/.test(m.titolo));
check('la descrizione non è vuota', m.descrizione.length > 20, m.descrizione);
/* un titolo scritto a mano deve vincere sul modello */
check('un titolo scritto a mano ha la precedenza',
  V.meta({ ...RIST, seoTitolo: { it: 'Mio titolo' } }, { L: 'it' }).titolo === 'Mio titolo');

console.log('\n=== CONTENUTO PER CHI NON ESEGUE JAVASCRIPT ===');
const html = V.corpo(RIST, { L: 'it', base: 'https://x.it', prodotti: P });
check('c\'è un solo titolo principale', (html.match(/<h1>/g) || []).length === 1);
check('il titolo è quello del settore', /<h1>Menu QR per il tuo locale<\/h1>/.test(html));
check('contiene il testo introduttivo', /menu stampato si sporca/.test(html));
check('elenca i servizi del settore', /Menu QR da tavolo/.test(html));
check('elenca i prodotti con il prezzo', /Set QR Menu Ristorante/.test(html) && /€75/.test(html));
check('i prodotti sono collegati alla loro scheda', /href="https:\/\/x\.it\/product\/30\/"/.test(html));
check('riporta le domande frequenti del settore', /Quanto costa\?/.test(html));
/* i testi li scrive una persona nell'Admin: devono restare testo */
const cattivo = { ...RIST, titolo: { it: '<script>alert(1)</script>' } };
check('il testo scritto nell\'Admin non diventa codice',
  !/<script>/.test(V.corpo(cattivo, { L: 'it' })));

console.log('\n=== DATI STRUTTURATI ===');
const sc = V.schema(RIST, { L: 'it', base: 'https://x.it', azienda: 'INGLY DESIGN' });
const servizio = sc.find(x => x['@type'] === 'Service');
check('dichiara il servizio offerto al settore', !!servizio);
check('il servizio ha il suo indirizzo', servizio.url === 'https://x.it/business/ristoranti');
/* senza provider un motore legge un servizio che non si sa chi offra */
check('il servizio è agganciato all\'azienda del grafo',
  servizio.provider && /#organizzazione/.test(servizio.provider['@id']),
  JSON.stringify(servizio.provider));
check('i servizi diventano un catalogo di offerte',
  servizio.hasOfferCatalog && servizio.hasOfferCatalog.itemListElement.length === 1);
const faq = sc.find(x => x['@type'] === 'FAQPage');
check('le domande diventano dati strutturati', !!faq && faq.mainEntity.length === 1);
check('senza domande non si dichiara una FAQ vuota',
  !V.schema({ ...RIST, faq: [] }, { base: 'https://x.it' }).some(x => x['@type'] === 'FAQPage'));
const br = V.briciole(RIST, { L: 'it', base: 'https://x.it' });
check('le briciole sono Home › Business › Settore', br.itemListElement.length === 3);
check('l\'ultima briciola è il settore',
  br.itemListElement[2].item === 'https://x.it/business/ristoranti');

console.log('\n=== I DATI PUBBLICATI ===');
const contenuti = JSON.parse(readFileSync('data/content.json', 'utf8'));
const prodotti = JSON.parse(readFileSync('data/products.json', 'utf8'));
const vere = V.attive(contenuti.VERTICALI || []);
check('ci sono settori pubblicati', vere.length > 0, vere.length + ' settori');
for (const v of vere) {
  const nome = v.id;
  check(nome + ': ha un titolo', !!V.lingua(v.titolo, 'it'));
  check(nome + ': ha una traduzione inglese', !!V.lingua(v.titolo, 'en') && V.lingua(v.titolo, 'en') !== V.lingua(v.titolo, 'it'));
  check(nome + ': ha almeno un servizio', (v.servizi || []).length > 0);
  check(nome + ': ha almeno tre domande', (v.faq || []).length >= 3, (v.faq || []).length);
  /* una pagina di settore senza prodotti è una pagina che non vende */
  check(nome + ': mostra prodotti veri del catalogo',
    V.prodottiDi(v, prodotti).length > 0, V.prodottiDi(v, prodotti).length + ' prodotti');
}

console.log(`\n=========== SETTORI B2B: ${pass} passati, ${fail} falliti ===========`);
process.exit(fail ? 1 : 0);
