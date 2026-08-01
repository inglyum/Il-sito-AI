/* ============ ABBINAMENTO AUTOMATICO DELLE FOTO ============
   Dato il nome di un file appena caricato, indovina a quale prodotto appartiene.

   Il problema che risolve: 46 prodotti in vetrina non hanno la foto. Caricarle
   una per una — apri il prodotto, scegli il file, salva, chiudi — è una serata
   di lavoro. Trascinandole tutte insieme, qui si prova a capire da sole dove
   vanno, e all'utente resta solo da confermare o correggere.

   Due strade, nell'ordine:
   1. il numero nel nome del file. «7.webp», «7-g1.jpg», «prod-7.png» sono
      l'id del prodotto. Attenzione ai nomi delle fotocamere (IMG_4821,
      DSC00123, WhatsApp Image 2026-07-31): non sono id, e prenderli per tali
      assegnerebbe le foto ai prodotti sbagliati — un danno peggiore del non
      abbinare niente;
   2. le parole del nome contro i nomi dei prodotti. «cake-topper-nozze.jpg»
      trova «Cake Topper Matrimonio Plexiglass». Serve una somiglianza netta:
      nel dubbio si lascia decidere alla persona.

   Funzioni pure, nessun DOM: verificabili in tests/test-abbina-foto.mjs. */

/* «Cake Topper Matrimonio, Plexiglass» → ['cake','topper','matrimonio','plexiglass'] */
export function parole(testo){
  return String(testo || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   /* via gli accenti */
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(w => w.length > 2 && !PAROLE_VUOTE.has(w));
}

/* parole che compaiono ovunque e non distinguono un prodotto dall'altro */
const PAROLE_VUOTE = new Set(['con','per','del','della','dei','delle','and','the','pers',
  'img','image','foto','photo','picture','copy','copia','final','finale','def','definitivo',
  'personalizzato','personalizzata','personalizzati','personalizzate']);

/* nomi tipici di fotocamere e telefoni: contengono numeri che NON sono id */
const NOMI_APPARECCHI = /^(img|dsc|dscn|pxl|photo|foto|screenshot|schermata|whatsapp|signal|telegram|received|inked|20\d{6})[-_ ]?\d/i;
/* «p» da solo non entra nell'elenco perché «p40.webp» è un modo naturale di
   scrivere «prodotto 40». I nomi delle Panasonic («P1010234») restano fuori
   lo stesso: l'espressione qui sotto accetta al massimo quattro cifre, e
   deve combaciare con TUTTO il nome. */

/* estensione via, e il resto ripulito */
export function senzaEstensione(nome){
  return String(nome || '').replace(/\.[a-z0-9]+$/i, '');
}

/* Numero del prodotto scritto nel nome del file.
   Riconosce: «7», «7-g1», «7 g2», «prod-7», «prodotto_7», «p7», «#7».
   Restituisce { id, galleria } — galleria = true se è una foto secondaria. */
export function numeroNelNome(nome){
  const base = senzaEstensione(nome).trim();
  if(NOMI_APPARECCHI.test(base)) return null;      /* IMG_4821 non è il prodotto 4821 */

  const m = base.match(/^(?:#|p|prod|prodotto)?[-_ ]?(\d{1,4})(?:[-_ ]?g[-_ ]?(\d{1,2}))?$/i);
  if(!m) return null;
  const id = Number(m[1]);
  if(!(id > 0)) return null;
  return { id, galleria: m[2] != null };
}

/* Quanto il nome del file somiglia al nome del prodotto: 0 = niente,
   1 = tutte le parole del file compaiono nel prodotto. */
export function somiglianza(nomeFile, nomeProdotto){
  const a = parole(senzaEstensione(nomeFile));
  const b = new Set(parole(nomeProdotto));
  if(!a.length || !b.size) return 0;
  const comuni = a.filter(w => b.has(w)).length;
  return comuni / a.length;
}

/* Abbina UN file.
   Ritorna { id, galleria, motivo, sicurezza } oppure null se non è chiaro.
   `sicurezza`: 'certa' (numero esplicito) o 'probabile' (somiglianza di nome) —
   serve all'interfaccia per dire quanto fidarsi. */
export function abbina(nomeFile, prodotti = [], opt = {}){
  const soglia = opt.soglia != null ? opt.soglia : 0.6;

  const num = numeroNelNome(nomeFile);
  if(num){
    const p = prodotti.find(x => x.id === num.id);
    if(p) return { id: p.id, galleria: num.galleria, sicurezza: 'certa',
                   motivo: 'il nome del file è il numero del prodotto' };
    return null;                                   /* numero che non esiste: meglio tacere */
  }

  let migliore = null, punteggio = 0, secondo = 0;
  for(const p of prodotti){
    const s = Math.max(
      somiglianza(nomeFile, (p.n && p.n.it) || ''),
      somiglianza(nomeFile, (p.n && p.n.en) || '')
    );
    if(s > punteggio){ secondo = punteggio; punteggio = s; migliore = p }
    else if(s > secondo){ secondo = s }
  }
  /* due prodotti ugualmente somiglianti = scelta a caso: non abbiniamo */
  if(!migliore || punteggio < soglia || punteggio - secondo < 0.2) return null;
  return { id: migliore.id, galleria: false, sicurezza: 'probabile',
           motivo: 'il nome somiglia a «' + ((migliore.n && migliore.n.it) || '') + '»' };
}

/* Abbina un elenco di file.
   Se più file finiscono sullo stesso prodotto, il primo diventa la foto
   principale e gli altri vanno in gallery: caricando «7.jpg, 7-g1.jpg, 7-g2.jpg»
   il risultato è quello che ci si aspetta senza dover scegliere nulla. */
export function abbinaTutti(nomiFile = [], prodotti = [], opt = {}){
  const conMain = new Set();          /* prodotti che in QUESTO gruppo hanno già la principale */
  const esito = [];
  for(const nome of nomiFile){
    const a = abbina(nome, prodotti, opt);
    if(!a){ esito.push({ nome, abbinato: null }); continue }
    /* La foto va in gallery se il nome lo dice («7-g1») oppure se un altro file
       dello stesso gruppo ha già preso il posto di principale.
       NON perché il prodotto avesse già una foto: chi trascina «7.webp» sta
       dicendo «questa è la foto del prodotto 7», e mandarla in gallery
       lasciando la vecchia al suo posto non è quello che si aspetta. */
    const galleria = a.galleria || conMain.has(a.id);
    if(!galleria) conMain.add(a.id);
    const p = prodotti.find(x => x.id === a.id);
    esito.push({ nome, abbinato: { ...a, galleria,
      sostituisce: !galleria && !!(p && p.img) } });   /* l'interfaccia lo dice */
  }
  return esito;
}

/* Riassunto in una riga per l'interfaccia. */
export function riassunto(esiti = []){
  const ok = esiti.filter(e => e.abbinato).length;
  const certi = esiti.filter(e => e.abbinato && e.abbinato.sicurezza === 'certa').length;
  return { totale: esiti.length, abbinate: ok, certe: certi,
           daScegliere: esiti.length - ok };
}
