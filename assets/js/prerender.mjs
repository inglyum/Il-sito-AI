/* ============ PRE-RENDER ============
   Genera una pagina prodotto già scritta nell'HTML, invece di lasciarla
   costruire al JavaScript dopo il caricamento.

   PERCHÉ SERVE — è il punto centrale dell'obiettivo «AI-first».
   Googlebot esegue JavaScript, ma i crawler dei motori conversazionali quasi
   mai: GPTBot, PerplexityBot, ClaudeBot e simili leggono l'HTML così com'è
   arriva. Oggi quell'HTML è un guscio vuoto, quindi per loro le schede prodotto
   semplicemente NON esistono. Nessun dato strutturato e nessun titolo possono
   rimediare a una pagina senza testo.

   COME — la pagina generata è lo stesso index.html con quattro differenze:
     1. <base href="../../">  → il file vive in /product/<id>/, mentre tutti i
        riferimenti del sito sono relativi alla radice. Il tag base li rimette
        in riga, comprese le fetch dei dati, senza toccare una sola riga del
        resto del progetto e senza rompere l'anteprima in sottocartella.
     2. titolo, descrizione, canonical e Open Graph del prodotto già scritti.
     3. il JSON-LD del prodotto già presente.
     4. il contenuto vero (nome, prezzo, materiale, descrizione, immagini)
        dentro la pagina prodotto, marcata come attiva.

   Il blocco pre-scritto porta id="prerender": all'avvio l'applicazione lo
   rimuove e disegna la versione interattiva. Chi non esegue JavaScript legge il
   contenuto; chi lo esegue non vede nulla di diverso da oggi.

   Funzioni pure: nessun DOM, nessuna rete. Verificate in
   tests/test-prerender.mjs ed eseguibili da riga di comando. */

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const pulisci = t => String(t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export const prezzoEur = n =>
  '€' + Number(n || 0).toFixed(2).replace('.', ',');

/* Percorso del file generato per un prodotto. Cartella + index.html così
   l'indirizzo resta pulito: /product/7/ */
export const percorsoProdotto = id => 'product/' + id + '/index.html';
export const urlProdotto = (id, base = '') => base + '/product/' + id + '/';

/* Il contenuto leggibile senza JavaScript. */
export function contenutoProdotto(p, opt = {}){
  const { L = 'it', categoria = '', materiale = '', base = '', cartella = 'img/' } = opt;
  const nome = (p.n && p.n[L]) || (p.n && p.n.it) || ('Prodotto ' + p.id);
  const desc = pulisci((p.desc && (p.desc[L] || p.desc.it)) || '');
  const imgs = [p.img || (cartella + p.id + '.webp'), ...(p.gallery || [])]
    .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  const righe = [];
  righe.push('<nav aria-label="Percorso"><a href="' + esc(base) + '/">Home</a> / <a href="' + esc(base) + '/shop">Catalogo</a>'
    + (categoria ? ' / ' + esc(categoria) : '') + '</nav>');
  righe.push('<h1>' + esc(nome) + '</h1>');
  righe.push('<p class="pr-prezzo"><strong>' + esc(prezzoEur(p.price)) + '</strong></p>');
  if(desc) righe.push('<p>' + esc(desc) + '</p>');

  const dati = [];
  if(materiale) dati.push('<li><strong>Materiale:</strong> ' + esc(materiale) + '</li>');
  if(categoria) dati.push('<li><strong>Categoria:</strong> ' + esc(categoria) + '</li>');
  if(p.prod)    dati.push('<li><strong>Produzione:</strong> ' + esc(p.prod) + ' giorni</li>');
  if(p.sku)     dati.push('<li><strong>Codice:</strong> ' + esc(p.sku) + '</li>');
  if(Array.isArray(p.misure)) p.misure.forEach(r => {
    if(r && r[0] && r[1]) dati.push('<li><strong>' + esc(r[0]) + ':</strong> ' + esc(r[1]) + '</li>');
  });
  if(dati.length) righe.push('<ul class="pr-dati">' + dati.join('') + '</ul>');

  righe.push(imgs.map(u =>
    '<img src="' + esc(u) + '" alt="' + esc(nome + ' — ' + (materiale || 'INGLY DESIGN')) + '" width="800" height="800" loading="lazy">'
  ).join(''));

  /* Il blocco è nascosto alla vista: il layout vero lo disegna l'applicazione.
     Resta però nel documento, quindi leggibile da chi non esegue JavaScript.
     Non è testo nascosto per ingannare i motori: è lo STESSO contenuto che
     l'utente vede una volta caricata la pagina. */
  return '<div id="prerender" data-prerender="' + esc(p.id) + '" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">'
    + righe.join('\n') + '</div>';
}

/* Meta e JSON-LD da inserire nell'intestazione. */
export function testaProdotto(p, opt = {}){
  const { L = 'it', base = '', titolo = '', descrizione = '', jsonld = null, cartella = 'img/' } = opt;
  const nome = (p.n && p.n[L]) || (p.n && p.n.it) || ('Prodotto ' + p.id);
  const url = urlProdotto(p.id, base);
  const img = base + '/' + String(p.img || (cartella + p.id + '.webp')).replace(/^\/+/, '');
  const t = titolo || nome;
  const d = pulisci(descrizione || (p.desc && (p.desc[L] || p.desc.it)) || '');

  const out = [
    '<base href="../../">',
    '<title>' + esc(t) + '</title>',
    '<meta name="description" content="' + esc(d) + '">',
    '<link rel="canonical" href="' + esc(url) + '">',
    '<meta property="og:type" content="product">',
    '<meta property="og:title" content="' + esc(t) + '">',
    '<meta property="og:description" content="' + esc(d) + '">',
    '<meta property="og:url" content="' + esc(url) + '">',
    '<meta property="og:image" content="' + esc(img) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + esc(t) + '">',
    '<meta name="twitter:description" content="' + esc(d) + '">',
  ];
  if(jsonld) out.push('<script type="application/ld+json">' + JSON.stringify(jsonld).replace(/</g, '\\u003c') + '</script>');
  return out.join('\n');
}

/* Assembla la pagina completa partendo dal guscio index.html. */
export function paginaProdotto(indexHtml, p, opt = {}){
  let html = String(indexHtml);

  /* 1 — via dal guscio i tag che stiamo per riscrivere. Toglierli PRIMA di
     inserire i nostri evita di ritrovarsi con due <title> o due canonical:
     in quel caso vincerebbe il primo, che è quello sbagliato. */
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/i, '');
  html = html.replace(/<link rel="canonical"[^>]*>\s*/i, '');
  html = html.replace(/<meta name="description"[^>]*>\s*/i, '');
  html = html.replace(/<meta property="og:(?:type|title|description|url|image)"[^>]*>\s*/gi, '');
  html = html.replace(/<meta name="twitter:(?:card|title|description|image)"[^>]*>\s*/gi, '');

  /* 2 — intestazione nostra. Il tag <base> deve precedere QUALUNQUE
     riferimento relativo, altrimenti i tag già incontrati si risolvono
     sull'indirizzo sbagliato: va quindi subito dopo <head>. */
  html = html.replace(/<head([^>]*)>/i, m => m + '\n' + testaProdotto(p, opt));

  /* 3 — contenuto e pagina attiva */
  html = html.replace(/<section class="page" id="page-product">/i,
    '<section class="page active" id="page-product">\n' + contenutoProdotto(p, opt));
  /* la home non deve essere attiva: due pagine attive si sovrappongono */
  html = html.replace(/<section class="page active" id="page-home">/i,
    '<section class="page" id="page-home">');

  return html;
}
