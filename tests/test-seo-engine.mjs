/* Test del SEO Engine — funzioni pure, nessun browser necessario.
   Verifica i casi che in produzione producono danni reali:
   segnaposto non sostituiti, titoli duplicati, troncature a metà parola,
   e un noindex che finirebbe per sbaglio su tutto il sito. */
import * as E from '../assets/js/seo-engine.js';

let ok = 0, ko = 0;
const check = (nome, cond) => { if(cond){ ok++; console.log('  ✔ ' + nome) } else { ko++; console.log('  ✖ ' + nome) } };

const prodotto = {
  id: 7, n: { it: 'Cake Topper Matrimonio', en: 'Wedding Cake Topper' },
  desc: { it: 'Decorazione elegante per la torta.', en: 'Elegant cake decoration.' },
  price: 24.9, prod: 3, sku: 'ING-007',
};
const ctx = { L: 'it', materiale: 'Plexiglass', categoria: 'Eventi', azienda: 'INGLY DESIGN', citta: 'Cesena' };

console.log('\n=== 1. Sostituzione dei segnaposto ===');
check('sostituisce i valori presenti',
  E.applica('{prodotto} in {materiale}', { prodotto: 'Targa', materiale: 'Legno' }) === 'Targa in Legno');
check('un valore mancante non lascia il segnaposto a vista',
  !/\{/.test(E.applica('{prodotto} in {materiale}', { prodotto: 'Targa' })));
check('niente spazi doppi da un valore vuoto',
  !/\s{2}/.test(E.applica('{a} — {b} — {c}', { a: 'X', c: 'Z' })));
check('nessun separatore orfano a fine stringa',
  !/[—\-|·,;:]\s*$/.test(E.applica('{a} — {b}', { a: 'Solo' })));
check('nessun separatore orfano a inizio stringa',
  !/^\s*[—\-|·,;:]/.test(E.applica('{a} — {b}', { b: 'Solo' })));

console.log('\n=== 2. Troncatura ===');
check('testo corto resta intatto', E.tronca('breve', 60) === 'breve');
check('testo lungo viene accorciato', E.tronca('a'.repeat(100), 60).length <= 61);
check('non spezza le parole a metà',
  !/\s\S{1,3}…$/.test(E.tronca('parola '.repeat(30), 50)));
check('niente punteggiatura penzolante prima dei puntini',
  !/[\s\-—·|,.;:]…$/.test(E.tronca('uno, due, tre, quattro, cinque, sei, sette', 20)));

console.log('\n=== 3. Titoli ===');
const t = E.titoloProdotto(prodotto, {}, ctx);
check('il titolo prodotto contiene il nome', t.includes('Cake Topper Matrimonio'));
check('il titolo prodotto contiene il materiale', t.includes('Plexiglass'));
check('il titolo prodotto contiene l azienda', t.includes('INGLY DESIGN'));
check('nessun segnaposto residuo nel titolo', !/\{\w+\}/.test(t));
check('un modello personalizzato viene rispettato',
  E.titoloProdotto(prodotto, { template: { titoloProdotto: 'Compra {prodotto}' } }, ctx) === 'Compra Cake Topper Matrimonio');
check('la home usa il proprio modello',
  E.titoloPagina('home', {}, { azienda: 'INGLY', claim: 'Incisione laser' }).includes('Incisione laser'));
check('le altre pagine usano il modello pagina',
  E.titoloPagina('shop', {}, { pagina: 'Catalogo', azienda: 'INGLY' }) === 'Catalogo — INGLY');

console.log('\n=== 4. Titoli UNICI per prodotto (il motivo del motore) ===');
const catalogo = [
  { id: 1, n: { it: 'Targa Ufficio' }, desc: { it: 'x' }, price: 10, prod: 3 },
  { id: 2, n: { it: 'Portachiavi Cuore' }, desc: { it: 'y' }, price: 12, prod: 3 },
  { id: 3, n: { it: 'Lampada Luna' }, desc: { it: 'z' }, price: 30, prod: 5 },
];
const titoli = catalogo.map(p => E.titoloProdotto(p, {}, ctx));
check('prodotti diversi producono titoli diversi', new Set(titoli).size === catalogo.length);

console.log('\n=== 4b. Nessuna ripetizione del materiale ===');
const pelle = { id: 23, n: { it: 'Etichetta Bagaglio in Pelle' }, desc: { it: 'Etichetta robusta.' }, price: 15, prod: 3 };
const tp = E.titoloProdotto(pelle, {}, { ...ctx, materiale: 'Pelle' });
check('il materiale non viene ripetuto se è già nel nome', !/Pelle.*Pelle/i.test(tp));
check('il titolo resta comunque sensato', tp.startsWith('Etichetta Bagaglio in Pelle'));
const legno = { id: 3, n: { it: 'Quadro Ritratto Inciso su Legno' }, desc: { it: 'Ritratto inciso.' }, price: 40, prod: 5 };
check('vale anche per un nome che finisce col materiale',
  !/Legno.*Legno/i.test(E.titoloProdotto(legno, {}, { ...ctx, materiale: 'Legno' })));
check('il materiale viene aggiunto quando NON è nel nome',
  /Plexiglass/.test(E.titoloProdotto({ id: 9, n: { it: 'Targa Ufficio' }, desc: { it: 'x' } }, {}, { ...ctx, materiale: 'Plexiglass' })));
check('confronto insensibile a maiuscole e accenti',
  E.contiene('Etichetta in pelle', 'Pelle') === true);
check('un materiale composto viene riconosciuto',
  E.contiene('Lampada in PLA stampata', 'PLA/PETG') === true);
check('parole diverse non vengono confuse',
  E.contiene('Targa Ufficio', 'Legno') === false);
check('la descrizione non ripete il materiale',
  !/Pelle.*Pelle/i.test(E.descrizioneProdotto(pelle, {}, { ...ctx, materiale: 'Pelle' })));

console.log('\n=== 5. Descrizioni ===');
const d = E.descrizioneProdotto(prodotto, {}, ctx);
check('la descrizione resta entro il limite di Google', d.length <= E.LIMITI.descrizioneMax);
check('la descrizione contiene il nome prodotto', d.includes('Cake Topper'));
check('nessun segnaposto residuo nella descrizione', !/\{\w+\}/.test(d));
check('eventuale HTML viene rimosso',
  !/[<>]/.test(E.descrizioneProdotto({ ...prodotto, desc: { it: '<b>Grassetto</b> e <i>corsivo</i>.' } }, {}, ctx)));

console.log('\n=== 6. Direttive robots ===');
check('per impostazione predefinita la pagina è indicizzabile',
  E.robots('shop', {}).startsWith('index'));
check('una pagina può essere esclusa singolarmente',
  E.robots('quote', { robots: { pagine: { quote: 'noindex' } } }).startsWith('noindex'));
check('escludere una pagina non tocca le altre',
  E.robots('shop', { robots: { pagine: { quote: 'noindex' } } }).startsWith('index'));
check('esiste un interruttore per tutto il sito',
  E.robots('home', { robots: { tuttoNoindex: true } }) === 'noindex, nofollow');
check('l interruttore globale è spento se non dichiarato',
  E.robots('home', { robots: {} }).startsWith('index'));

console.log('\n=== 7. Diagnosi ===');
check('segnala il titolo mancante',
  E.diagnosi('', 'x'.repeat(100)).some(x => x.gravita === 'errore'));
check('segnala il titolo troppo lungo',
  E.diagnosi('x'.repeat(90), 'y'.repeat(100)).some(x => /taglia/.test(x.testo)));
check('segnala un segnaposto non sostituito',
  E.diagnosi('Prodotto {materiale}', 'y'.repeat(100)).some(x => /[Ss]egnaposto/.test(x.testo)));
check('un titolo e una descrizione corretti non danno errori',
  E.diagnosi('Cake Topper Matrimonio in Plexiglass — INGLY', 'z'.repeat(120)).filter(x => x.gravita === 'errore').length === 0);

console.log(`\n=========== SEO ENGINE: ${ok} passati, ${ko} falliti ===========\n`);
process.exit(ko ? 1 : 0);
