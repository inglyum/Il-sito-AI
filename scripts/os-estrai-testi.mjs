/* ============ ESTRAZIONE DEI TESTI DI INGLY OS ============
   Raccoglie le stringhe italiane visibili dal file monolitico e le mette in un
   catalogo traducibile.

   PERCHÉ COSÌ E NON ALTRIMENTI.
   INGLY OS è un file solo da 107.000 righe, e la maggior parte del testo non
   sta nell'HTML: nasce dentro template literal JavaScript, dentro 123 viste
   disegnate a runtime. Mettere una chiamata t('...') su ognuna delle ~3.200
   stringhe significherebbe toccare altrettanti punti di codice, e ogni tocco è
   un'occasione di rompere qualcosa in un file senza test.

   La strada scelta è la traduzione del DOM disegnato: il dizionario mappa la
   frase italiana esatta alla sua traduzione, e un passaggio dopo ogni render
   sostituisce solo le corrispondenze ESATTE presenti nel dizionario. Niente si
   traduce per sbaglio — un numero, un codice, il nome di un cliente non sono
   nel dizionario e restano intatti. E le 123 viste non vanno toccate.

   Uso:
     node scripts/os-estrai-testi.mjs            → aggiorna data/os-i18n.json
     node scripts/os-estrai-testi.mjs --mancanti → elenca cosa resta da tradurre
*/
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SORGENTE = join(RADICE, 'INGLY-OS-v52-STANDALONE.html');
const CATALOGO = join(RADICE, 'data', 'os-i18n.json');
const SOLO_MANCANTI = process.argv.includes('--mancanti');

/* Una stringa è italiana se contiene una parola che in inglese non esiste.
   Meglio sbagliare per difetto: una frase non estratta si aggiunge a mano,
   una frase estratta per errore finisce tradotta quando non doveva. */
const SPIA = /\b(il|lo|la|le|gli|un|una|dei|delle|degli|nel|nella|sul|sulla|per|con|che|non|sono|questo|questa|come|dove|quando|più|già|anche|solo|ogni|tutti|tutte|nuovo|nuova|salva|elimina|modifica|aggiungi|cerca|chiudi|apri|scegli|seleziona|prezzo|costo|clienti?|prevent\w+|ordin\w+|material\w+|magazzino|fattur\w+|vendit\w+|acquist\w+|totale|scadenz\w+|fornitor\w+|guadagno|ricavo|spesa|spese|mese|mesi|anno|giorno|giorni|settimana|scarica|carica|stampa|invia|conferma|annulla|indietro|avanti)\b/i;

/* Cose che NON vanno tradotte anche se sembrano testo. */
const ESCLUDI = [
  /^\s*$/,                       /* vuote */
  /^[\d\s.,:%€$+\-–—/()]+$/,     /* solo numeri e simboli */
  /\$\{/,                        /* frammenti di template literal */
  /^https?:|^mailto:|^www\./i,   /* indirizzi */
  /^[A-Z0-9_]{2,}$/,             /* costanti e sigle */
  /<[a-z/]/i,                    /* HTML rimasto dentro */
  /^[a-z]+([A-Z][a-z]+)+$/,      /* nomiInCamelCase del codice */
  /['"]\s*\+|\+\s*['"]/,          /* frammenti di concatenazione: '+client.name+' */
  /\bfunction\b|=>|;\s*$/,       /* codice sfuggito all'estrazione */
];

const pulisci = t => t.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
  .replace(/\s+/g,' ').trim();

const scartare = t => t.length < 3 || t.length > 140 || ESCLUDI.some(r => r.test(t));

export function estrai(sorgente){
  const trovate = new Map();   /* testo → quante volte compare */
  const aggiungi = t => {
    const p = pulisci(t);
    if(scartare(p) || !SPIA.test(p)) return;
    trovate.set(p, (trovate.get(p) || 0) + 1);
  };

  /* 1. testo fra i tag, anche dentro i template literal */
  for(const m of sorgente.matchAll(/>([^<>]{3,140})</g)) aggiungi(m[1]);
  /* 2. attributi che l'utente legge */
  for(const m of sorgente.matchAll(/(?:placeholder|title|aria-label|alt)\s*=\s*"([^"]{3,140})"/g)) aggiungi(m[1]);
  /* 3. messaggi passati alle funzioni di avviso */
  for(const m of sorgente.matchAll(/(?:showToast|toast|alert|confirm)\(\s*['"`]([^'"`]{3,140})/g)) aggiungi(m[1]);
  /* 4. opzioni delle tendine costruite in JS */
  for(const m of sorgente.matchAll(/<option[^>]*>([^<]{3,140})</g)) aggiungi(m[1]);

  return trovate;
}

const sorgente = await readFile(SORGENTE, 'utf8');
const trovate = estrai(sorgente);

/* Il catalogo esistente non si sovrascrive mai: le traduzioni già fatte
   restano, si aggiungono solo le frasi nuove. */
let catalogo = { _nota:'', it_en: {} };
if(existsSync(CATALOGO)) catalogo = JSON.parse(await readFile(CATALOGO,'utf8'));
catalogo.it_en = catalogo.it_en || {};

let nuove = 0;
for(const [testo] of [...trovate].sort((a,b) => b[1]-a[1])){
  if(!(testo in catalogo.it_en)){ catalogo.it_en[testo] = ''; nuove++ }
}
const tradotte = Object.values(catalogo.it_en).filter(Boolean).length;
const totale = Object.keys(catalogo.it_en).length;

if(SOLO_MANCANTI){
  const mancanti = Object.entries(catalogo.it_en).filter(([,v]) => !v).map(([k]) => k);
  console.log(`Da tradurre: ${mancanti.length} su ${totale}\n`);
  mancanti.slice(0,60).forEach(m => console.log('  · ' + m));
  if(mancanti.length > 60) console.log(`  … e altre ${mancanti.length-60}`);
  process.exit(0);
}

catalogo._nota = 'Catalogo dei testi di INGLY OS. La chiave è la frase italiana ESATTA come compare a schermo: il motore sostituisce solo le corrispondenze intere, quindi nulla si traduce per sbaglio. Rigenerare con: node scripts/os-estrai-testi.mjs';
await writeFile(CATALOGO, JSON.stringify(catalogo, null, 1));

console.log(`  Stringhe italiane trovate: ${trovate.size}`);
console.log(`  Nel catalogo: ${totale}  (${nuove} nuove)`);
console.log(`  Tradotte: ${tradotte}  →  ${Math.round(tradotte/totale*100)}%`);
console.log(`\n  Cosa manca:  node scripts/os-estrai-testi.mjs --mancanti`);
