#!/usr/bin/env node
/* ============ SERVER DI SVILUPPO ============
   Serve il sito in locale riproducendo il comportamento di GitHub Pages.

   Perché serve: il sito usa indirizzi puliti (/shop, /product?id=7) gestiti
   dalla History API. Un server statico qualsiasi risponde 404 su quegli
   indirizzi, mentre GitHub Pages serve il file 404.html, che rimanda alla home
   ricostruendo il percorso. Senza questa regola, in locale funzionerebbe solo
   la home e ogni indirizzo interno sembrerebbe rotto — un falso allarme.

   Uso:  node scripts/dev-server.mjs [porta]
   Poi:  http://localhost:8080
*/
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, resolve } from 'node:path';

const ROOT = resolve(process.argv[2] && !/^\d+$/.test(process.argv[2]) ? process.argv[2] : '.');
const PORT = Number(process.argv.find(a => /^\d+$/.test(a)) || 8080);

const TYPES = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json',
  '.svg':'image/svg+xml', '.webp':'image/webp', '.avif':'image/avif',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif',
  '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2',
  '.xml':'application/xml; charset=utf-8', '.txt':'text/plain; charset=utf-8',
  '.mp4':'video/mp4',
};

/* impedisce di uscire dalla cartella del sito con percorsi tipo ../../etc/passwd */
function safePath(urlPath){
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const full = join(ROOT, clean);
  return full.startsWith(ROOT) ? full : null;
}

async function send(res, status, body, type){
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

createServer(async (req, res) => {
  let p = safePath(req.url || '/');
  if(!p) return send(res, 403, 'Forbidden', 'text/plain');

  try{
    const s = await stat(p);
    if(s.isDirectory()){
      /* GitHub Pages rimanda /product/7 a /product/7/ : senza la barra finale
         i percorsi relativi della pagina si risolverebbero un livello più su. */
      const solo = (req.url || '/').split('?')[0];
      if(!solo.endsWith('/')){
        res.writeHead(301, { Location: solo + '/' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '') });
        return res.end();
      }
      p = join(p, 'index.html');
    }
    const body = await readFile(p);
    return send(res, 200, body, TYPES[extname(p).toLowerCase()] || 'application/octet-stream');
  }catch{
    /* file assente: come GitHub Pages, rispondiamo con 404.html (che rimanda
       alla home ricostruendo l'indirizzo). Lo status resta 404, come in reale. */
    try{
      const body = await readFile(join(ROOT, '404.html'));
      return send(res, 404, body, 'text/html; charset=utf-8');
    }catch{
      return send(res, 404, 'Not found', 'text/plain');
    }
  }
}).listen(PORT, () => {
  console.log(`\n  Sito INGLY in ascolto su  http://localhost:${PORT}`);
  console.log(`  Admin                     http://localhost:${PORT}/admin.html`);
  console.log(`  Cartella servita          ${ROOT}`);
  console.log(`\n  Ctrl+C per fermare.\n`);
});
