/* INGLY OS è un file solo da 107.000 righe: un errore di sintassi non fa
   rumore, spegne in silenzio l'intero blocco <script> che lo contiene — e con
   esso funzioni intere. Ne abbiamo trovati due che erano lì da tempo:
     · catch() senza parametro  → StickyTimer, BudgetTracker, BankImport morti
     · una stringa andata a capo → LaserB2B e CatalogPublish morti
   Questi controlli fanno in modo che non possa succedere di nuovo in silenzio. */
import { readFileSync, existsSync } from 'fs';
import { writeFileSync, unlinkSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

let pass = 0, fail = 0;
const check = (n, c, x='') => { if(c){pass++;console.log('  ✔ '+n)} else {fail++;console.log('  ✖ '+n+(x?' → '+x:''))} };

const FILE = 'INGLY-OS-v52-STANDALONE.html';
if(!existsSync(FILE)){ console.log('  · INGLY OS non presente, salto'); process.exit(0) }
const s = readFileSync(FILE, 'utf8');

console.log('\n=== OGNI BLOCCO DI CODICE VIENE INTERPRETATO ===');
/* I blocchi si delimitano contando le aperture: un </script> dentro una
   stringa non chiude niente, e un'espressione regolare ingenua ci cascherebbe. */
const blocchi = [];
const APRI = /<script(?![^>]*\bsrc=)[^>]*>/g;
let m;
while((m = APRI.exec(s))){
  const da = m.index + m[0].length;
  const a = s.indexOf('</script>', da);
  if(a < 0) break;
  blocchi.push({ codice: s.slice(da, a), riga: s.slice(0, da).split('\n').length });
  APRI.lastIndex = a;
}
check('i blocchi <script> si contano', blocchi.length > 50, blocchi.length + '');

const rotti = [];
for(const b of blocchi){
  if(!b.codice.trim()) continue;
  const tmp = join(tmpdir(), 'os-check-' + b.riga + '.js');
  writeFileSync(tmp, b.codice);
  try { execFileSync('node', ['--check', tmp], { stdio:'pipe' }) }
  catch(e){ rotti.push(b.riga + ': ' + String(e.stderr).split('\n').find(l=>/Error/.test(l)||'').slice(0,80)) }
  finally { try{ unlinkSync(tmp) }catch(_){} }
}
check('nessun blocco di codice è rotto', rotti.length === 0, rotti.slice(0,3).join(' | '));

console.log('\n=== GLI ERRORI CHE ABBIAMO GIÀ PAGATO ===');
check('nessun catch() senza parametro', !/catch\(\)\s*\{/.test(s));
/* Sulla stringa lasciata aperta non c'è un'euristica onesta: gli apostrofi
   italiani («l'utente») sono indistinguibili da un apice che apre una stringa
   senza interpretare tutto il file. Il controllo che conta è già quello sopra —
   node --check per blocco ha trovato proprio questo difetto. Un test che grida
   al lupo su ogni apostrofo è peggio di nessun test. */

console.log('\n=== LE FUNZIONI CHE ERANO MORTE ===');
for(const nome of ['StickyTimer','BudgetTracker','BankImport','LaserB2B','CatalogPublish'])
  check(nome + ' è definita', new RegExp('(const|var|window\\.)\\s*' + nome + '\\s*=').test(s));

console.log('\n=== I QUATTRO PREVENTIVATORI STANNO INSIEME ===');
/* Erano sparsi fra «Preventivi» e «Magazzino»: chi cercava un preventivo 3D
   lo cercava fra gli articoli di magazzino. */
const gruppo = s.slice(s.indexOf("toggle('ng-pipeline')"), s.indexOf("toggle('ng-stock')"));
for(const sez of ['quoter','lasercalc','print3d','apparel'])
  check('«' + sez + '» è nel gruppo Preventivi', gruppo.includes(`data-section="${sez}"`));

console.log('\n=== IL PARCO MACCHINE È QUELLO VERO ===');
check('Bambu Lab P2S nel preventivatore 3D', /id:'bambu-p2s'/.test(s));
check('xTool P3: piano 915×458 come da scheda', /model:'P3 CO₂ 80W'[\s\S]{0,80}area:'915×458'/.test(s));
check('xTool F2: piano 115×115 come da scheda', /model:'F2',[\s\S]{0,80}area:'115×115'/.test(s));

console.log('\n=== MULTILINGUA ===');
check('il motore è iniettato', s.includes('INGLY-LINGUA:INIZIO'));
check('è iniettato alla fine del documento, non dentro una stringa',
  s.indexOf('INGLY-LINGUA:INIZIO') > s.lastIndexOf('</html>') - 60000);
if(existsSync('data/os-i18n.json')){
  const cat = JSON.parse(readFileSync('data/os-i18n.json','utf8')).it_en;
  const tot = Object.keys(cat).length, fatte = Object.values(cat).filter(Boolean).length;
  check('il catalogo dei testi esiste', tot > 1000, tot + ' voci');
  console.log(`  · tradotte ${fatte}/${tot} (${Math.round(fatte/tot*100)}%) — le restanti si aggiungono in data/os-i18n.json`);
}

console.log(`\n=========== INGLY OS: ${pass} passati, ${fail} falliti ===========`);
process.exit(fail ? 1 : 0);
