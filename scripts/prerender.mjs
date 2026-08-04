#!/usr/bin/env node
/* ============ GENERA LE PAGINE STATICHE ============
   Legge data/*.json e index.html, scrive una pagina vera per ogni prodotto e
   per ogni sezione del sito.

   Uso:  node scripts/prerender.mjs            (genera)
         node scripts/prerender.mjs --check    (verifica soltanto, non scrive)

   Le pagine generate sono file normali: GitHub Pages le serve così come sono,
   quindi un crawler che non esegue JavaScript legge testo, prezzi e misure.
   Chi apre il sito con un browser non nota nulla: appena l'applicazione parte,
   il blocco statico viene rimosso e prende il posto il sito di sempre. */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import * as P from '../assets/js/prerender-engine.js';
import * as SCH from '../assets/js/schema-engine.js';
import * as FAQ from '../assets/js/faq-engine.js';
import * as VERT from '../assets/js/verticali.js';
import * as PR from '../assets/js/prezzi.js';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const SOLO_VERIFICA = process.argv.includes('--check');
const leggi = async f => JSON.parse(await readFile(join(ROOT, f), 'utf8'));

const cfg      = await leggi('data/config.json');
const prodotti = await leggi('data/products.json');
const categorie= await leggi('data/categories.json');
const contenuti= await leggi('data/content.json');
const testi    = await leggi('data/texts.json');
const guscio   = await readFile(join(ROOT, 'index.html'), 'utf8');

const S = cfg.seo || {};
const base = String(S.dominio || 'https://www.inglydesign.it').replace(/\/+$/, '');
const azienda = S.azienda || 'INGLY DESIGN';
const L = 'it';
const T = k => (testi[L] && testi[L][k]) || '';

const MATN = contenuti.MATN || {};
const nomeMateriale = m => (MATN[m] && MATN[m][L]) || m || '';
const nomeCategoria = id => {
  const c = categorie.find(x => x.id === id);
  return (c && c.n && c.n[L]) || '';
};

/* le entità comuni a ogni pagina: azienda, sito, lavorazioni */
const entitaBase = [
  SCH.organizzazione(cfg, { base, social: Object.values(cfg.social || {}) }),
  SCH.sitoWeb(cfg, { base }),
  SCH.servizi(contenuti.TECH || [], { base, azienda }),
];

const TITOLI = {
  shop:'Catalogo', digital:'Prodotti digitali', business:'B2B · Aziende',
  portfolio:'Portfolio', about:'Chi siamo', faq:'Domande frequenti', quote:'Richiedi un preventivo',
};

function paginaProdotto(p){
  const canonico = P.indirizzo('product', { base, id: p.id });
  const titolo = (p.n && p.n[L]) + ' — ' + azienda;
  const desc = P.soloTesto((p.desc && p.desc[L]) || S.descrizione || '').slice(0, 300);
  const ctx = { L, azienda, categoria: nomeCategoria(p.cat), materiale: nomeMateriale(p.mat) };
  /* Le domande sono la parte che i motori AI citano più volentieri: vanno
     nell'HTML statico, non solo nei dati strutturati. */
  const faqs = FAQ.perProdotto(p, contenuti.FAQS || [], ctx);
  const contenuto = P.corpoProdotto(p, ctx) + '\n' + FAQ.html(faqs);
  const jsonld = SCH.grafo([
    ...entitaBase,
    FAQ.schema(faqs, { url: canonico }),
    SCH.compatta({
      '@type':'Product',
      name:(p.n && p.n[L]) || '', sku:p.sku || ('INGLY-' + p.id),
      description:desc,
      image:SCH.immagini(p, { base, cartella:cfg.cartellaImmagini || 'img/', L }),
      category:nomeCategoria(p.cat) || undefined,
      material:p.mat || undefined,
      brand:{ '@type':'Brand', name:azienda },
      /* con i prezzi spenti nell'Admin non si dichiara una cifra che la
         pagina non mostra: Google segnala i prezzi che non corrispondono */
      offers:PR.offertaSchema(p, cfg, { url:canonico, venditore:{ '@id': base + SCH.ID.org } }),
    }),
  ]);
  return P.componi(guscio, { titolo, descrizione:desc, canonico, contenuto, jsonld });
}

function paginaSito(pg){
  const canonico = P.indirizzo(pg, { base });
  const titolo = pg === 'home' ? (S.titolo || azienda) : (TITOLI[pg] || pg) + ' — ' + azienda;
  const desc = S.descrizione || '';
  const contenuto = P.corpoPagina(pg, {
    L, base, titolo: pg === 'home' ? azienda : (TITOLI[pg] || pg), descrizione: desc,
    prodotti: pg === 'shop' ? prodotti.filter(x => !x.hidden) : [],
    categorie: pg === 'shop' ? categorie : [],
  });
  const extra = pg === 'shop'
    ? [SCH.paginaCollezione(prodotti.filter(x => !x.hidden), { base, L, titolo: azienda + ' — Catalogo', url: canonico })]
    : [];
  return P.componi(guscio, { titolo, descrizione:desc, canonico, contenuto, jsonld: SCH.grafo([...entitaBase, ...extra]) });
}

/* Pagina di settore: /business/ristoranti e simili.
   Stesso guscio delle altre, contenuto e dati strutturati propri. È la pagina
   che intercetta «menu qr personalizzato ristorante» — una ricerca che il
   catalogo generico non può soddisfare, perché non parla quella lingua. */
function paginaVerticale(v){
  const canonico = VERT.indirizzo(v, base);
  const { titolo, descrizione } = VERT.meta(v, { L, azienda, citta: S.citta || '' });
  const contenuto = VERT.corpo(v, { L, base, prodotti, prezzo: P.prezzo });
  const jsonld = SCH.grafo([
    ...entitaBase,
    ...VERT.schema(v, { L, base, azienda, idAzienda: SCH.ID.org }),
    VERT.briciole(v, { L, base }),
  ]);
  return P.componi(guscio, { titolo, descrizione, canonico, contenuto, jsonld });
}

const verticali = contenuti.VERTICALI || [];
const lista = P.elenco({ prodotti, verticali });
let scritti = 0, problemi = [];

/* la cartella si rigenera da zero: pagine di prodotti eliminati non devono
   sopravvivere e restare indicizzate */
if(!SOLO_VERIFICA && existsSync(join(ROOT, 'product'))) await rm(join(ROOT, 'product'), { recursive: true, force: true });
/* stesso motivo per i settori: uno spento o rinominato non deve sopravvivere
   sul disco e restare indicizzato */
if(!SOLO_VERIFICA){
  for(const v of verticali){
    const dir = join(ROOT, 'business', String(v && v.id || ''));
    if(v && v.id && existsSync(dir)) await rm(dir, { recursive: true, force: true });
  }
}

for(const voce of lista){
  if(voce.file === 'index.html') continue;      /* la home resta il guscio originale */
  const p = voce.id != null ? prodotti.find(x => x.id === voce.id) : null;
  const html = voce.pagina === 'product' ? paginaProdotto(p)
             : voce.pagina === 'verticale' ? paginaVerticale(VERT.perId(verticali, voce.id))
             : paginaSito(voce.pagina);

  if(!/<h1>/.test(html)) problemi.push(voce.file + ': manca il titolo principale');
  if(html.includes('<title></title>')) problemi.push(voce.file + ': titolo vuoto');

  if(!SOLO_VERIFICA){
    const dest = join(ROOT, voce.file);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, html, 'utf8');
  }
  scritti++;
}

console.log(`\n  Pagine ${SOLO_VERIFICA ? 'verificate' : 'generate'}: ${scritti}`);
console.log(`  Prodotti: ${prodotti.filter(x => !x.hidden).length} visibili su ${prodotti.length}`);
if(problemi.length){
  console.log('\n  Problemi:');
  problemi.forEach(x => console.log('   ✖ ' + x));
  process.exit(1);
}
console.log('  Nessun problema.\n');
