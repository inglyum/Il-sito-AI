/* Test del pre-render — funzioni pure, nessun browser.
   Il rischio vero: una pagina generata che sembra giusta ma è rotta per il
   browser (percorsi relativi sbagliati, due <title>, due pagine attive) o
   vuota per i crawler che non eseguono JavaScript. */
import { readFileSync } from 'node:fs';
import * as PR from '../assets/js/prerender.mjs';

let ok = 0, ko = 0;
const check = (nome, cond) => { if(cond){ ok++; console.log('  ✔ ' + nome) } else { ko++; console.log('  ✖ ' + nome) } };

const BASE = 'https://www.inglydesign.it';
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const p = {
  id: 7, price: 34.99, prod: 3, sku: 'ING-007', mat: 'Legno',
  n: { it: 'Cake Topper Matrimonio', en: 'Wedding Cake Topper' },
  desc: { it: 'Cake topper in <b>plexiglass</b> inciso al laser.' },
  img: 'img/7.webp', gallery: ['img/7-g1.webp'],
  misure: [['Larghezza', '20 cm'], ['Altezza', '15 cm']],
};
const opt = { L: 'it', base: BASE, categoria: 'Eventi', materiale: 'Legno', cartella: 'img/' };

console.log('\n=== 1. Indirizzi ===');
check('percorso file', PR.percorsoProdotto(7) === 'product/7/index.html');
check('indirizzo pubblico', PR.urlProdotto(7, BASE) === BASE + '/product/7/');
check('prezzo in formato italiano', PR.prezzoEur(34.99) === '€34,99');
check('prezzo intero con i decimali', PR.prezzoEur(50) === '€50,00');

console.log('\n=== 2. Contenuto leggibile senza JavaScript ===');
const c = PR.contenutoProdotto(p, opt);
check('il nome è in un h1', /<h1>Cake Topper Matrimonio<\/h1>/.test(c));
check('il prezzo è scritto', c.includes('€34,99'));
check('la descrizione è presente', c.includes('Cake topper in plexiglass inciso al laser.'));
check('l HTML della descrizione è ripulito', !/<b>/.test(c));
check('materiale dichiarato', /Materiale:<\/strong> Legno/.test(c));
check('categoria dichiarata', /Categoria:<\/strong> Eventi/.test(c));
check('misure riportate', c.includes('20 cm') && c.includes('15 cm'));
check('immagini presenti', (c.match(/<img /g) || []).length === 2);
check('le immagini hanno alt descrittivo', /alt="Cake Topper Matrimonio — Legno"/.test(c));
check('c è un percorso di navigazione', /Catalogo/.test(c));
check('il blocco è identificabile per la rimozione', /id="prerender"/.test(c));

console.log('\n=== 3. Sicurezza del testo ===');
const cattivo = PR.contenutoProdotto(
  { id: 9, price: 1, n: { it: '<script>alert(1)</script>' }, desc: { it: 'x" onload="y' } },
  { ...opt, categoria: '', materiale: '' });
check('niente tag script iniettabili dal nome', !/<script>/.test(cattivo));
check('le virgolette negli attributi sono neutralizzate', !/onload="y/.test(cattivo));

console.log('\n=== 4. Intestazione ===');
const t = PR.testaProdotto(p, { ...opt, titolo: 'Cake Topper — INGLY', descrizione: 'Descrizione breve', jsonld: { '@context': 'https://schema.org', '@type': 'Product' } });
check('il tag base è il primo elemento', t.trim().startsWith('<base href="../../">'));
check('titolo impostato', t.includes('<title>Cake Topper — INGLY</title>'));
check('canonical con indirizzo del prodotto', t.includes('href="' + BASE + '/product/7/"'));
check('og:url coerente col canonical', t.includes('content="' + BASE + '/product/7/"'));
check('og:type è product', t.includes('content="product"'));
check('immagine social assoluta', t.includes('content="' + BASE + '/img/7.webp"'));
check('JSON-LD incluso', t.includes('application/ld+json'));
check('il JSON-LD non può chiudere lo script', !/<\/script>\s*[^<]*<\/script>/.test(t.replace('</script>', '')));

console.log('\n=== 5. Pagina completa ===');
const html = PR.paginaProdotto(index, p, { ...opt, titolo: 'Cake Topper Matrimonio — INGLY DESIGN', descrizione: 'Descrizione breve' });
const testa = html.slice(0, html.indexOf('</head>'));
check('un solo <title>', (testa.match(/<title>/g) || []).length === 1);
check('il titolo è quello del prodotto', /<title>Cake Topper Matrimonio — INGLY DESIGN<\/title>/.test(testa));
check('un solo canonical', (testa.match(/rel="canonical"/g) || []).length === 1);
check('il canonical punta al prodotto', testa.includes(BASE + '/product/7/'));
check('una sola descrizione', (testa.match(/name="description"/g) || []).length === 1);
check('un solo og:url', (testa.match(/property="og:url"/g) || []).length === 1);
check('un solo tag base', (html.match(/<base /g) || []).length === 1);
check('il base precede i riferimenti agli assets',
  html.indexOf('<base ') < html.indexOf('assets/'));

console.log('\n=== 6. Coerenza con l applicazione ===');
check('la pagina prodotto è attiva', /<section class="page active" id="page-product">/.test(html));
check('la home NON è più attiva', !/<section class="page active" id="page-home">/.test(html));
check('una sola pagina attiva', (html.match(/class="page active"/g) || []).length === 1);
check('il contenuto è dentro la pagina prodotto',
  html.indexOf('id="prerender"') > html.indexOf('id="page-product"'));
check('gli script dell applicazione restano', html.includes('assets/js/app.js'));
check('il guscio non è stato troncato', html.includes('</html>'));
check('il contenuto è davvero nell HTML servito',
  html.includes('Cake Topper Matrimonio') && html.includes('€34,99'));

console.log('\n=== 7. Robustezza ===');
const minimo = PR.paginaProdotto(index, { id: 99, price: 0, n: { it: 'Minimo' } }, { base: BASE });
check('regge un prodotto senza descrizione né foto', minimo.includes('Minimo') && minimo.includes('</html>'));
check('nessun «undefined» finito nella pagina', !/undefined/.test(PR.contenutoProdotto({ id: 5, price: 9, n: { it: 'X' } }, { base: BASE })));

console.log(`\n=========== PRE-RENDER: ${ok} passati, ${ko} falliti ===========\n`);
process.exit(ko ? 1 : 0);
