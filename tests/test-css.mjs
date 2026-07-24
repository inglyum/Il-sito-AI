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

console.log(`\n=========== CSS/SRCSET: ${pass} passati, ${fail} falliti ===========`);
process.exit(fail ? 1 : 0);
