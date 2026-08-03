/* Test di regressione CSS: nessuna immagine di contenuto può restare invisibile,
   e nessun srcset può puntare a varianti inesistenti. */
import { readFileSync } from 'fs';
const css = readFileSync('./assets/css/components.css', 'utf8');
let pass = 0, fail = 0;
const check = (n, c, x = '') => { if (c) { pass++; console.log('  ✔ ' + n) } else { fail++; console.log('  ✖ ' + n + (x ? ' → ' + x : '')) } };

console.log('\n=== REGRESSIONE: immagini invisibili ===');
// 1. nessuna regola deve impostare opacity:0 su img.pimgph senza animazione che la riporti a 1
const zeroOpacity = [...css.matchAll(/img\.pimgph[^{]*\{([^}]*)\}/g)].map(m => m[1]);
check('nessuna regola lascia le foto prodotto a opacity:0',
  !zeroOpacity.some(b => /opacity:\s*0\b/.test(b) && !/animation:\s*imgfade/.test(b)),
  zeroOpacity.filter(b => /opacity:\s*0\b/.test(b)).join(' | '));
// 2. ogni blocco che azzera l'animazione sulle immagini deve garantire opacity:1
const animNone = [...css.matchAll(/img\.(?:pimgph|gimg|bimg)[^{]*\{([^}]*animation:\s*none[^}]*)\}/g)].map(m => m[1]);
check('ogni "animation:none" sulle immagini garantisce opacity:1',
  animNone.every(b => /opacity:\s*1/.test(b)), animNone.join(' | '));
// 3. rete di sicurezza presente
check('rete di sicurezza opacity !important presente', /img\.pimgph[^{]*\{[^}]*opacity:\s*1\s*!important/.test(css));
// 4. lo skeleton non deve stare sull'<img>
check('nessuno skeleton animato applicato agli <img>', !/img\.(pimgph|gimg|bimg)[^{]*\{[^}]*animation:\s*imgSkel/.test(css));

console.log('\n=== REGRESSIONE: srcset ===');
const utils = readFileSync('./assets/js/utils.js', 'utf8');
check('srcset non emesso senza varianti dichiarate', /if \(!ws\.length\) return '';/.test(utils));
check('srcset usa solo le larghezze presenti nella mappa', /ws\.map\(w =>/.test(utils));
check('vecchio formato array ignorato di proposito', /Array\.isArray\(mv\)/.test(utils));
const admin = readFileSync('./admin.html', 'utf8');
check('admin ricostruisce MV dai file reali', /auto-riparazione: MV viene ricostruito/.test(admin));


console.log('\n=== TEMA CHIARO: nessuna fascia scura rimasta ===');
/* La striscia scorrevole delle tecnologie restava blu notte anche a tema
   chiaro — l'unica fascia scura in mezzo a una pagina di carta. Il colore era
   scritto fisso invece che preso da una variabile, quindi il tema chiaro non
   poteva raggiungerlo. Qui si cerca lo stesso difetto ovunque: ogni fondo
   scuro scritto a mano deve avere la sua controparte chiara. */
const vars = readFileSync('./assets/css/variables.css', 'utf8');
const luminanza = h => {
  const n = h.length === 4
    ? h.slice(1).split('').map(c => parseInt(c + c, 16))
    : [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  return n[0] * 0.299 + n[1] * 0.587 + n[2] * 0.114;
};
/* Il nero dietro a un video è corretto in tutti e due i temi: le bande
   laterali di un filmato sono nere, non color carta. */
const AMMESSI = ['#ppVideo video', '.proj-video video'];
const scuriSenzaChiaro = [];
for (const m of css.matchAll(/([^{}]+)\{([^}]*background(?:-color)?:\s*(#[0-9a-f]{3,6})[^}]*)\}/gi)) {
  const selettore = m[1].trim().split(',')[0].trim();
  if (luminanza(m[3]) >= 70) continue;
  if (AMMESSI.some(a => selettore.includes(a))) continue;
  const classe = (selettore.match(/\.[a-z0-9-]+/i) || [''])[0];
  const haChiaro = classe && new RegExp('data-mode="light"\\][^{]*\\' + classe + '[^a-z0-9-]').test(vars);
  if (!haChiaro) scuriSenzaChiaro.push(selettore + ' → ' + m[3]);
}
check('ogni fondo scuro scritto a mano ha la sua versione chiara',
  scuriSenzaChiaro.length === 0, scuriSenzaChiaro.join(' | '));
check('la striscia delle tecnologie ha una versione chiara',
  /data-mode="light"\]\s*\.tech-ticker\{/.test(vars.replace(/\s+/g, m => m.includes('\n') ? '' : ' ')) ||
  /\[data-mode="light"\] \.tech-ticker\{/.test(vars));
/* su fondo chiaro il testo bianco sparisce: va ridefinito anche quello */
check('anche i testi della striscia hanno una versione chiara',
  /data-mode="light"\][^{]*\.tc-name/.test(vars) && /data-mode="light"\][^{]*\.tc-sub/.test(vars));

console.log(`\n=========== CSS/SRCSET: ${pass} passati, ${fail} falliti ===========`);
process.exit(fail ? 1 : 0);
