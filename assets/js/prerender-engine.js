/* ============ PRERENDER ENGINE ============
   Genera pagine HTML STATICHE con il contenuto già scritto dentro.

   Il problema che risolve: il sito costruisce tutto con JavaScript. Google
   esegue JavaScript, ma i crawler dei motori AI — GPTBot, PerplexityBot,
   ClaudeBot, Google-Extended — nella quasi totalità dei casi NO: scaricano
   l'HTML e leggono quello. Oggi trovano una pagina vuota. Nessun dato
   strutturato e nessun titolo possono rimediare a una pagina senza testo.

   Cosa produce: per ogni prodotto e per ogni pagina un file vero
   (/product/7/index.html) che contiene titolo, descrizione, prezzo, materiale,
   misure e JSON-LD già scritti, PIÙ l'avvio normale del sito. Chi arriva con un
   browser vede il sito di sempre — l'HTML statico viene sostituito appena
   l'applicazione parte. Chi arriva senza JavaScript legge comunque tutto.

   Perché l'indirizzo è cambiato in /product/7/ invece di /product?id=7:
   una query string non può essere un file su disco. Su un hosting statico è
   l'unico modo di avere davvero una pagina per prodotto.

   Funzioni pure: nessun DOM, nessun filesystem. Testabili da riga di comando. */

const esc = t => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const testo = t => String(t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* prezzo in formato italiano, senza dipendere da Intl (che in Node e nel
   browser può avere dati locali diversi) */
export function prezzo(n){
  const v = Number(n || 0);
  return '€' + v.toFixed(2).replace('.', ',');
}

/* Indirizzo canonico di una pagina o di un prodotto. */
export function indirizzo(pagina, opt = {}){
  const { base = '', id = null } = opt;
  if(pagina === 'home') return base + '/';
  if(pagina === 'product' && id != null) return base + '/product/' + id + '/';
  return base + '/' + pagina;
}

/* Il corpo leggibile di una scheda prodotto.
   Deve contenere i FATTI che un motore AI cita: cosa è, di che materiale,
   quanto costa, quanto ci vuole, che misure ha. */
export function corpoProdotto(p = {}, opt = {}){
  const { L = 'it', categoria = '', materiale = '', azienda = 'INGLY DESIGN' } = opt;
  const nome = (p.n && p.n[L]) || '';
  const desc = testo((p.desc && p.desc[L]) || '');
  const righe = [];
  righe.push('<h1>' + esc(nome) + '</h1>');
  if(desc) righe.push('<p>' + esc(desc) + '</p>');

  const fatti = [];
  if(materiale) fatti.push(['Materiale', materiale]);
  if(categoria) fatti.push(['Categoria', categoria]);
  if(p.price != null) fatti.push(['Prezzo', prezzo(p.price)]);
  if(p.prod) fatti.push(['Tempo di produzione', p.prod + (p.prod === 1 ? ' giorno' : ' giorni')]);
  if(p.sku) fatti.push(['Codice', p.sku]);
  if(fatti.length){
    righe.push('<dl>' + fatti.map(([k, v]) =>
      '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>').join('') + '</dl>');
  }
  if(Array.isArray(p.misure) && p.misure.length){
    righe.push('<h2>Misure e dettagli</h2><table><tbody>' +
      p.misure.filter(r => r && r[0]).map(r =>
        '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1] || '') + '</td></tr>').join('') +
      '</tbody></table>');
  }
  righe.push('<p>Realizzato da ' + esc(azienda) + '.</p>');
  return righe.join('\n');
}

/* Il corpo di una pagina del sito: elenco leggibile di ciò che contiene. */
export function corpoPagina(pagina, opt = {}){
  const { L = 'it', titolo = '', descrizione = '', prodotti = [], categorie = [], base = '' } = opt;
  const righe = ['<h1>' + esc(titolo || pagina) + '</h1>'];
  if(descrizione) righe.push('<p>' + esc(testo(descrizione)) + '</p>');

  if(pagina === 'shop' && prodotti.length){
    righe.push('<h2>Catalogo</h2><ul>' + prodotti.map(p =>
      '<li><a href="' + esc(indirizzo('product', { base, id: p.id })) + '">' +
      esc((p.n && p.n[L]) || '') + '</a> — ' + esc(prezzo(p.price)) + '</li>').join('') + '</ul>');
  }
  if(pagina === 'shop' && categorie.length){
    righe.push('<h2>Categorie</h2><ul>' + categorie.map(c =>
      '<li>' + esc((c.n && c.n[L]) || c.id) + '</li>').join('') + '</ul>');
  }
  return righe.join('\n');
}

/* Inserisce contenuto e metadati nel guscio di index.html.
   NON riscrive la pagina: sostituisce solo i punti necessari, così ogni
   modifica futura a index.html (script, stili, struttura) resta valida senza
   dover aggiornare anche questo generatore. */
export function componi(guscio, opt = {}){
  const { titolo = '', descrizione = '', canonico = '', contenuto = '', jsonld = null, base = '/' } = opt;
  let out = String(guscio || '');

  /* Una pagina in /product/7/ è due livelli sotto la radice: senza correzione
     tutti i percorsi relativi puntano nel posto sbagliato.
     Si risolve con un solo tag <base>, non riscrivendo gli attributi uno per
     uno: <base> vale anche per le richieste fatte da JavaScript — ed è lì il
     punto critico, perché data-loader.js scarica data/*.json con un percorso
     relativo che nessuna riscrittura dell'HTML potrebbe correggere.
     È relativo (../../) e non assoluto (/), così regge anche quando il sito
     è pubblicato in una sottocartella, come nelle anteprime su GitHub Pages.
     Deve stare per primo nel <head>: vale solo per ciò che viene dopo. */
  const prof = canonico.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+|\/+$/g, '');
  const risali = prof ? '../'.repeat(prof.split('/').length) : './';
  out = out.replace(/<head(\s[^>]*)?>/i, m => m + '\n<base href="' + risali + '">');

  out = out.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + esc(titolo) + '</title>');
  out = out.replace(/<meta name="description" content="[^"]*">/i,
    '<meta name="description" content="' + esc(descrizione) + '">');
  out = out.replace(/<link rel="canonical" href="[^"]*">/i,
    '<link rel="canonical" href="' + esc(canonico) + '">');
  out = out.replace(/<meta property="og:url" content="[^"]*">/i,
    '<meta property="og:url" content="' + esc(canonico) + '">');
  out = out.replace(/<meta property="og:title" content="[^"]*">/i,
    '<meta property="og:title" content="' + esc(titolo) + '">');
  out = out.replace(/<meta property="og:description" content="[^"]*">/i,
    '<meta property="og:description" content="' + esc(descrizione) + '">');

  if(jsonld){
    /* Il guscio porta già un blocco LocalBusiness di base. Il grafo che
       costruiamo qui lo contiene e lo arricchisce: va SOSTITUITO, non
       aggiunto, altrimenti la pagina statica dichiara due volte la stessa
       azienda e Google si trova entità in conflitto. */
    out = out.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/gi, '');
    out = out.replace(/<\/head>/i,
      '<script type="application/ld+json" id="ld-prerender">' + JSON.stringify(jsonld) + '</script>\n</head>');
  }

  /* Il contenuto statico vive in un contenitore che l'applicazione rimuove
     appena parte: nessuna duplicazione visibile per chi usa un browser. */
  const blocco = '<div id="prerender" data-prerender="1">' + contenuto + '</div>';
  out = out.replace(/<main>/i, '<main>\n' + blocco);
  return out;
}

/* Elenco completo delle pagine da generare, con il percorso del file. */
export function elenco(dati = {}, opt = {}){
  const { prodotti = [], verticali = [],
          pagine = ['shop','digital','business','portfolio','about','faq','quote'] } = dati;
  const out = [{ file: 'index.html', pagina: 'home', id: null }];
  for(const pg of pagine) out.push({ file: pg + '/index.html', pagina: pg, id: null });
  /* Le pagine di settore stanno SOTTO business (/business/ristoranti): sono un
     approfondimento di quella sezione, non un ramo parallelo, e l'autorità
     della sezione resta una sola. */
  for(const v of verticali){
    if(!v || v.attivo === false || !/^[a-z0-9-]+$/.test(String(v.id || ''))) continue;
    out.push({ file: 'business/' + v.id + '/index.html', pagina: 'verticale', id: v.id });
  }
  for(const p of prodotti.filter(x => !x.hidden)){
    out.push({ file: 'product/' + p.id + '/index.html', pagina: 'product', id: p.id });
  }
  return out;
}
