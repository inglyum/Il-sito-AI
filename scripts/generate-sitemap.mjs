#!/usr/bin/env node
/* ============ SITEMAP ============
   Genera sitemap.xml dalle STESSE pagine che genera il prerender.

   Prima questo file scriveva a mano indirizzi con il cancelletto
   (https://www.inglydesign.it/#/shop). Per Google tutto ciò che segue il '#'
   è un frammento della stessa pagina: 76 indirizzi su 77 venivano collassati
   sulla home, e le 63 pagine statiche vere — quelle costruite apposta per
   essere indicizzate — non risultavano dichiarate da nessuna parte.

   Adesso l'elenco arriva da prerender-engine.js: la sitemap non può più
   raccontare pagine diverse da quelle che esistono davvero sul disco.

   Uso: node scripts/generate-sitemap.mjs
        node scripts/generate-sitemap.mjs --verifica   (non scrive, controlla)
*/
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as PRE from '../assets/js/prerender-engine.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
const SOLO_VERIFICA = process.argv.includes('--verifica');

const config   = JSON.parse(readFileSync(join(ROOT,'data/config.json'),'utf8'));
const prodotti = JSON.parse(readFileSync(join(ROOT,'data/products.json'),'utf8'));
const contenuti = JSON.parse(readFileSync(join(ROOT,'data/content.json'),'utf8'));

const BASE = ((config.seo && config.seo.dominio) || 'https://www.inglydesign.it').replace(/\/+$/,'');
const OGGI = new Date().toISOString().slice(0,10);

/* Quanto spesso cambia e quanto conta, per tipo di pagina. Il catalogo si
   muove di continuo, «chi siamo» quasi mai: dirlo evita che il crawler
   sprechi passaggi sulle pagine ferme. */
const REGOLE = {
  home:      ['weekly',  '1.0'],
  verticale: ['monthly', '0.8'],
  shop:      ['weekly',  '0.9'],
  digital:   ['weekly',  '0.8'],
  business:  ['monthly', '0.8'],
  portfolio: ['monthly', '0.7'],
  faq:       ['monthly', '0.7'],
  quote:     ['monthly', '0.6'],
  about:     ['yearly',  '0.5'],
  product:   ['monthly', '0.6'],
};

/* Indirizzo pubblico di una pagina generata:
   'index.html' → '/', 'shop/index.html' → '/shop', 'product/7/index.html' → '/product/7/' */
const indirizzo = file => {
  if(file === 'index.html') return BASE + '/';
  const dir = file.replace(/\/index\.html$/, '');
  return BASE + '/' + dir + (dir.startsWith('product/') ? '/' : '');
};

/* lastmod onesto: la data in cui la pagina è stata scritta davvero.
   Mettere «oggi» ovunque a ogni build è un segnale che Google impara a
   ignorare, perché dichiara modificate anche pagine ferme da mesi. */
const modificata = file => {
  const f = join(ROOT, file);
  return existsSync(f) ? statSync(f).mtime.toISOString().slice(0,10) : OGGI;
};

const pagine = PRE.elenco({ prodotti, verticali: contenuti.VERTICALI || [] });
const mancanti = [];
const righe = [];

for(const voce of pagine){
  if(!existsSync(join(ROOT, voce.file))){
    /* manca una pagina attesa: il prerender non è stato eseguito dopo
       l'ultima modifica ai dati */
    mancanti.push(voce.file);
    continue;
  }
  const [freq, pri] = REGOLE[voce.pagina] || ['monthly','0.5'];
  righe.push(` <url><loc>${indirizzo(voce.file)}</loc><lastmod>${modificata(voce.file)}</lastmod>` +
             `<changefreq>${freq}</changefreq><priority>${pri}</priority></url>`);
}

/* Le pagine filtrate del catalogo (/shop?cat=casa) restano fuori di proposito:
   GitHub Pages serve sempre lo stesso file per qualunque query, quindi
   dichiararle significherebbe presentare a Google tredici indirizzi diversi
   con contenuto identico. Il filtro è comodo per chi naviga, non una pagina. */

const xml = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
             ...righe, '</urlset>', ''].join('\n');

/* Rete di sicurezza: se un indirizzo con il cancelletto rientrasse da qualche
   parte, la sitemap tornerebbe a dichiarare una pagina sola. Meglio fermare
   la build che pubblicarla rotta. */
const conCancelletto = righe.filter(r => /<loc>[^<]*#/.test(r));
if(conCancelletto.length){
  console.error(`\n  ✖ ${conCancelletto.length} indirizzi contengono '#': Google li collasserebbe sulla home.`);
  conCancelletto.slice(0,3).forEach(r => console.error('    ' + r.trim()));
  process.exit(1);
}

if(mancanti.length){
  console.error(`\n  ✖ ${mancanti.length} pagine attese ma non presenti sul disco.`);
  console.error('    Esegui prima: node scripts/prerender.mjs');
  mancanti.slice(0,5).forEach(f => console.error('    ' + f));
  process.exit(1);
}

if(SOLO_VERIFICA){
  const attuale = existsSync(join(ROOT,'sitemap.xml')) ? readFileSync(join(ROOT,'sitemap.xml'),'utf8') : '';
  if(attuale.trim() !== xml.trim()){
    console.error('\n  ✖ sitemap.xml non è allineata alle pagine generate.');
    console.error('    Esegui: node scripts/generate-sitemap.mjs');
    process.exit(1);
  }
  console.log(`✔ sitemap.xml allineata — ${righe.length} indirizzi, nessuno con '#'`);
} else {
  writeFileSync(join(ROOT,'sitemap.xml'), xml, 'utf8');
  const nProd = pagine.filter(v => v.pagina === 'product').length;
  console.log(`sitemap.xml — ${righe.length} indirizzi puliti (${nProd} prodotti, ${righe.length-nProd-1} pagine, 1 home)`);
}
