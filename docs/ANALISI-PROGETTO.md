# Analisi del progetto INGLY (Step 1 del comando v4.0)

## Architettura reale
Sito **statico** su GitHub Pages. Nessun server, nessun database, nessuna build obbligatoria per l'Admin.
- **Fonte di verità**: `data/*.json` (config, texts, social, products, categories, content).
- **Sito**: `index.html` + moduli ES in `assets/js/` (app → data-loader → main; products, navigation,
  animations, forms, lazyload, artwork, seo, utils). Bundle di riserva `app.fallback.js` (48 KB) generato
  da esbuild per i browser che non caricano i moduli.
- **Admin**: `admin.html`, file unico (~2000 righe, motore inline). Git-based CMS: ogni pubblicazione è
  **un commit atomico** via GitHub API che riscrive JSON + immagini + `data/*.js` legacy + `version.json`
  + sitemap + robots.
- **Legacy `data/*.js`**: rigenerati automaticamente a ogni publish, mai a mano. Servono solo come riserva.

## Flusso dei dati
Admin modifica `S` (stato in memoria) → validazione → commit unico → GitHub Pages ricostruisce →
il sito legge `version.json` (no-store) e i JSON con `?v=` → `healData()` ripara eventuali imperfezioni →
i renderer disegnano. Nessun passaggio manuale, nessuna doppia fonte.

## Cosa ho trovato nell'audit
**Codice morto** — `components/header.html`, `footer.html`, `hero.html`: mai referenziati. **Rimossi.**
**Falsi positivi** — `forms.js` e `lazyload.js` sembravano orfani ma sono importati da `main.js`: **tenuti**.
**Console/TODO** — zero `console.log` di debug, zero TODO/FIXME nei sorgenti. Pulito.
**Duplicazione** — nessuna logica duplicata sostanziale: il bundle fallback è generato, non scritto a mano.
**Riferimenti rotti** — nessuno tra dati e codice; le 42 immagini "mancanti" sono foto che stanno nel
repository ma non nella copia locale (normale).

## Qualità già presente
115+ test Admin, 100+ test sito, 8 regressioni CSS, validatore dati in CI. `healData()` come paracadute.
Pubblicazione con validazione bloccante, anteprima, cronologia e rollback. WebP + varianti responsive,
punto focale, lazy-load, IntersectionObserver, dati strutturati, sitemap automatica.

## Valutazione onesta del comando v4.0
Il comando chiede ~250 funzioni. Divise per fattibilità reale su sito statico:

**Fatto o già presente**: images[] (gallery), descrizione, correlati, recensioni ricche, sponsor con
livelli, Media Library con doppioni/orfane, WebP+srcset, lazy-load, tema chiaro, JSON-LD
(Product+gallery, Breadcrumb, FAQ, LocalBusiness), integrità dati, validazione, SKU.

**Fattibile e utile** (in `PIANO-PREMIUM.md`): portfolio come progetto completo, galleria masonry,
command palette, configuratore incisione, PWA, wishlist/confronto, AVIF, undo/redo nell'Admin.

**NON possibile senza backend**: varianti con stock reale, editor rich-text con upload server,
analytics proprie, contatore clic sponsor, generazione AI in-app (nessuna chiave API nel front-end),
ruoli/permessi reali, rimozione EXIF server-side, Lighthouse 100 garantito ovunque.

**Sconsigliato ora**: rich-text HTML memorizzato (rischio XSS e peso; la descrizione IT/EN attuale basta
per questo catalogo) — meglio testo semplice sanificato che HTML arbitrario su un sito senza server che
possa ripulirlo. Mega menu (12 categorie non lo giustificano).

## Conclusione
L'architettura è già quella giusta per un catalogo di questa scala e **non va rifatta**: è un ponte verso
un eventuale backend (Cloudflare Pages/Vercel), non un vicolo cieco. Gli stessi JSON si importano lì il
giorno in cui serviranno pagamenti, stock reale o analytics. Fino ad allora, ogni funzione che richiede
un server sarebbe una finzione. Meglio poche cose vere e solide che molte a metà.
