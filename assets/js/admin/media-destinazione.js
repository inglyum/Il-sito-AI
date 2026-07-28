/* ============ DESTINAZIONE DELLE IMMAGINI (Media Library) ============
   Calcola DOVE finirà un file caricato e lo spiega a parole.

   Il problema che risolve: il pannello mostrava un unico elenco lunghissimo con
   dentro prodotti, tessere portfolio, categorie e «solo libreria», più un
   secondo menù «ruolo» (Principale / Gallery) che ha senso SOLO per i prodotti
   ma restava visibile anche scegliendo una categoria. Non si capiva dove sarebbe
   finita l'immagine — e il nome del file non si vedeva da nessuna parte.

   Qui la scelta è separata in due passi (tipo → elemento) e ogni riga può
   dichiarare per esteso il file che verrà creato.

   Funzioni pure: nessun DOM, verificabili in tests/test-media-destinazione.mjs.

   Il formato di `dest` resta quello già usato dalla pubblicazione
   (p:<id> · t:<indice> · t:new · c:<id> · about · free): l'interfaccia cambia,
   il contratto con il resto dell'Admin no. */

export const TIPI = [
  { id:'p',     icona:'📦', nome:'Prodotto',   aiuto:'Foto principale o gallery di un prodotto del catalogo' },
  { id:'t',     icona:'🖼',  nome:'Portfolio',  aiuto:'Un lavoro realizzato, mostrato nella sezione «Dal laboratorio»' },
  { id:'c',     icona:'🗂',  nome:'Categoria',  aiuto:'Immagine di copertina di una delle categorie' },
  { id:'about', icona:'🏠', nome:'Chi siamo',  aiuto:'L\'immagine della pagina «Chi siamo»' },
  { id:'free',  icona:'📁', nome:'Libreria',   aiuto:'Nessun collegamento: resta disponibile per usarla più avanti' },
];

/* I ruoli (principale / gallery) hanno senso solo per un prodotto. */
export const RUOLI = [
  { id:'main', nome:'Foto principale' },
  { id:'gal',  nome:'Aggiungi alla gallery' },
  { id:'both', nome:'Principale + gallery' },
];
export const vuoleRuolo = tipo => tipo === 'p';

/* Da `dest` al tipo. */
export function tipoDi(dest){
  const d = String(dest || 'free');
  if(d.startsWith('p:')) return 'p';
  if(d.startsWith('t:')) return 't';
  if(d.startsWith('c:')) return 'c';
  if(d === 'about') return 'about';
  return 'free';
}

/* Nome file «pulito» per la libreria: minuscolo, senza accenti né spazi. */
export function slug(nome){
  return String(nome || '')
    .replace(/\.[^.]+$/, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'immagine';
}

/* Il percorso che verrà creato nel repository.
   Deve restare allineato a ciò che fa la pubblicazione: se qui e là divergono,
   l'anteprima direbbe una bugia. Il test lo verifica su ogni tipo. */
export function percorso(dest, opt = {}){
  const { ext = 'webp', nomeFile = '', prodotti = [], portfolio = [], galleryEsistenti = [] } = opt;
  const tipo = tipoDi(dest);

  if(tipo === 'p'){
    const id = String(dest).slice(2);
    if(opt.ruolo === 'gal'){
      let n = 1, p;
      do { p = 'img/' + id + '-g' + n + '.' + ext; n++; } while(galleryEsistenti.includes(p));
      return p;
    }
    return 'img/' + id + '.' + ext;
  }
  if(tipo === 't'){
    const i = String(dest) === 't:new' ? portfolio.length : Number(String(dest).slice(2));
    return 'img/port-' + (i + 1) + '.' + ext;
  }
  if(tipo === 'c') return 'img/cat-' + String(dest).slice(2) + '.' + ext;
  if(tipo === 'about') return 'img/about.' + ext;
  return 'img/' + slug(nomeFile) + '.' + ext;
}

/* Frase in italiano che dice dove finisce l'immagine.
   È la parte che mancava: chi carica vede il file E il significato. */
export function descrizione(dest, opt = {}){
  const { prodotti = [], portfolio = [], categorie = [], ruolo = 'main' } = opt;
  const tipo = tipoDi(dest);

  if(tipo === 'p'){
    const id = Number(String(dest).slice(2));
    const p = prodotti.find(x => x.id === id);
    const nome = p ? ((p.n && p.n.it) || ('#' + id)) : ('#' + id);
    if(ruolo === 'gal')  return 'Si aggiunge alla gallery di «' + nome + '»';
    if(ruolo === 'both') return 'Diventa la foto principale di «' + nome + '» e viene aggiunta anche alla gallery';
    return 'Diventa la foto principale di «' + nome + '»';
  }
  if(tipo === 't'){
    if(String(dest) === 't:new') return 'Crea una nuova tessera nel Portfolio con questa immagine';
    const i = Number(String(dest).slice(2));
    const t = portfolio[i];
    const titolo = (t && t[1] && t[1].it) || ('tessera ' + (i + 1));
    return 'Sostituisce l\'immagine della tessera Portfolio «' + titolo + '»';
  }
  if(tipo === 'c'){
    const id = String(dest).slice(2);
    const c = categorie.find(x => x.id === id);
    return 'Diventa la copertina della categoria «' + ((c && c.n && c.n.it) || id) + '»';
  }
  if(tipo === 'about') return 'Diventa l\'immagine della pagina «Chi siamo»';
  return 'Resta solo nella libreria, senza essere collegata a nulla: la ritrovi qui sotto marcata «non usata»';
}

/* Elenco degli elementi selezionabili per un tipo, già pronto per il menù. */
export function elementiPerTipo(tipo, dati = {}){
  const { prodotti = [], portfolio = [], categorie = [] } = dati;
  if(tipo === 'p') return prodotti.map(p => ({ valore:'p:' + p.id, etichetta:'#' + p.id + ' · ' + ((p.n && p.n.it) || '') }));
  if(tipo === 't') return [
    { valore:'t:new', etichetta:'➕ Nuova tessera Portfolio' },
    ...portfolio.map((t, i) => ({ valore:'t:' + i, etichetta:'Tessera ' + (i + 1) + ' · ' + ((t[1] && t[1].it) || '') })),
  ];
  if(tipo === 'c') return categorie.map(c => ({ valore:'c:' + c.id, etichetta:((c.ic || '') + ' ' + ((c.n && c.n.it) || c.id)).trim() }));
  if(tipo === 'about') return [{ valore:'about', etichetta:'Pagina «Chi siamo»' }];
  return [{ valore:'free', etichetta:'Solo libreria' }];
}
