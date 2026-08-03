/* Sfondi selezionabili dall'Admin, uno per tema.
   Il rischio qui non è che uno sfondo sia brutto: è che una scelta sbagliata,
   vecchia o inventata lasci il sito senza fondo o con del testo illeggibile.
   Per questo quasi tutti i controlli riguardano il ritorno al predefinito. */
import * as S from '../assets/js/sfondi.js';
import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const check = (n, c, x = '') => { if (c) { pass++; console.log('  ✔ ' + n) } else { fail++; console.log('  ✖ ' + n + (x ? ' → ' + x : '')) } };

console.log('\n=== IL CATALOGO ===');
check('esistono i due temi', S.TEMI.length === 2 && S.TEMI.includes('chiaro') && S.TEMI.includes('scuro'));
for (const t of S.TEMI) {
  const l = S.elenco(t);
  check(t + ': tre sfondi disponibili', l.length === 3, l.length + '');
  /* il primo deve essere quello di sempre, così «non scegliere» è uno stato valido */
  check(t + ': il primo è il predefinito', l[0].id === 'default');
  check(t + ': due sono animati', l.filter(x => x.anima).length === 2);
  check(t + ': ognuno ha nome e spiegazione',
    l.every(x => x.nome && x.descrizione && x.descrizione.length > 20));
  /* l'id finisce in un attributo HTML e in un selettore CSS */
  check(t + ': gli id sono utilizzabili in un attributo',
    l.every(x => /^[a-z][a-z0-9-]*$/.test(x.id)), l.map(x => x.id).join(','));
  check(t + ': nessun id ripetuto', new Set(l.map(x => x.id)).size === l.length);
}
check('un tema inesistente non fa esplodere niente', S.elenco('viola').length === 0);

console.log('\n=== VALIDITÀ ===');
check('uno sfondo del catalogo è valido', S.valido('scuro', 'aurora'));
check('uno sfondo di un altro tema NON è valido per questo', !S.valido('scuro', 'alba'));
check('un nome inventato non è valido', !S.valido('scuro', 'qualsiasi'));
check('info() ripiega sul predefinito', S.info('scuro', 'inesistente').id === 'default');

console.log('\n=== LA SCELTA, COMUNQUE SIANO I DATI ===');
check('una scelta buona viene rispettata',
  S.scelta({ sfondi: { chiaro: 'alba', scuro: 'nebbia' } }).scuro === 'nebbia');
/* i casi che romperebbero il sito */
check('configurazione vuota → predefinito', S.scelta({}).scuro === 'default');
check('nessuna configurazione → predefinito', S.scelta().chiaro === 'default');
check('valore inventato → predefinito', S.scelta({ sfondi: { scuro: 'boh' } }).scuro === 'default');
check('sfondo del tema sbagliato → predefinito',
  S.scelta({ sfondi: { scuro: 'alba' } }).scuro === 'default');
check('sfondi non è un oggetto → predefinito', S.scelta({ sfondi: 'aurora' }).scuro === 'default');
check('valori nulli → predefinito',
  S.scelta({ sfondi: { chiaro: null, scuro: undefined } }).chiaro === 'default');
/* il vecchio formato: CONFIG.siteBg era una stringa sola, senza temi */
check('la vecchia configurazione siteBg non manda il sito in bianco',
  S.scelta({ siteBg: 'sunset' }).scuro === 'default');

console.log('\n=== ATTRIBUTI SU <html> ===');
const att = S.attributi({ sfondi: { chiaro: 'nuvole', scuro: 'aurora' } });
/* servono entrambi: il tema si cambia dal sito senza ricaricare */
check('dichiara lo sfondo di tutti e due i temi',
  att['data-sfondo-chiaro'] === 'nuvole' && att['data-sfondo-scuro'] === 'aurora');
check('senza scelta dichiara comunque i due predefiniti',
  S.attributi({})['data-sfondo-scuro'] === 'default');

console.log('\n=== IL CSS CHE LI DISEGNA ===');
const css = readFileSync('assets/css/pages.css', 'utf8');
for (const t of S.TEMI) {
  for (const sf of S.elenco(t).filter(x => x.id !== 'default')) {
    check('esiste la regola per «' + sf.id + '» (' + t + ')',
      new RegExp('data-sfondo-' + t + '="' + sf.id + '"').test(css));
  }
}
/* lo strato sta DIETRO e non intercetta i clic: se lo facesse, coprirebbe
   tutto il sito e nessun pulsante funzionerebbe più */
check('lo strato sta dietro al contenuto', /body::after\{[^}]*z-index:-1/.test(css.replace(/\s+/g, '')));
check('lo strato non intercetta i clic', /body::after\{[^}]*pointer-events:none/.test(css.replace(/\s+/g, '')));
/* body::before è la griglia: non deve essere stata sovrascritta */
check('la griglia di sfondo esistente non è stata toccata', /body::before\{/.test(css.replace(/\s+/g, '')));
check('chi chiede meno animazioni le riceve ferme',
  /prefers-reduced-motion:reduce\)\{body::after\{animation:none!important/.test(css.replace(/\s+/g, '')));
check('in stampa lo sfondo sparisce', /@mediaprint\{body::after\{display:none/.test(css.replace(/\s+/g, '')));

console.log('\n=== NESSUNA LIBRERIA ESTERNA ===');
/* Vanta e three.js pesano oltre mezzo megabyte e vanno scaricati da un server
   altrui: abbiamo appena tolto 87KB di JavaScript morto, non è il caso di
   rimetterne sei volte tanto per uno sfondo. */
const indice = readFileSync('index.html', 'utf8');
check('nessun three.js', !/three(\.min)?\.js/i.test(indice));
check('nessun vanta', !/vanta/i.test(indice));
check('lo sfondo non scarica niente da fuori',
  !/cdn|unpkg|jsdelivr/i.test(css.slice(css.indexOf('SFONDI SELEZIONABILI'))));

console.log('\n=== I DATI PUBBLICATI ===');
const cfg = JSON.parse(readFileSync('data/config.json', 'utf8'));
const sc = S.scelta(cfg);
check('la configurazione pubblicata è valida',
  S.valido('chiaro', sc.chiaro) && S.valido('scuro', sc.scuro), JSON.stringify(sc));

console.log(`\n=========== SFONDI: ${pass} passati, ${fail} falliti ===========`);
process.exit(fail ? 1 : 0);
