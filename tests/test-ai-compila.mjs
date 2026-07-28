/* Test dell'assistente AI.
   Il rischio serio non è un JSON malformato: è che l'assistente SOVRASCRIVA
   testo scritto a mano, o pubblichi dati inventati. Buona parte dei controlli
   qui sotto serve esattamente a impedire quelle due cose. */
import * as AI from '../assets/js/admin/ai-compila.js';

let ok = 0, ko = 0;
const check = (n, c) => { if(c){ ok++; console.log('  ✔ ' + n) } else { ko++; console.log('  ✖ ' + n) } };

const vuoto = { id: 1, n: { it: 'Targa Ufficio' }, price: 24.9, prod: 3, mat: 'Plexiglass' };
const pieno = { ...vuoto, desc: { it: 'Scritta a mano.' }, seoTitolo: 'Mio titolo',
  seoDescrizione: 'Mia meta', keywords: ['mia'], caratteristiche: ['mia'] };

console.log('\n=== 1. Cosa manca ===');
check('su una scheda vuota manca tutto', AI.campiMancanti(vuoto).length === 5);
check('su una scheda piena non manca nulla', AI.campiMancanti(pieno).length === 0);
check('riconosce la descrizione mancante', AI.campiMancanti(vuoto).includes('descrizione'));
check('spazi soli contano come vuoto',
  AI.campiMancanti({ ...vuoto, seoTitolo: '   ' }).includes('seoTitolo'));
check('un elenco vuoto conta come mancante',
  AI.campiMancanti({ ...vuoto, keywords: [] }).includes('keywords'));

console.log('\n=== 2. La richiesta all AI ===');
const pr = AI.prompt(vuoto, { categoria: 'Ufficio', materiale: 'Plexiglass', campi: AI.campiMancanti(vuoto) });
check('passa il nome come dato certo', pr.includes('Targa Ufficio'));
check('passa il prezzo reale', pr.includes('24.90'));
check('passa i giorni reali', pr.includes('3'));
check('passa il materiale', pr.includes('Plexiglass'));
check('vieta di inventare', /non inventare/i.test(pr));
check('chiede solo JSON', /SOLO con JSON/i.test(pr));
check('chiede i campi mancanti', pr.includes('seoTitolo') && pr.includes('keywords'));
const prParziale = AI.prompt(vuoto, { campi: ['seoTitolo'] });
check('chiede solo ciò che serve',
  prParziale.includes('seoTitolo') && !prParziale.includes('"caratteristiche"'));
check('senza misure non le nomina', !/Misure:/.test(pr));

console.log('\n=== 3. Lettura della risposta ===');
const buona = AI.interpreta('{"descrizione":"Targa in plexiglass.","seoTitolo":"Targa Ufficio","keywords":["targa","ufficio"],"caratteristiche":["Incisa a laser","Su misura"]}');
check('legge la descrizione', buona.descrizione === 'Targa in plexiglass.');
check('legge le parole chiave', buona.keywords.length === 2);
check('legge le caratteristiche', buona.caratteristiche.length === 2);
check('tollera i blocchi ```json',
  AI.interpreta('```json\n{"seoTitolo":"X"}\n```').seoTitolo === 'X');
check('tollera testo attorno al JSON',
  AI.interpreta('Ecco il risultato: {"seoTitolo":"Y"} spero vada bene').seoTitolo === 'Y');
check('accetta parole chiave come stringa',
  AI.interpreta('{"keywords":"targa, ufficio, incisione"}').keywords.length === 3);
check('scarta i campi vuoti', !('descrizione' in AI.interpreta('{"descrizione":"   "}')));
check('taglia un titolo troppo lungo',
  AI.interpreta('{"seoTitolo":"' + 'a'.repeat(200) + '"}').seoTitolo.length <= 70);
check('limita il numero di parole chiave',
  AI.interpreta('{"keywords":' + JSON.stringify(Array.from({length:40},(_,i)=>'k'+i)) + '}').keywords.length <= 12);
let errore = false;
try{ AI.interpreta('non è json') }catch(e){ errore = /non leggibile/i.test(e.message) }
check('una risposta illeggibile dà un errore chiaro', errore);
let errore2 = false;
try{ AI.interpreta('') }catch(e){ errore2 = true }
check('risposta vuota non passa in silenzio', errore2);

console.log('\n=== 4. Non sovrascrive MAI il lavoro fatto a mano ===');
const gen = { descrizione: 'AI', seoTitolo: 'AI', seoDescrizione: 'AI', keywords: ['ai'], caratteristiche: ['ai'] };
const r1 = AI.applica(pieno, gen);
check('la descrizione scritta a mano resta', r1.prodotto.desc.it === 'Scritta a mano.');
check('il titolo scritto a mano resta', r1.prodotto.seoTitolo === 'Mio titolo');
check('le parole chiave scritte a mano restano', r1.prodotto.keywords[0] === 'mia');
check('non dichiara modifiche che non ha fatto', r1.scritti.length === 0);

const r2 = AI.applica(vuoto, gen);
check('riempie i campi vuoti', r2.prodotto.seoTitolo === 'AI' && r2.prodotto.desc.it === 'AI');
check('elenca ciò che ha scritto', r2.scritti.length === 5);
check('completa anche la versione inglese', r2.prodotto.desc.en === 'AI');
check('non altera i dati di fatto',
  r2.prodotto.price === vuoto.price && r2.prodotto.mat === vuoto.mat && r2.prodotto.id === vuoto.id);
check('non modifica l oggetto originale', vuoto.seoTitolo === undefined);

const misto = AI.applica({ ...vuoto, seoTitolo: 'Solo questo' }, gen);
check('riempie solo i buchi, uno per uno',
  misto.prodotto.seoTitolo === 'Solo questo' && misto.prodotto.seoDescrizione === 'AI');
check('senza risposta AI non cambia nulla', AI.applica(vuoto, {}).scritti.length === 0);

console.log(`\n=========== AI COMPILA: ${ok} passati, ${ko} falliti ===========\n`);
process.exit(ko ? 1 : 0);
