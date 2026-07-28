/* Test dello Schema Engine — funzioni pure, nessun browser.
   Verifica ciò che rompe davvero i dati strutturati: entità scollegate,
   campi vuoti, indirizzi inventati e riferimenti @id che non puntano a nulla. */
import * as S from '../assets/js/schema-engine.js';

let ok = 0, ko = 0;
const check = (nome, cond) => { if(cond){ ok++; console.log('  ✔ ' + nome) } else { ko++; console.log('  ✖ ' + nome) } };

const BASE = 'https://www.inglydesign.it';
const cfg = {
  email: 'inglydesign@gmail.com',
  seo: { azienda: 'INGLY DESIGN', descrizione: 'Incisione laser e stampa personalizzata.',
         citta: 'Cesena', regione: 'Emilia-Romagna', paese: 'IT', telefono: '+393296904627' },
};
const social = ['https://instagram.com/ingly_design', 'https://facebook.com/inglydesign', '', 'non-un-indirizzo'];

console.log('\n=== 1. Pulizia ===');
check('rimuove le chiavi vuote', !('vuoto' in S.compatta({ pieno: 'x', vuoto: '' })));
check('rimuove gli oggetti vuoti', !('o' in S.compatta({ o: {}, x: 1 })));
check('rimuove gli elenchi vuoti', !('a' in S.compatta({ a: [], x: 1 })));
check('conserva lo zero (è un valore valido)', S.compatta({ n: 0 }).n === 0);
check('conserva le strutture annidate', S.compatta({ a: { b: { c: 'x' } } }).a.b.c === 'x');

console.log('\n=== 2. Azienda ===');
const org = S.organizzazione(cfg, { base: BASE, social });
check('ha un @id stabile', org['@id'] === BASE + S.ID.org);
check('è una LocalBusiness', org['@type'] === 'LocalBusiness');
check('riporta il nome', org.name === 'INGLY DESIGN');
check('riporta la città', org.address.addressLocality === 'Cesena');
check('scarta i social non validi', org.sameAs.length === 2);
check('tiene solo indirizzi http(s)', org.sameAs.every(u => /^https?:\/\//.test(u)));

console.log('\n=== 3. Sito e ricerca interna ===');
const sito = S.sitoWeb(cfg, { base: BASE });
check('ha un @id stabile', sito['@id'] === BASE + S.ID.sito);
check('è collegato all azienda come editore', sito.publisher['@id'] === BASE + S.ID.org);
check('dichiara una SearchAction', sito.potentialAction['@type'] === 'SearchAction');
check('la ricerca punta a un indirizzo REALE del sito',
  sito.potentialAction.target.urlTemplate === BASE + '/shop?q={search_term_string}');
check('il segnaposto della query è dichiarato',
  /search_term_string/.test(sito.potentialAction['query-input']));

console.log('\n=== 4. Pagina catalogo ===');
const prodotti = [
  { id: 1, n: { it: 'Targa Ufficio' } },
  { id: 2, n: { it: 'Portachiavi Cuore' } },
  { id: 3, n: { it: 'Lampada Luna' } },
];
const coll = S.paginaCollezione(prodotti, { base: BASE, titolo: 'Catalogo' });
check('è una CollectionPage', coll['@type'] === 'CollectionPage');
check('fa parte del sito', coll.isPartOf['@id'] === BASE + S.ID.sito);
check('parla dell azienda', coll.about['@id'] === BASE + S.ID.org);
check('conta i prodotti', coll.mainEntity.numberOfItems === 3);
check('ogni voce ha un indirizzo proprio con id',
  coll.mainEntity.itemListElement.every(x => /\/product\?id=\d+$/.test(x.url)));
check('le posizioni partono da 1', coll.mainEntity.itemListElement[0].position === 1);
check('non dichiara più di 50 voci',
  S.paginaCollezione(Array.from({ length: 80 }, (_, i) => ({ id: i + 1, n: { it: 'P' + i } })), { base: BASE })
    .mainEntity.itemListElement.length === 50);

console.log('\n=== 5. Immagini ===');
const imgs = S.immagini({ id: 7, n: { it: 'Cake Topper' }, img: 'img/7.webp', gallery: ['img/7-g1.webp', 'img/7-g1.webp'] }, { base: BASE });
check('sono ImageObject', imgs.every(i => i['@type'] === 'ImageObject'));
check('gli indirizzi sono assoluti', imgs.every(i => i.url.startsWith('https://')));
check('i doppioni vengono eliminati', imgs.length === 2);
check('hanno la didascalia', imgs[0].caption === 'Cake Topper');
check('senza foto usa il percorso convenzionale',
  S.immagini({ id: 9, n: { it: 'X' } }, { base: BASE })[0].url.endsWith('img/9.webp'));

console.log('\n=== 6. Recensioni ===');
const rev = S.recensioni([
  { q: { it: 'Lavoro impeccabile.' }, st: 5, w: 'Marco', dt: '2026-05-01' },
  { q: { it: 'Molto belli.' }, st: 4, w: 'Anna' },
  { st: 5, w: 'Senza testo' },
], { L: 'it' });
check('scarta le recensioni senza testo', rev.length === 2);
check('sono di tipo Review', rev.every(r => r['@type'] === 'Review'));
check('hanno autore', rev[0].author.name === 'Marco');
check('il voto resta fra 1 e 5',
  S.recensioni([{ q: { it: 'x' }, st: 99, w: 'A' }])[0].reviewRating.ratingValue === '5');
check('una data assente non crea un campo vuoto', !('datePublished' in rev[1]));

console.log('\n=== 7. Lavorazioni come servizi ===');
const srv = S.servizi([
  { n: 'Laser CO₂', t: 'CO₂ · 100W', d: { it: 'Taglio e incisione.' } },
  { n: 'Stampa UV', t: 'UV', d: { it: 'Stampa diretta.' } },
], { base: BASE, azienda: 'INGLY DESIGN' });
check('è un catalogo di offerte', srv['@type'] === 'OfferCatalog');
check('contiene tutte le lavorazioni', srv.itemListElement.length === 2);
check('ogni voce è un Service', srv.itemListElement.every(o => o.itemOffered['@type'] === 'Service'));
check('il fornitore rimanda all azienda',
  srv.itemListElement[0].itemOffered.provider['@id'] === BASE + S.ID.org);
check('senza lavorazioni non produce nulla', S.servizi([], { base: BASE }) === null);

console.log('\n=== 8. Grafo completo ===');
const g = S.grafo([org, sito, coll, srv]);
check('dichiara il contesto schema.org', g['@context'] === 'https://schema.org');
check('raccoglie le entità in @graph', g['@graph'].length === 4);
check('i pezzi assenti vengono ignorati', S.grafo([org, null, undefined, sito])['@graph'].length === 2);
const testo = JSON.stringify(g);
check('è serializzabile in JSON valido', typeof testo === 'string' && JSON.parse(testo)['@graph'].length === 4);
/* Ogni @id richiamato deve esistere fra le entità dichiarate: un riferimento
   a vuoto è l'errore più comune e silenzioso dei dati strutturati. */
const dichiarati = new Set(g['@graph'].map(e => e['@id']).filter(Boolean));
const richiamati = [...testo.matchAll(/"@id":"([^"]+)"/g)].map(m => m[1]);
check('nessun riferimento @id punta a un entità inesistente',
  richiamati.every(r => dichiarati.has(r)));

console.log('\n=== 9. Una sola entità azienda (niente doppioni) ===');
/* Il blocco JSON-LD statico di index.html descrive la stessa azienda. Se i due
   @id divergono, i motori vedono DUE aziende con lo stesso nome — il contrario
   di ciò che serve. Questo test aggancia i due file: se qualcuno cambia l'@id
   in uno dei due senza allineare l'altro, fallisce subito. */
import { readFileSync } from 'node:fs';
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const idAtteso = 'https://www.inglydesign.it' + S.ID.org;
check('index.html usa lo stesso @id azienda del motore',
  indexHtml.includes('"@id":"' + idAtteso + '"'));
check('nessun @id azienda residuo del vecchio schema',
  !indexHtml.includes('/#business"'));
check('gli @id iniziano dopo la barra del dominio',
  S.ID.org.startsWith('/#') && S.ID.sito.startsWith('/#'));

console.log(`\n=========== SCHEMA ENGINE: ${ok} passati, ${ko} falliti ===========\n`);
process.exit(ko ? 1 : 0);
