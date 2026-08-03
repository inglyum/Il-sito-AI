/* Prezzi in vetrina, oppure «contattaci».
   Il rischio non è mostrare un'etichetta al posto di un numero: è che una
   configurazione vecchia, vuota o storta spenga i prezzi di un negozio che
   vive di prezzi. Per questo la maggior parte dei controlli qui riguarda
   il caso «dato strano → i prezzi restano visibili». */
import * as PR from '../assets/js/prezzi.js';
import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const check = (n, c, x = '') => { if (c) { pass++; console.log('  ✔ ' + n) } else { fail++; console.log('  ✖ ' + n + (x ? ' → ' + x : '')) } };

const ACCESO  = { prezzi: { mostra: true } };
const SPENTO  = { prezzi: { mostra: false } };

console.log('\n=== I PREZZI NON SI SPENGONO PER SBAGLIO ===');
check('nessuna configurazione → prezzi visibili', PR.mostraPrezzi());
check('configurazione vuota → prezzi visibili', PR.mostraPrezzi({}));
check('sezione prezzi vuota → prezzi visibili', PR.mostraPrezzi({ prezzi: {} }));
check('prezzi non è un oggetto → prezzi visibili', PR.mostraPrezzi({ prezzi: 'no' }));
check('mostra assente → prezzi visibili', PR.mostraPrezzi({ prezzi: { testo: {} } }));
check('mostra nullo → prezzi visibili', PR.mostraPrezzi({ prezzi: { mostra: null } }));
check('mostra undefined → prezzi visibili', PR.mostraPrezzi({ prezzi: { mostra: undefined } }));
/* la stringa "false" arriva da una casella HTML letta male: NON è un no */
check('la stringa "false" non spegne niente', PR.mostraPrezzi({ prezzi: { mostra: 'false' } }));
check('lo zero non spegne niente', PR.mostraPrezzi({ prezzi: { mostra: 0 } }));
check('solo un false vero li spegne', !PR.mostraPrezzi(SPENTO));

console.log('\n=== LE ETICHETTE ===');
check('etichetta predefinita in italiano', PR.etichetta({}, 'it') === 'Prezzo su richiesta');
check('etichetta predefinita in inglese', PR.etichetta({}, 'en') === 'Price on request');
check('etichetta personalizzata',
  PR.etichetta({ prezzi: { testo: { it: 'Chiedi un preventivo' } } }, 'it') === 'Chiedi un preventivo');
/* l'admin compila l'italiano e dimentica l'inglese: meglio l'italiano del vuoto */
check('inglese mancante ripiega sull\'italiano',
  PR.etichetta({ prezzi: { testo: { it: 'Su misura' } } }, 'en') === 'Price on request');
check('una lingua sconosciuta non lascia il vuoto', PR.etichetta({}, 'de').length > 0);
check('testo non oggetto → predefiniti', PR.etichetta({ prezzi: { testo: 'ciao' } }, 'it') === 'Prezzo su richiesta');
check('pulsante predefinito', PR.etichettaAzione({}, 'it') === 'Richiedi il prezzo');
check('pulsante personalizzato',
  PR.etichettaAzione({ prezzi: { azione: { it: 'Parliamone' } } }, 'it') === 'Parliamone');

console.log('\n=== IL TESTO AL POSTO DELLA CIFRA ===');
const eur = n => '€' + Number(n || 0).toFixed(2);
check('con i prezzi accesi si vede la cifra', PR.testoPrezzo(29.9, ACCESO, { eur }) === '€29.90');
check('con i prezzi spenti si vede l\'etichetta', PR.testoPrezzo(29.9, SPENTO, { eur }) === 'Prezzo su richiesta');
/* il caso che tradirebbe l'utente: un totale a zero sembra un regalo */
check('il totale spento non diventa mai «€0.00»', PR.testoTotale(0, SPENTO, { eur }) !== '€0.00');
check('il totale acceso resta un totale', PR.testoTotale(120, ACCESO, { eur }) === '€120.00');
check('senza formattatore non esplode', typeof PR.testoPrezzo(5, ACCESO) === 'string');
check('un prezzo mancante non stampa NaN', !/NaN/.test(PR.testoPrezzo(undefined, ACCESO, { eur })));

console.log('\n=== DATI STRUTTURATI PER GOOGLE ===');
const prod = { price: 29.9 };
const offAcc = PR.offertaSchema(prod, ACCESO, { url: 'https://x.it/p/1' });
check('con i prezzi accesi l\'offerta dichiara la cifra', offAcc.price === 29.9 && offAcc.priceCurrency === 'EUR');
const offSpe = PR.offertaSchema(prod, SPENTO, { url: 'https://x.it/p/1' });
/* Google sanziona un prezzo nei dati che non compare sulla pagina */
check('con i prezzi spenti NON dichiara nessuna cifra',
  offSpe.price === undefined && offSpe.priceCurrency === undefined, JSON.stringify(offSpe));
check('il prodotto resta comunque un\'offerta valida',
  offSpe['@type'] === 'Offer' && offSpe.availability.includes('InStock') && offSpe.url === 'https://x.it/p/1');
check('il venditore resta collegato',
  PR.offertaSchema(prod, SPENTO, { venditore: { '@id': 'x#org' } }).seller['@id'] === 'x#org');
check('un prodotto esaurito è dichiarato esaurito',
  PR.offertaSchema(prod, ACCESO, { disponibile: false }).availability.includes('OutOfStock'));

console.log('\n=== IL SITO USA DAVVERO L\'INTERRUTTORE ===');
const prodotti = readFileSync('assets/js/products.js', 'utf8');
check('la scheda prodotto passa dall\'interruttore', /prezzo\(x\.price\)/.test(prodotti));
check('il carrello passa dall\'interruttore', /drTotal'\)\.textContent=prezzo\(/.test(prodotti));
check('il subtotale passa dall\'interruttore', /drSubtotal'\); if\(subEl\) subEl\.textContent=prezzo\(/.test(prodotti));
/* senza prezzi il pulsante «+ €29.90» del catalogo non ha senso */
check('il pulsante rapido sparisce senza prezzi', /!prezziVisibili\(\)\)\?'':`<button class="qadd"/.test(prodotti));
check('l\'ordinamento per prezzo sparisce senza prezzi', /o\[0\]!=='pa'&&o\[0\]!=='pd'/.test(prodotti));
check('il messaggio WhatsApp non spedisce cifre inventate',
  /prezziVisibili\(\)\?' — '\+eur/.test(prodotti));
check('senza prezzi non si accumulano punti su un totale che non c\'è',
  /pts = prezziVisibili\(\)\?Math\.floor\(total\):0/.test(prodotti));
const seo = readFileSync('assets/js/seo.js', 'utf8');
check('i dati strutturati del sito seguono l\'interruttore', /PR\.mostraPrezzi\(CONFIG\)/.test(seo));
const pre = readFileSync('scripts/prerender.mjs', 'utf8');
check('le pagine prerenderizzate seguono l\'interruttore', /PR\.offertaSchema\(/.test(pre));
const wl = readFileSync('assets/js/wishlist.js', 'utf8');
check('la wishlist segue l\'interruttore', /PR\.testoPrezzo\(/.test(wl));
const main = readFileSync('assets/js/main.js', 'utf8');
check('la scelta è applicata prima del primo disegno', /classList\.toggle\('senza-prezzi'/.test(main));

console.log('\n=== IL CSS ===');
const css = readFileSync('assets/css/components.css', 'utf8').replace(/\s+/g, '');
check('esiste lo stile dell\'etichetta', /\.price--rich/.test(css));
check('il filtro «prezzo massimo» sparisce', /senza-prezzi\.fgroup:has\(#pRange\)\{display:none/.test(css));
check('il prezzo unitario «cad.» sparisce', /senza-prezzi\.di-unit/.test(css));
/* la rete di sicurezza delle foto non deve essere stata toccata */
check('la rete di sicurezza delle foto è intatta', /img\.pimgph,img\.gimg,img\.bimg\{opacity:1!important\}/.test(css));

console.log('\n=== L\'ADMIN ===');
const admin = readFileSync('admin.html', 'utf8');
check('esiste il pannello', /id="v-prezzi"/.test(admin));
check('c\'è la voce nel menu', /\['prezzi','🏷','Prezzi in vetrina'\]/.test(admin));
check('il pannello viene disegnato quando si apre', /prezzi:renderPrezzi/.test(admin));
check('i dati vengono riparati al caricamento', /S\.CONFIG\.prezzi\.mostra=S\.CONFIG\.prezzi\.mostra!==false/.test(admin));
check('l\'admin avvisa che il carrello cambia natura', /richiesta di preventivo/.test(admin));
check('c\'è un\'anteprima', /pzDisegnaAnteprima/.test(admin));

console.log('\n=== I DATI PUBBLICATI ===');
const cfg = JSON.parse(readFileSync('data/config.json', 'utf8'));
check('config.json dichiara la sezione prezzi', !!cfg.prezzi);
check('la configurazione pubblicata è leggibile', typeof PR.mostraPrezzi(cfg) === 'boolean');

console.log(`\n=========== PREZZI: ${pass} passati, ${fail} falliti ===========`);
process.exit(fail ? 1 : 0);
