#!/usr/bin/env node
/* ============ GENERAZIONE PAGINE PRODOTTO ============
   Scrive una pagina già leggibile per ogni prodotto visibile:
     product/<id>/index.html

   Perché da riga di comando e non da un workflow automatico: la regola 5 del
   progetto vieta che un'azione GitHub faccia commit sul ramo — entrerebbe in
   conflitto con la pubblicazione atomica dell'Admin. Qui i file si generano e
   si committano insieme al resto, come qualsiasi altra modifica.

   Uso:
     node scripts/build-prerender.mjs            genera
     node scripts/build-prerender.mjs --check    verifica soltanto (per la CI)
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { paginaProdotto, percorsoProdotto } from '../assets/js/prerender.mjs';
import * as SCH from '../assets/js/schema-engine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOLO_VERIFICA = process.argv.includes('--check');

const leggi = f => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

const cfg   = leggi('data/config.json');
const prod  = leggi('data/products.json');
const cats  = leggi('data/categories.json');
const cont  = leggi('data/content.json');
const index = readFileSync(join(ROOT, 'index.html'), 'utf8');

const S    = cfg.seo || {};
const base = String(S.dominio || 'https://www.inglydesign.it').replace(/\/+$/, '');
const cartella = cfg.cartellaImmagini || 'img/';
const MATN = cont.MATN || {};

const visibili = prod.filter(p => !p.hidden);
let scritti = 0, diversi = [];

for(const p of visibili){
  const cat = cats.find(c => c.id === p.cat);
  const categoria  = (cat && cat.n && cat.n.it) || '';
  const materiale  = (MATN[p.mat] && MATN[p.mat].it) || p.mat || '';
  const nome = (p.n && p.n.it) || ('Prodotto ' + p.id);
  const desc = ((p.desc && p.desc.it) || S.descrizione || '').replace(/<[^>]+>/g, '');

  const jsonld = SCH.grafo([
    SCH.organizzazione(cfg, { base, social: Object.values(cfg.social || {}) }),
    {
      '@type': 'Product',
      name: nome,
      sku: p.sku || ('INGLY-' + p.id),
      description: desc,
      image: SCH.immagini(p, { base, cartella, L: 'it' }),
      category: categoria || undefined,
      material: materiale || undefined,
      brand: { '@type': 'Brand', name: S.azienda || 'INGLY DESIGN' },
      offers: {
        '@type': 'Offer', price: p.price, priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: base + '/product/' + p.id + '/',
        seller: { '@id': base + SCH.ID.org },
      },
    },
  ]);

  const html = paginaProdotto(index, p, {
    L: 'it', base, cartella, categoria, materiale,
    titolo: nome + ' — ' + (S.azienda || 'INGLY DESIGN'),
    descrizione: desc,
    jsonld,
  });

  const rel = percorsoProdotto(p.id);
  const dest = join(ROOT, rel);
  const esistente = existsSync(dest) ? readFileSync(dest, 'utf8') : null;

  if(esistente !== html) diversi.push(rel);
  if(!SOLO_VERIFICA){
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, html);
  }
  scritti++;
}

/* pagine di prodotti non più visibili: vanno tolte, altrimenti restano
   indicizzate schede che il catalogo non mostra più */
const cartellaProd = join(ROOT, 'product');
const idsVisibili = new Set(visibili.map(p => String(p.id)));
let rimosse = [];
if(existsSync(cartellaProd)){
  for(const d of readdirSync(cartellaProd)){
    if(!idsVisibili.has(d)){
      rimosse.push('product/' + d);
      if(!SOLO_VERIFICA) rmSync(join(cartellaProd, d), { recursive: true, force: true });
    }
  }
}

if(SOLO_VERIFICA){
  if(diversi.length || rimosse.length){
    console.error('✖ Le pagine prodotto non sono aggiornate.');
    if(diversi.length) console.error('  da rigenerare: ' + diversi.slice(0, 8).join(', ') + (diversi.length > 8 ? ` …e altre ${diversi.length - 8}` : ''));
    if(rimosse.length) console.error('  da rimuovere:  ' + rimosse.join(', '));
    console.error('  Esegui: node scripts/build-prerender.mjs');
    process.exit(1);
  }
  console.log(`✅ Pagine prodotto aggiornate (${scritti}).`);
} else {
  console.log(`✅ Generate ${scritti} pagine prodotto in product/<id>/index.html`);
  if(rimosse.length) console.log(`   rimosse ${rimosse.length} pagine di prodotti non più visibili`);
}
