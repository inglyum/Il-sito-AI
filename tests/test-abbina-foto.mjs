/* Abbinamento automatico delle foto ai prodotti.
   Il rischio vero non è mancare un abbinamento: è farne uno SBAGLIATO, perché
   la foto finisce su un prodotto che non c'entra e nessuno se ne accorge.
   Per questo la maggior parte dei controlli verifica che nei casi ambigui il
   modulo si astenga. */
import * as A from '../assets/js/admin/abbina-foto.js';

let pass = 0, fail = 0;
const check = (n, c, x = '') => { if (c) { pass++; console.log('  ✔ ' + n) } else { fail++; console.log('  ✖ ' + n + (x ? ' → ' + x : '')) } };

const P = [
  { id: 7,  n: { it: 'Cake Topper Matrimonio Plexiglass', en: 'Wedding Cake Topper' } },
  { id: 12, n: { it: 'Targa Casa Personalizzata',         en: 'Custom House Plaque' } },
  { id: 40, n: { it: 'Lampada LED Personalizzata',        en: 'Custom LED Lamp' } },
];

console.log('\n=== NUMERO NEL NOME DEL FILE ===');
check('«7.webp» è il prodotto 7', A.numeroNelNome('7.webp')?.id === 7);
check('«7-g1.jpg» è una foto di gallery', A.numeroNelNome('7-g1.jpg')?.galleria === true);
check('«7.webp» è la foto principale', A.numeroNelNome('7.webp')?.galleria === false);
check('«prod-12.png» è il prodotto 12', A.numeroNelNome('prod-12.png')?.id === 12);
check('«p40.webp» è il prodotto 40', A.numeroNelNome('p40.webp')?.id === 40);
/* il caso che romperebbe tutto: le foto appena scaricate dal telefono */
check('«IMG_4821.jpg» NON è il prodotto 4821', A.numeroNelNome('IMG_4821.jpg') === null);
check('«DSC00123.JPG» non viene interpretato', A.numeroNelNome('DSC00123.JPG') === null);
check('«WhatsApp Image 2026-07-31.jpeg» non viene interpretato',
  A.numeroNelNome('WhatsApp Image 2026-07-31.jpeg') === null);
check('«Screenshot 2026-07-31 alle 10.22.png» non viene interpretato',
  A.numeroNelNome('Screenshot 2026-07-31 alle 10.22.png') === null);
check('un nome descrittivo non produce numeri', A.numeroNelNome('cake-topper.webp') === null);

console.log('\n=== ABBINAMENTO PER NUMERO ===');
check('«7.webp» va al prodotto 7', A.abbina('7.webp', P)?.id === 7);
check('è dichiarato certo', A.abbina('7.webp', P)?.sicurezza === 'certa');
/* un numero che non esiste in catalogo non deve finire sul prodotto più vicino */
check('«999.webp» non viene abbinato', A.abbina('999.webp', P) === null);

console.log('\n=== ABBINAMENTO PER NOME ===');
check('«cake-topper-matrimonio.jpg» trova il prodotto giusto',
  A.abbina('cake-topper-matrimonio.jpg', P)?.id === 7);
check('è dichiarato solo probabile',
  A.abbina('cake-topper-matrimonio.jpg', P)?.sicurezza === 'probabile');
check('«lampada-led.webp» trova la lampada', A.abbina('lampada-led.webp', P)?.id === 40);
check('«wedding-cake-topper.jpg» funziona anche in inglese',
  A.abbina('wedding-cake-topper.jpg', P)?.id === 7);
/* nel dubbio meglio non decidere */
check('«foto-bella.jpg» non viene abbinato', A.abbina('foto-bella.jpg', P) === null);
check('«personalizzata.webp» non basta: parola comune a più prodotti',
  A.abbina('personalizzata.webp', P) === null);

console.log('\n=== PIÙ FILE INSIEME ===');
const esiti = A.abbinaTutti(['7.webp', '7-g1.webp', '7-g2.webp', 'IMG_0099.jpg'], P);
check('la prima diventa la foto principale', esiti[0].abbinato.galleria === false);
check('le successive vanno in gallery',
  esiti[1].abbinato.galleria === true && esiti[2].abbinato.galleria === true);
check('quella non riconosciuta resta da scegliere', esiti[3].abbinato === null);

/* Chi trascina «7.webp» sta dicendo «questa è LA foto del prodotto 7»:
   deve diventare la principale anche se ce n'era già una. Ma il fatto che ne
   sostituisca una va detto, non nascosto. */
const conFoto = [{ id: 7, img: 'img/7.webp', n: { it: 'Cake Topper Matrimonio Plexiglass' } }];
const rimpiazzo = A.abbinaTutti(['7.webp'], conFoto)[0].abbinato;
check('«7.webp» diventa la foto principale anche se ce n\'era già una',
  rimpiazzo.galleria === false);
check('viene segnalato che sostituisce la foto esistente', rimpiazzo.sostituisce === true);
check('se non ne sostituisce nessuna non lo dice',
  A.abbinaTutti(['12.webp'], [{ id: 12, n: { it: 'Targa' } }])[0].abbinato.sostituisce === false);

const r = A.riassunto(esiti);
check('il riassunto conta gli abbinamenti', r.totale === 4 && r.abbinate === 3 && r.daScegliere === 1,
  JSON.stringify(r));

console.log(`\n=========== ABBINAMENTO FOTO: ${pass} passati, ${fail} falliti ===========`);
process.exit(fail ? 1 : 0);
