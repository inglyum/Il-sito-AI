# INGLY DESIGN — Admin & Architettura (Git-based CMS)

Fonte: `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`.

## Principio fondamentale
Il sito è su **GitHub Pages** (hosting statico, nessun server). L'Admin (`admin.html`) è l'applicazione; **GitHub è il database e la pipeline di deploy** (stessa classe di prodotto di Decap CMS / Payload in modalità statica). Zero dipendenze server-side.

## Fonte di verità unica
- La verità è **solo** `data/*.json` (`config.json`, `texts.json`, `social.json`, `products.json`, `categories.json`, `content.json`, `version.json`).
- I file legacy `data/*.js` (`config.js`, `i18n.js`, `socials.js`, `catalog.js`) **non vanno mai modificati a mano**: sono rigenerati automaticamente dall'Admin ad ogni pubblicazione, nello stesso commit dei `.json` corrispondenti.
- **Regola d'oro, da citare sempre quando si propone una modifica dati:** mai modificare JSON a mano, mai caricare immagini a mano — tutto passa dall'Admin, in un unico commit.

## Motore di pubblicazione atomica
Ogni pubblicazione produce **un solo commit** via Git Data API: legge il ref del branch → crea blob per ogni file cambiato (JSON + immagini nuove + `.js` legacy rigenerati + `version.json` aggiornato) → crea tree → crea commit → aggiorna ref. Nessuno stato intermedio è mai visibile sul sito pubblico. Il sito ricarica i JSON con cache-busting `?v=<versione>` letto da `version.json`.

## Media Library — convenzioni percorsi (da rispettare sempre)
- Foto principale prodotto: `img/<id>.webp`
- Gallery prodotto: `img/<id>-g<n>.webp`
- Portfolio: `img/port-<n>.webp`
- Upload: compressione automatica in browser (resize max 1600px → WEBP); SVG/PDF passano senza ricompressione. Dedup per hash SHA-1. Report di immagini "orfane" (nel repo ma non referenziate) e "mancanti" (referenziate ma assenti).

## Moduli Admin esistenti
Dashboard · Prodotti (wizard, gallery, duplica) · Categorie (CRUD, sottocategorie illimitate, controllo integrità riferimenti) · Digitali · Media Library · Portfolio · Home & Hero (prodotti in evidenza, video, statistiche) · Testi IT/EN · FAQ & Recensioni · Sezioni avanzate (editor JSON validato) · Contatti & Social · SEO · Pubblica & Deploy · Cronologia + Rollback (ripristino da qualsiasi commit) · Health Center · Backup (export/import totale) · Impostazioni (owner/repo/branch/token, test connessione).

## "Agenti AI" — versione onesta del progetto
Su hosting statico non esistono demoni permanenti. Gli "agenti" reali sono:
1. **Health Center** nell'Admin: controlli automatici di sincronizzazione, integrità dati/immagini, token, permessi, Pages, versione live.
2. **GitHub Actions** ad ogni push (`.github/workflows/validate.yml`, `.github/workflows/qa.yml`): validazione dati + controllo riferimenti immagini.

Qualunque skill che promette "automazioni AI" deve essere onesta su questo vincolo: non proporre demoni/cron server-side finché il progetto è su GitHub Pages statico.

## Sicurezza
Token GitHub fine-grained limitato al repository, permesso Contents R/W (+ Pages read opzionale). Salvato solo nel browser (sessione, o persistente su scelta esplicita dell'utente). Pagina Admin marcata `noindex`.

## Quando serve un backend (Fase D, non ancora attiva)
Stripe, area clienti, magazzino, ruoli reali, analytics proprie richiederebbero migrazione a Cloudflare Pages/Vercel — i JSON attuali sono già nel formato adatto a quella migrazione, ma **non è lo stato attuale del progetto**.
