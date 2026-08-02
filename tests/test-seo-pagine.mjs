/* ============ DATI STRUTTURATI E SITEMAP DELLE PAGINE PUBBLICATE ============
   Controlla i file che finiscono davvero online, non una simulazione:
   le pagine statiche generate dal prerender e la sitemap.

   Nasce da due difetti trovati in produzione:
   1. ogni scheda prodotto dichiarava LocalBusiness tre volte, Product e
      FAQPage due — il guscio portava un blocco, il prerender ne aggiungeva un
      altro, e a runtime seo.js ne scriveva altri ancora. Entità in conflitto:
      Google nel dubbio non mostra prezzo, disponibilità e stelle;
   2. la sitemap dichiarava 76 indirizzi su 77 con il cancelletto, che Google
      collassa sulla home: le 63 pagine statiche non risultavano da nessuna parte.
   Nessuno dei due era visibile ai test esistenti, che non guardano i file
   pubblicati. */
import { readFileSync, existsSync } from 'fs';

let pass = 0, fail = 0;
const check = (n, c, x = '') => { if (c) { pass++; console.log('  ✔ ' + n) } else { fail++; console.log('  ✖ ' + n + (x ? ' → ' + x : '')) } };

/* tutti i blocchi ld+json di una pagina, già interpretati */
const blocchi = html => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m => { try { return JSON.parse(m[1]) } catch (e) { return { __rotto: true } } });

/* conta quante volte compare ogni @type, scendendo dentro @graph */
const conta = html => {
  const n = {};
  for (const b of blocchi(html)) {
    for (const e of (b['@graph'] || [b])) {
      const t = e && e['@type'];
      if (t) n[t] = (n[t] || 0) + 1;
    }
  }
  return n;
};

console.log('\n=== PAGINE STATICHE — una entità, una volta sola ===');
const pagine = ['index.html', 'shop/index.html', 'faq/index.html', 'product/7/index.html',
  'business/ristoranti/index.html'];
for (const f of pagine) {
  if (!existsSync(f)) { check(f + ' generata', false, 'esegui node scripts/prerender.mjs'); continue }
  const html = readFileSync(f, 'utf8');
  const b = blocchi(html);
  check(f + ': JSON-LD valido', !b.some(x => x.__rotto));
  check(f + ': un solo blocco di dati strutturati', b.length === 1, b.length + ' blocchi');
  const n = conta(html);
  const doppie = Object.entries(n).filter(([t, v]) => v > 1 && ['LocalBusiness','Organization','WebSite','Product','FAQPage','BreadcrumbList'].includes(t));
  check(f + ': nessuna entità principale ripetuta', doppie.length === 0,
    doppie.map(([t, v]) => t + '×' + v).join(', '));
}

console.log('\n=== PAGINA PRODOTTO — cosa legge un crawler senza JavaScript ===');
if (existsSync('product/7/index.html')) {
  const html = readFileSync('product/7/index.html', 'utf8');
  const n = conta(html);
  check('dichiara il prodotto', n.Product === 1);
  check('dichiara l\'azienda che lo vende', (n.LocalBusiness || n.Organization) === 1);
  check('il prodotto ha un\'offerta con prezzo', /"@type":"Offer"/.test(html) && /"priceCurrency"/.test(html));
  check('il titolo principale è nel codice HTML', /<h1>/.test(html));
  check('ha un canonico assoluto', /<link rel="canonical" href="https?:\/\/[^"]+\/product\/7\//.test(html));
}

console.log('\n=== PAGINE DI SETTORE — cosa legge un crawler ===');
if (existsSync('business/ristoranti/index.html')) {
  const html = readFileSync('business/ristoranti/index.html', 'utf8');
  const n = conta(html);
  check('dichiara il servizio offerto al settore', n.Service >= 1);
  check('dichiara le domande del settore', n.FAQPage === 1);
  check('dichiara il percorso Home › Business › Settore', n.BreadcrumbList === 1);
  check('il titolo parla del settore, non del sito',
    /<title>[^<]*Menu QR/i.test(html), (html.match(/<title>[^<]*<\/title>/) || [''])[0]);
  check('il canonico è quello della pagina di settore',
    /rel="canonical" href="https?:\/\/[^"]+\/business\/ristoranti"/.test(html));
  /* il motivo per cui la pagina esiste: testo vero, non un guscio vuoto */
  const corpo = (html.match(/<div id="prerender"[\s\S]*?<\/div>/) || [''])[0];
  check('contiene testo leggibile, non un guscio vuoto',
    corpo.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length > 150,
    corpo.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length + ' parole');
  check('collega i prodotti del catalogo', /href="[^"]*\/product\/\d+\/"/.test(corpo));
}

console.log('\n=== SITEMAP ===');
if (!existsSync('sitemap.xml')) { check('sitemap.xml presente', false) }
else {
  const xml = readFileSync('sitemap.xml', 'utf8');
  const loc = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  check('sitemap non vuota', loc.length > 10, loc.length + ' indirizzi');
  /* il difetto originale: '#' rende l'indirizzo un frammento della home */
  const hash = loc.filter(u => u.includes('#'));
  check('nessun indirizzo con il cancelletto', hash.length === 0, hash.slice(0, 2).join(' '));
  check('le schede prodotto sono dichiarate', loc.some(u => /\/product\/\d+\/$/.test(u)),
    loc.filter(u => u.includes('/product/')).length + ' schede');
  check('il catalogo è dichiarato', loc.some(u => /\/shop$/.test(u)));
  /* ogni indirizzo deve corrispondere a un file che esiste davvero */
  const rotti = loc.filter(u => {
    const p = u.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
    return !existsSync(p === '' ? 'index.html' : p + '/index.html');
  });
  check('ogni indirizzo corrisponde a una pagina esistente', rotti.length === 0, rotti.slice(0, 3).join(' '));
  check('nessun indirizzo ripetuto', new Set(loc).size === loc.length);
}

console.log(`\n=========== SEO PAGINE: ${pass} passati, ${fail} falliti ===========`);
process.exit(fail ? 1 : 0);
