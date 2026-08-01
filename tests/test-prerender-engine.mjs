/* Test del generatore di pagine statiche.
   Il rischio qui è doppio: (1) generare HTML rotto o con testo non protetto,
   (2) generare pagine che, aperte da /product/7/, non trovano più CSS e JS
   perché i percorsi relativi puntano un livello troppo in basso. */
import * as P from '../assets/js/prerender-engine.js';

let ok = 0, ko = 0;
const check = (n, c) => { if(c){ ok++; console.log('  ✔ ' + n) } else { ko++; console.log('  ✖ ' + n) } };

const BASE = 'https://www.inglydesign.it';
const prodotto = {
  id: 7, n: { it: 'Cake Topper Matrimonio' }, desc: { it: 'Topper in plexiglass <b>inciso</b>.' },
  price: 34.99, prod: 3, sku: 'ING-007', mat: 'Plexiglass',
  misure: [['Larghezza', '20 cm'], ['Altezza', '15 cm']],
};

console.log('\n=== 1. Prezzo ===');
check('formato italiano', P.prezzo(34.99) === '€34,99');
check('due decimali', P.prezzo(30) === '€30,00');
check('valore assente', P.prezzo(undefined) === '€0,00');

console.log('\n=== 2. Indirizzi ===');
check('home', P.indirizzo('home', { base: BASE }) === BASE + '/');
check('pagina', P.indirizzo('shop', { base: BASE }) === BASE + '/shop');
check('prodotto a percorso', P.indirizzo('product', { base: BASE, id: 7 }) === BASE + '/product/7/');
check('prodotto senza id non inventa nulla',
  P.indirizzo('product', { base: BASE }) === BASE + '/product');

console.log('\n=== 3. Contenuto del prodotto ===');
const c = P.corpoProdotto(prodotto, { L: 'it', categoria: 'Eventi', materiale: 'Plexiglass' });
check('un solo h1', (c.match(/<h1>/g) || []).length === 1);
check('contiene il nome', c.includes('Cake Topper Matrimonio'));
check('contiene il prezzo', c.includes('€34,99'));
check('contiene il materiale', c.includes('Plexiglass'));
check('contiene i tempi di produzione', /3 giorni/.test(c));
check('singolare corretto per un giorno',
  /1 giorno<|1 giorno /.test(P.corpoProdotto({ ...prodotto, prod: 1 }, {})));
check('contiene le misure', c.includes('20 cm') && c.includes('Altezza'));
check('il markup nella descrizione viene rimosso', !c.includes('<b>'));
check('il testo della descrizione resta', c.includes('inciso'));
check('senza misure non produce tabella vuota',
  !P.corpoProdotto({ id: 1, n: { it: 'X' } }, {}).includes('<table>'));

console.log('\n=== 4. Protezione del testo (XSS) ===');
const cattivo = P.corpoProdotto(
  { id: 9, n: { it: '<script>alert(1)</script>' }, desc: { it: '"><img onerror=x>' } }, {});
check('niente script iniettabili', !/<script/i.test(cattivo));
check('le virgolette sono protette', !/"><img/.test(cattivo));
check('i segni minori sono convertiti', cattivo.includes('&lt;'));

console.log('\n=== 5. Contenuto delle pagine ===');
const shop = P.corpoPagina('shop', { base: BASE, titolo: 'Catalogo',
  prodotti: [{ id: 1, n: { it: 'Targa' }, price: 10 }, { id: 2, n: { it: 'Lampada' }, price: 20 }],
  categorie: [{ id: 'casa', n: { it: 'Casa' } }] });
check('elenca i prodotti', shop.includes('Targa') && shop.includes('Lampada'));
check('i link usano il percorso nuovo', shop.includes('/product/1/'));
check('elenca le categorie', shop.includes('Casa'));
check('una pagina senza elenchi resta valida',
  P.corpoPagina('faq', { titolo: 'FAQ' }).includes('<h1>FAQ</h1>'));

console.log('\n=== 6. Composizione nel guscio ===');
const guscio = `<!DOCTYPE html><html><head>
<title>vecchio</title>
<meta name="description" content="vecchia">
<link rel="canonical" href="https://x/">
<meta property="og:url" content="https://x/">
<meta property="og:title" content="v">
<meta property="og:description" content="v">
<link rel="stylesheet" href="assets/css/layout.css">
<script type="module" src="assets/js/app.js"></script>
</head><body><main><section id="page-home"></section></main></body></html>`;

const out = P.componi(guscio, {
  titolo: 'Cake Topper — INGLY', descrizione: 'Topper inciso.',
  canonico: BASE + '/product/7/', contenuto: c,
  jsonld: { '@context': 'https://schema.org', '@type': 'Product', name: 'Cake Topper' },
});
check('il titolo viene sostituito', /<title>Cake Topper — INGLY<\/title>/.test(out));
check('il vecchio titolo sparisce', !out.includes('<title>vecchio'));
check('la descrizione viene sostituita', out.includes('content="Topper inciso."'));
check('il canonico viene sostituito', out.includes('href="' + BASE + '/product/7/"'));
check('og:url segue il canonico', out.includes('property="og:url" content="' + BASE + '/product/7/"'));
check('il JSON-LD è inserito nella testa',
  /<script type="application\/ld\+json"[^>]*>.*Cake Topper.*<\/script>\s*<\/head>/s.test(out));
/* L'id serve a seo.js per TOGLIERE questo blocco quando l'applicazione parte e
   ne scrive di più ricchi. Senza, la pagina finiva per dichiarare la stessa
   azienda tre volte e lo stesso prodotto due: entità in conflitto per Google. */
check('il blocco è riconoscibile per poterlo sostituire a runtime',
  /<script type="application\/ld\+json" id="ld-prerender">/.test(out));
/* e il blocco di base del guscio non deve restare accanto al nostro */
check('il blocco del guscio viene sostituito, non affiancato',
  (out.match(/<script type="application\/ld\+json"/g) || []).length === 1,
  (out.match(/<script type="application\/ld\+json"/g) || []).length + ' blocchi');
check('il contenuto entra nel main', out.includes('id="prerender"') && out.includes('Cake Topper Matrimonio'));
/* Il punto più insidioso: da /product/7/ ogni percorso relativo — compresi i
   data/*.json scaricati da JavaScript — deve risalire di due livelli. */
check('dichiara la base a due livelli', out.includes('<base href="../../">'));
check('la base è la prima cosa nel head', /<head[^>]*>\s*<base href="\.\.\/\.\.\/">/.test(out));
check('gli indirizzi restano invariati (ci pensa <base>)', out.includes('href="assets/css/layout.css"'));

const outHome = P.componi(guscio, { titolo: 'Home', canonico: BASE + '/', contenuto: '<h1>Home</h1>' });
check('dalla home la base non risale', outHome.includes('<base href="./">'));

const outPag = P.componi(guscio, { titolo: 'Shop', canonico: BASE + '/shop', contenuto: '<h1>Shop</h1>' });
check('da una pagina si risale di uno', outPag.includes('<base href="../">'));
check('una sola base per pagina', (out.match(/<base /g)||[]).length === 1);

console.log('\n=== 7. Elenco dei file da generare ===');
const lista = P.elenco({ prodotti: [{ id: 1 }, { id: 2, hidden: true }, { id: 3 }] });
check('include la home', lista.some(x => x.file === 'index.html'));
check('include le pagine', lista.some(x => x.file === 'shop/index.html'));
check('un file per prodotto visibile', lista.filter(x => x.pagina === 'product').length === 2);
check('i prodotti nascosti non vengono generati', !lista.some(x => x.id === 2));
check('il percorso del prodotto è quello nuovo',
  lista.find(x => x.id === 3).file === 'product/3/index.html');
check('nessun file duplicato', new Set(lista.map(x => x.file)).size === lista.length);

console.log(`\n=========== PRERENDER: ${ok} passati, ${ko} falliti ===========\n`);
process.exit(ko ? 1 : 0);
