# STATO REALE DEL PROGETTO — v2.6 (fonte di verità per tutte le skill)

> Questo documento vince su qualsiasi altro file di knowledge base in caso di conflitto.
> Aggiornarlo a ogni rilascio.

## Cosa esiste DAVVERO oggi
- **Admin 2.0** (`admin.html`, file unico, nessuna build): Git-based CMS. Fonte di verità `data/*.json`.
- **Pubblicazione atomica**: un solo commit via Git Data API con JSON + immagini + `data/*.js` rigenerati
  + `version.json` + `sitemap.xml` + `robots.txt` + eventuali **eliminazioni** di file.
- **Verifica deploy autoritativa**: si confronta lo **SHA del commit** con quello dichiarato da GitHub Pages
  (`/pages/builds/latest`), non solo il contenuto servito dalla CDN.
- **Media Library**: varianti responsive raggruppate, doppioni rilevati via SHA dei blob, selezione multipla,
  assegnazione a prodotti/categorie, eliminazione dal repository, filtri orfane/doppioni, uso mostrato per file.
- **Pipeline immagini**: ritaglio con zoom/rotazione/proporzioni → WEBP → varianti **400/800** solo se
  l'originale è più grande. Le larghezze realmente create sono registrate in `content.json → MV`
  come **mappa** `{"img/1.webp":[400,800]}`.
- **Theme Engine**: vedi `theme-engine.md` (103 temi, calendario, prompt generator).
- **Artwork Engine** (`assets/js/artwork.js`, `window.INGLY_ART`): 15 stili di sfondo **generati in SVG**
  dalla palette del tema — ~2,6 KB l'uno, nessun upload. Ogni tema ha `bg: '<pattern>'`; il sito applica
  lo sfondo alle categorie prive di foto (`art`/`img` hanno sempre la precedenza). Seed = `temaId-categoriaId`,
  quindi ogni card è diversa ma coerente. Selettore visuale nell'Admin dentro l'editor del tema.
- **Icon system**: `assets/icons/ingly-icons.svg`, 38 icone outline, `icon(name, fallbackEmoji)` in `utils.js`.
- **Anteprima bozza**: `index.html?__preview=1` legge `sessionStorage.__INGLY_PREVIEW__`.
- Health Center, cronologia con rollback, backup export/import, WhatsApp flottante, sezione Business, Tecnologie.

## Fase 2.1 / 2.2 (v2.9)
- **Pagina prodotto**: `video` (URL mp4) + `poster`, `misure` (array `[etichetta, valore]`),
  `rel` (ID di prodotti correlati scelti a mano, mostrati per primi), `desc{it,en}`.
  Zoom con **lightbox** (frecce, Esc, conteggio) agganciata una sola volta all'avvio con `bindLightbox()`.
- **Ricerca e filtri**: ordinamento «Novità» (`nw`, per ID decrescente), suggerimenti mentre si scrive
  (prodotti, categorie, materiali) con navigazione da tastiera, e **stato dei filtri nell'URL**
  (`#/shop?q=…&cat=…&mat=…&sub=…&max=…&sort=…`) — condivisibile su WhatsApp e ripristinato all'avvio.
  `syncFiltersToURL()` usa `history.replaceState` per non riempire la cronologia del browser.

## Fasi 1.3 / 2.4 / 3.2 / 3.3 (v3.0)
- **1.3 Tema su tutta la pagina**: `applyThemeAccent()` imposta `--theme-bg` e la classe `has-theme-bg`
  sul `<html>`; hero e fascia CTA riusano lo sfondo generato a bassa opacità con maschera in dissolvenza.
- **2.4 Fascia promozionale**: `content.json → PROMO {attivo, dal, al, testo{it,en}, cta{it,en}, link, colori}`.
  Stessa logica di finestra date dei temi; chiusa dall'utente resta nascosta per la sessione
  (`sessionStorage.ingly_promo_x`). Pannello con anteprima dal vivo in «Temi stagionali».
- **3.2 Ingresso scaglionato**: `observeAll()` assegna `--rd` (70ms × posizione, max 9) agli elementi
  `.reveal` dello stesso contenitore; `transition-delay:var(--rd)` in CSS, azzerato con reduced-motion.
- **3.3 Scala tipografica**: variabili `--fs-2xs … --fs-4xl` (rapporto 1.25) e `--lh-*` in
  `variables.css`. **Usare sempre queste variabili**, mai valori sciolti, per nuovi testi.

## Portfolio / Recensioni / Sponsor (v3.1)
- **Portfolio** (`content.json → PORT`, tupla `[emoji, {it,en}, "grad", img, link]`): la via principale è
  **📷 Carica più foto** (una tessera per immagine, indipendente dal catalogo, titolo dedotto dal nome file);
  in alternativa **🗂 Dalla libreria** e **📦 Dal catalogo** (secondaria: le foto dei lavori consegnati
  sono più credibili delle schede prodotto). I percorsi seguono `img/port-N.webp` senza sovrascrivere.
- **Recensioni** (`content.json → REVIEWS`): schema reale `q{it,en}, w (nome), s{it,en}, i (iniziali),
  c (colore)` + nuovi `st` (1–5 stelle), `dt` (data), `vf` (verificata), `ph[]` (foto).
  ⚠️ L'editor precedente scriveva su `a`/`r`, campi che il sito non legge: le modifiche sparivano.
  **Verificare sempre che i campi dell'Admin coincidano con quelli letti dai renderer.**
  Le iniziali si generano dal nome se non compilate; le foto si aprono nella lightbox.
- **Sponsor** (`content.json → SPONSORS {attivo, grigio, titolo, sottotitolo, cta, ctaLink, lista[]}`):
  ogni voce `{nome, logo, link, livello: gold|silver|bronze, desc{it,en}, attivo, fino}`.
  Gold occupa spazio doppio e logo più grande. Loghi **a colori** di default (`grigio:false`);
  in bianco e nero si colorano al passaggio del mouse. I link esterni usano `rel="noopener sponsored"`.
  La sezione si nasconde da sola se non ci sono partner visibili.

## Portfolio, tema chiaro, prodotto (v3.3)
- **Striscia portfolio**: velocità in `content.json → GALSPEED` (secondi per giro, default 96),
  applicata a `--gal-speed`. Pausa al passaggio del mouse e durante lo zoom (`body.lbx-open`),
  disattivata con `prefers-reduced-motion`.
- **Clic su una tessera con foto** → `openSeries()` apre lo zoom con **tutte** le foto del portfolio,
  navigabili con frecce/tastiera. Il link Instagram è ora una **freccia dedicata** (`.gtile-go`):
  la foto apre lo zoom, la freccia porta al social. Due azioni distinte sullo stesso elemento.
- **Modalità chiara**: `<html data-mode="light|dark">` ridefinisce **solo le variabili di colore** in
  `variables.css`; nessun componente va riscritto. Preferenza in `localStorage.ingly_mode`, applicata
  da uno script inline nel `<head>` **prima del primo disegno** (altrimenti si vede un lampo bianco).
  Se l'utente non ha mai scelto, segue le preferenze del sistema operativo, anche a sito aperto.
- **Prodotto**: `gallery[]` (miniature navigabili), `desc{it,en}`, `video`+`poster`, `misure[]`, `rel[]`
  erano già attivi dalla fase 2.1 — la struttura dati supporta più immagini da tempo.

## Dati strutturati e integrità (v3.4)
- **JSON-LD** in `assets/js/seo.js`: LocalBusiness (fisso) · Product sulla pagina prodotto (con **tutte** le
  immagini della gallery, materiale, categoria, rating reale, `priceValidUntil`) · BreadcrumbList
  (Home › Categoria › Prodotto) · FAQPage sulla pagina FAQ. Gli script si rimuovono quando si cambia pagina.
- **Prodotto**: campi `sku` e `rating` (facoltativi) compilabili dall'Admin, usati dallo schema.
- **Integrità dati** (`scripts/validate-data.mjs`, gira in CI): correlati che puntano a prodotti esistenti,
  SKU non duplicati, gallery sotto `img/`, link portfolio/sponsor ben formati, livelli sponsor validi,
  ID temi unici. Blocca il merge su GitHub se qualcosa è rotto.
- **Codice morto rimosso**: `components/*.html` (mai referenziati). `forms.js`/`lazyload.js` sono vivi
  (importati da `main.js`): non rimuoverli.

## Immagini prodotto, backup, tema (v4.0)
- **Gallery prodotto**: `p.gallery[]` esiste dalla fase 2.1 e il sito la mostra come miniature navigabili
  (`galleryOf`, `ppThumb`). Nell'Admin «➕ Aggiungi alla gallery» ora carica **più immagini in una volta**
  (ritaglio → WEBP → varianti), con numerazione `img/<id>-gN.webp` senza sovrascrivere.
- **Backup con immagini (BUG STORICO risolto)**: l'export chiede se includere le foto; se sì, scarica ogni
  file da `img/` via GitHub API e lo incorpora in base64 in `payload.images{path:b64}` (formato `_ingly_backup:3`).
  L'import ricostruisce i Blob e li rimette in coda di pubblicazione: **le immagini tornano davvero online**.
  Prima il backup salvava solo i riferimenti (`img/1.webp`) ma non i file: reimportandolo su un repo pulito
  restavano i percorsi senza le foto. Retrocompatibile con i backup v2 (solo dati).
- **Tema chiaro/scuro**: `<html data-mode>` ridefinisce le variabili colore; i colori scuri **fissi** in
  `pages.css` (body, toast, ptag, lbl…) sono stati collegati a `--glass-dark`/`var(--white)` così il tema
  chiaro funziona su tutta la pagina, non solo sui componenti principali. Transizione morbida al toggle
  (`html.theme-anim`), mai al primo caricamento. Focus da tastiera sempre visibile (`:focus-visible`, WCAG AA).

## Portfolio-progetto, misure, tema chiaro completo (v4.1)
- **Tabella misure**: `p.misure=[[etichetta,valore]]` renderizzata in `#ppSizes`, ora nella **colonna INFO**
  (sotto la tabella sconti), non più nella colonna foto dove restava nascosta sotto la tabella prezzi.
- **Clic miniatura prodotto** → apre **quella** foto nello zoom (`ppThumb()` + `openLightbox(src)`),
  non riparte dalla principale. `openLightbox` confronta i percorsi senza `?v=`.
- **Tema chiaro completo**: superfici legate a variabili semantiche `--bg-deep`, `--card-glass`,
  `--card-solid` (topbar, footer, mobile-menu, fcard, mcard/tecnologie), ridefinite in chiaro. Niente più
  riquadri scuri residui. Regola: **mai un fondo scuro fisso**, sempre una variabile.
- **Portfolio come progetto completo**: la tupla PORT diventa `[icona,titolo,colori,foto,link, D?]` dove
  `D` è un oggetto opzionale RETROCOMPATIBILE `{cliente,data,durata,settore,macchina,materiali[],tecnologie[],
  tag[],racconto{it,en},video,evidenza,foto[],prima,dopo,prodotti[],social}`. Se presente, il clic sulla
  tessera apre la **scheda progetto** (`openProject`), altrimenti lo zoom. Editor completo in `editPort()`.

## Regole non negoziabili (imparate sul campo, da non violare mai)
1. **Mai toccare `animation` su `img.pimgph`, `img.gimg`, `img.bimg`.**
   Le foto prodotto hanno `animation: imgfade` che le porta da 0 a 1 di opacità. Una regola successiva che
   imposti `animation:none` le rende **invisibili**. Bug realmente accaduto (v2.3→v2.5). Lo scheletro di
   caricamento va sul **contenitore** (`.pimg::before`), mai sull'immagine. Esiste una rete di sicurezza
   `img.pimgph{opacity:1!important}` in fondo a `components.css`: non rimuoverla.
2. **`srcset` solo per varianti realmente esistenti.** Se si dichiara `-800.webp` e il file non c'è,
   il browser lo sceglie e ottiene un 404 → immagine vuota. `MV` è una mappa, mai un array.
   La scansione del repository ricostruisce `MV` dai file reali (auto-riparazione).
3. **`sub` di un prodotto va da 1 a `categoria.sub.length`.** Un `sub=0` fa sparire il prodotto dai filtri.
   Corretto in automatico dall'Admin al caricamento e bloccato da `scripts/validate-data.mjs`.
4. **GitHub Pages deve essere «Deploy from a branch» → main → / (root).** Con la modalità Actions il commit
   dell'Admin non va online finché non termina un workflow, e la verifica non può confermare.
5. **Nessun workflow deve fare commit automatici** sul branch: entrerebbe in conflitto con la pubblicazione
   atomica (già rimosso un `sistemazione.yml` che lo faceva).
6. **Nessuna chiave API nel front-end.** Il sito è pubblico e statico.
7. **Ogni lettura di `MAT_ART[p.mat]` deve passare da `matArt()`.**
   Un materiale non presente in `MAT_ART` faceva crollare l'INTERO sito con
   «Impossibile caricare i dati del sito · Cannot read properties of undefined (reading 'bg')»:
   il render veniva interrotto e il catch globale mostrava solo quel messaggio.
   Difese ora attive su tre livelli: `healData()` nel data-loader ripara in memoria,
   `matArt()` non restituisce mai undefined, l'Admin usa una **tendina** invece del testo libero
   e `validate-data.mjs` blocca il caso in CI. Bug realmente accaduto (v2.7).
8. **`healData()` è il paracadute del sito**: nessun dato imperfetto (materiale, sottocategoria,
   traduzione mancante, chiave assente da un backup vecchio) deve poter impedire il caricamento.
   Ripara in memoria e scrive in console cosa ha corretto; la correzione definitiva si fa dall'Admin.
9. **L'importazione di un backup fa MERGE del contenuto, non sostituzione.**
   Un backup esportato prima dei temi cancellava temi, icone, varianti e punti focali.
   Ora le sezioni assenti nel file vengono mantenute dalla versione attuale e l'utente ne è avvisato.
10. **Punto focale**: `content.json → FOCAL` è una mappa `percorso → "x% y%"` usata come
   `object-position`. Si imposta cliccando sull'anteprima ingrandita nella Media Library.
11. **Uno sfondo generato non si scrive mai in `background-image` inline.**
   Va in una variabile CSS (`--card-bg`, `--theme-bg`) applicata da una regola del foglio di stile.
   Motivo: qualsiasi successiva scrittura su `element.style` (es. il ritardo `--rd` della fase 3.2)
   riserializza l'attributo e può far sparire un data-URI lungo. Bug reale intercettato dai test (v3.0).
12. **Ogni sezione con classe `.reveal` DEVE essere raggiunta da `observeAll()`.**
   `.reveal` parte da `opacity:0` e diventa visibile solo quando l'osservatore aggiunge `.in`.
   Il selettore era limitato a `.page.active .reveal, footer .reveal, .cta-band`: una sezione fuori da
   quei contenitori (Sponsor) restava **invisibile per sempre** pur essendo presente e corretta nel DOM.
   Ora il selettore è `.reveal, .counter, .cta-band` con esclusione delle sole pagine non attive, e dopo
   3 secondi una **rete di sicurezza** (`html.reveal-failsafe`) rende leggibile qualunque sezione rimasta
   indietro. Bug realmente accaduto (v3.1) e non intercettato dai test perché verificavano il DOM ma non
   la visibilità: ora il test registra gli elementi osservati.
13. **Nessuna pubblicazione senza validazione.** `validaBozza()` nell'Admin replica i controlli di
   `scripts/validate-data.mjs` e **blocca** il commit su errori gravi (materiale inesistente, categoria
   mancante, ID duplicati, link sponsor malformati), avvisando invece su quelli non bloccanti.
   Gira anche in tempo reale nel pannello «Pubblica».
14. **I data-URI dentro `style="..."` vanno delimitati con apici SINGOLI.**
   `url("data:…")` in un attributo già delimitato da doppie tronca l'attributo al primo apice e lo sfondo
   sparisce senza errori in console. `INGLY_ART.css()` usa apici singoli e codifica `'` come `%27`.
   Bug realmente accaduto e intercettato dai test (v2.7).

## Test automatici (da eseguire prima di ogni consegna)
- `node test-admin.mjs` — boot dell'Admin in DOM headless, navigazione di ogni sezione, editor, pubblicazione,
  backup, temi, icone. **91+ asserzioni.**
- `node test-sito.mjs` — rendering del sito col bundle di fallback: categorie, temi, icone, WhatsApp, portfolio.
- `node test-css.mjs` — regressioni CSS/srcset (immagini invisibili, varianti inesistenti).
- `node scripts/validate-data.mjs` — integrità dei dati.
Se una modifica tocca CSS di immagini, aggiungere un test in `test-css.mjs` **prima** del fix.
