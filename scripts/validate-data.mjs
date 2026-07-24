/* ============ VALIDAZIONE DATI (CI) ============
   Eseguito da GitHub Actions a ogni modifica in data/.
   Blocca il merge se il catalogo è incoerente — non dopo che è già online. */
import { readFileSync, existsSync } from 'fs';

let errors = [];
const warn = [];
const J = f => {
  try { return JSON.parse(readFileSync('data/' + f, 'utf8')); }
  catch (e) { errors.push(`data/${f}: JSON non valido — ${e.message}`); return null; }
};

const P = J('products.json');
const CATS = J('categories.json');
const CONFIG = J('config.json');
J('texts.json'); J('social.json'); J('content.json'); J('version.json');

if (P && Array.isArray(P)) {
  const ids = P.map(p => p.id);
  const dupIds = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dupIds.length) errors.push('ID prodotto duplicati: ' + [...new Set(dupIds)].join(', '));

  P.forEach(p => {
    if (!p.n || !String(p.n.it || '').trim()) errors.push(`Prodotto #${p.id}: nome italiano mancante`);
    if (!(p.price > 0)) errors.push(`Prodotto #${p.id}: prezzo non valido (${p.price})`);
    if (CATS && !CATS.some(c => c.id === p.cat)) errors.push(`Prodotto #${p.id}: categoria "${p.cat}" inesistente`);
    if (CATS) {
      const c = CATS.find(c => c.id === p.cat);
      if (c && c.sub && c.sub.length && p.sub >= c.sub.length)
        errors.push(`Prodotto #${p.id}: sottocategoria ${p.sub} fuori indice per "${p.cat}"`);
    }
    if (!p.hidden && !existsSync('img/' + p.id + '.webp') && !p.img)
      warn.push(`Prodotto #${p.id} ("${p.n && p.n.it}"): nessuna foto in img/${p.id}.webp (userà il segnaposto)`);
  });
} else if (P === null) { /* già segnalato sopra */ }
else errors.push('products.json non è un array');

if (CONFIG) {
  const hf = CONFIG.heroFeatured || [];
  const ids = new Set((P || []).map(p => p.id));
  hf.forEach(id => { if (!ids.has(+id)) errors.push('config.heroFeatured punta a un prodotto inesistente: ' + id); });
}

console.log(`Controllati: ${(P || []).length} prodotti, ${(CATS || []).length} categorie.\n`);
if (warn.length) { console.log('⚠ Avvisi (non bloccanti):'); warn.forEach(w => console.log('  - ' + w)); console.log(''); }
if (errors.length) {
  console.log('❌ Errori:'); errors.forEach(e => console.log('  - ' + e));
  process.exit(1);
}
console.log('✅ Dati validi.');
