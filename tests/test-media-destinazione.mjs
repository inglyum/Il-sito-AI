/* Test della destinazione immagini — funzioni pure, nessun browser.
   Il rischio vero qui è che l'anteprima mostrata all'utente e il file creato
   davvero dalla pubblicazione divergano: direbbe una bugia a chi carica. */
import * as D from '../assets/js/admin/media-destinazione.js';

let ok = 0, ko = 0;
const check = (nome, cond) => { if(cond){ ok++; console.log('  ✔ ' + nome) } else { ko++; console.log('  ✖ ' + nome) } };

const dati = {
  prodotti: [{ id:1, n:{ it:'Insegna con Nome' } }, { id:7, n:{ it:'Cake Topper' } }],
  portfolio: [['🪵', { it:'Mappa Topografica' }], ['✨', { it:'Targa Ufficio' }]],
  categorie: [{ id:'casa', ic:'🏠', n:{ it:'Casa & Arredamento' } }],
};

console.log('\n=== 1. Riconoscimento del tipo ===');
check('prodotto', D.tipoDi('p:7') === 'p');
check('portfolio esistente', D.tipoDi('t:1') === 't');
check('portfolio nuovo', D.tipoDi('t:new') === 't');
check('categoria', D.tipoDi('c:casa') === 'c');
check('chi siamo', D.tipoDi('about') === 'about');
check('libreria', D.tipoDi('free') === 'free');
check('valore assente → libreria', D.tipoDi(undefined) === 'free');

console.log('\n=== 2. Il ruolo serve solo ai prodotti ===');
check('prodotto sì', D.vuoleRuolo('p') === true);
check('portfolio no', D.vuoleRuolo('t') === false);
check('categoria no', D.vuoleRuolo('c') === false);
check('libreria no', D.vuoleRuolo('free') === false);

console.log('\n=== 3. Percorso creato ===');
check('foto principale prodotto', D.percorso('p:7', { ext:'webp' }) === 'img/7.webp');
check('gallery prodotto, primo libero',
  D.percorso('p:7', { ext:'webp', ruolo:'gal', galleryEsistenti:[] }) === 'img/7-g1.webp');
check('gallery prodotto, salta gli occupati',
  D.percorso('p:7', { ext:'webp', ruolo:'gal', galleryEsistenti:['img/7-g1.webp','img/7-g2.webp'] }) === 'img/7-g3.webp');
check('copertina categoria', D.percorso('c:casa', { ext:'webp' }) === 'img/cat-casa.webp');
check('tessera portfolio esistente', D.percorso('t:1', { ext:'webp' }) === 'img/port-2.webp');
check('nuova tessera portfolio va in coda',
  D.percorso('t:new', { ext:'webp', portfolio:dati.portfolio }) === 'img/port-3.webp');
check('chi siamo', D.percorso('about', { ext:'webp' }) === 'img/about.webp');
check('libreria usa il nome del file',
  D.percorso('free', { ext:'webp', nomeFile:'Collezione Limitata Lusso (14).png' }) === 'img/collezione-limitata-lusso-14.webp');
check('estensione rispettata (svg non convertito)',
  D.percorso('p:1', { ext:'svg' }) === 'img/1.svg');

console.log('\n=== 4. Nome file pulito ===');
check('spazi e parentesi diventano trattini', D.slug('Foto Bella (2).png') === 'foto-bella-2');
check('accenti rimossi', D.slug('Città Perduta.jpg') === 'citta-perduta');
check('nome vuoto ha un ripiego', D.slug('') === 'immagine');
check('niente trattini agli estremi', !/^-|-$/.test(D.slug('---x---.png')));
check('lunghezza limitata', D.slug('a'.repeat(200)).length <= 60);

console.log('\n=== 5. Spiegazione a parole ===');
const dsc = (dest, ruolo) => D.descrizione(dest, { ...dati, ruolo });
check('principale nomina il prodotto', dsc('p:7','main').includes('Cake Topper'));
check('gallery lo dice esplicitamente', /gallery/i.test(dsc('p:7','gal')));
check('principale + gallery cita entrambi',
  /principale/i.test(dsc('p:7','both')) && /gallery/i.test(dsc('p:7','both')));
check('tessera portfolio nominata', dsc('t:0').includes('Mappa Topografica'));
check('nuova tessera è chiara', /nuova tessera/i.test(dsc('t:new')));
check('categoria nominata', dsc('c:casa').includes('Casa & Arredamento'));
check('libreria avvisa che non è collegata', /non usata/i.test(dsc('free')));
check('prodotto inesistente non rompe la frase', typeof dsc('p:999','main') === 'string');

console.log('\n=== 6. Elenchi per il menù ===');
check('prodotti elencati', D.elementiPerTipo('p', dati).length === 2);
check('portfolio ha «nuova tessera» in cima',
  D.elementiPerTipo('t', dati)[0].valore === 't:new');
check('portfolio elenca anche le esistenti', D.elementiPerTipo('t', dati).length === 3);
check('categorie elencate con icona', D.elementiPerTipo('c', dati)[0].etichetta.includes('🏠'));
check('libreria è una scelta unica', D.elementiPerTipo('free', dati).length === 1);
check('ogni voce ha valore ed etichetta',
  ['p','t','c','about','free'].every(t => D.elementiPerTipo(t, dati).every(v => v.valore && v.etichetta)));

console.log('\n=== 7. Coerenza fra tipi ed elenchi ===');
check('ogni tipo dichiarato produce almeno una scelta',
  D.TIPI.every(t => D.elementiPerTipo(t.id, dati).length > 0));
check('ogni tipo ha icona, nome e aiuto',
  D.TIPI.every(t => t.icona && t.nome && t.aiuto));
check('i valori generati si rileggono nello stesso tipo',
  D.TIPI.every(t => D.elementiPerTipo(t.id, dati).every(v => D.tipoDi(v.valore) === t.id)));

console.log('\n=== DUE FILE CON LO STESSO NOME ===');
/* Caricando decine di foto insieme, due «IMG_1234.jpg» presi da cartelle
   diverse sono la norma. L'anteprima prometteva a entrambi lo stesso
   percorso: si vedevano venti righe e ne arrivavano meno. */
const p1 = D.percorso('free', { ext:'webp', nomeFile:'IMG_1234.jpg', occupati:[] });
const p2 = D.percorso('free', { ext:'webp', nomeFile:'IMG_1234.jpg', occupati:[p1] });
const p3 = D.percorso('free', { ext:'webp', nomeFile:'IMG_1234.jpg', occupati:[p1, p2] });
check('il primo prende il nome pulito', p1 === 'img/img-1234.webp', p1);
check('il secondo non ruba il posto al primo', p2 !== p1, p2);
check('il terzo nemmeno', p3 !== p1 && p3 !== p2, p3);
check('i suffissi sono leggibili', p2 === 'img/img-1234-2.webp' && p3 === 'img/img-1234-3.webp', p2 + ' ' + p3);
check('senza conflitti niente suffisso inutile',
  D.percorso('free', { ext:'webp', nomeFile:'targa.png', occupati:['img/altro.webp'] }) === 'img/targa.webp');
/* Le altre destinazioni DEVONO invece sovrascrivere: la foto principale del
   prodotto 7 è «img/7.webp» e basta, altrimenti il sito non la troverebbe. */
check('la foto di un prodotto resta al suo posto anche se già esiste',
  D.percorso('p:7', { ext:'webp', occupati:['img/7.webp'] }) === 'img/7.webp');
check('la copertina di una categoria resta al suo posto',
  D.percorso('c:arredamento', { ext:'webp', occupati:['img/cat-arredamento.webp'] }) === 'img/cat-arredamento.webp');

console.log(`\n=========== MEDIA DESTINAZIONE: ${ok} passati, ${ko} falliti ===========\n`);
process.exit(ko ? 1 : 0);
