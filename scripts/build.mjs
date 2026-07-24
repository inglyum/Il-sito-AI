/* Build: (a) rigenera i data/*.js legacy DAI JSON (fonte di verità unica);
   (b) bundle di fallback per file://; (c) dist/ minificata. */
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, readdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

const J = f => JSON.parse(readFileSync('data/'+f+'.json','utf8'));
const cfg=J('config'), D=J('texts'), SOC=J('social'), P=J('products'), CATS=J('categories'), C=J('content');
writeFileSync('data/config.js',`/* GENERATO dai JSON — non modificare a mano */\nwindow.INGLY=window.INGLY||{};\nwindow.INGLY.CONFIG=${JSON.stringify(cfg)};\n`);
writeFileSync('data/i18n.js',`/* GENERATO dai JSON */\nwindow.INGLY=window.INGLY||{};\nwindow.INGLY.D=${JSON.stringify(D)};\n`);
writeFileSync('data/socials.js',`/* GENERATO dai JSON */\nwindow.INGLY=window.INGLY||{};\nwindow.INGLY.SOCIALS=${JSON.stringify(SOC)};\n`);
writeFileSync('data/catalog.js',`/* GENERATO dai JSON */\nwindow.INGLY=window.INGLY||{};\nObject.assign(window.INGLY,${JSON.stringify({P,CATS,...C})},{P:${JSON.stringify(P)},CATS:${JSON.stringify(CATS)}});\n`);

await build({ entryPoints:['assets/js/app.js'], bundle:true, minify:true, format:'iife',
  target:'es2018', outfile:'assets/js/app.fallback.js',
  banner:{ js:'if(!window.__INGLY_ESM__&&!document.documentElement.dataset.inglyBooted){document.documentElement.dataset.inglyBooted="1";' },
  footer:{ js:'}' } });

rmSync('dist',{recursive:true,force:true}); mkdirSync('dist',{recursive:true});
for (const f of ['index.html','admin.html','robots.txt','sitemap.xml','manifest.webmanifest','favicon','assets/images','data','README.md','img'].filter(f=>existsSync(f)))
  cpSync(f,'dist/'+f,{recursive:true});
await build({ entryPoints:['assets/js/app.js'], bundle:true, minify:true, format:'esm', target:'es2018', outfile:'dist/assets/js/app.js' });
cpSync('assets/js/app.fallback.js','dist/assets/js/app.fallback.js');
const css = readdirSync('assets/css').filter(f=>f.endsWith('.css'));
await build({ entryPoints: css.map(f=>'assets/css/'+f), minify:true, outdir:'dist/assets/css' });
console.log('✔ legacy js rigenerati dai JSON + fallback + dist/');
