# INGLY ADMIN 2.0 — ARCHITETTURA

## Principio
GitHub Pages è hosting statico: non esiste un server. L'architettura professionale corretta è quindi un
**Git-based CMS**: il pannello Admin è l'applicazione, **GitHub è il database e la pipeline di deploy**.
Stessa classe di prodotti di Decap CMS / Payload (modalità statica). Zero dipendenze, zero build manuale.

## Fonte di verità unica
- La verità è **solo** `data/*.json` (config, texts, social, products, categories, content, version).
- I file legacy `data/*.js` (config.js, i18n.js, socials.js, catalog.js) **non si toccano mai a mano**:
  vengono **rigenerati automaticamente dall'Admin ad ogni pubblicazione**, dentro lo stesso commit.
- Nessun dato duplicato può più divergere: è fisicamente impossibile, perché viaggiano insieme.

## Motore di pubblicazione atomica (Publish Engine)
Ogni pubblicazione produce **UN SOLO COMMIT** tramite Git Data API:
1. lettura ref del branch → commit → tree di base
2. creazione blob per ogni file cambiato: JSON modificati + immagini nuove + `data/*.js` rigenerati + `version.json` aggiornato
3. creazione tree → commit → aggiornamento ref
Conseguenze: mai stati intermedi sul sito, un solo rebuild di Pages, cache-busting garantito
(il sito ricarica i JSON con `?v=<versione>` letta da `version.json`, mai in cache).

## Deploy Monitor
Dopo il commit l'Admin: interroga lo stato build di GitHub Pages, poi **verifica il sito live**
(polling di `version.json` pubblicato finché la versione online corrisponde) e conferma la pubblicazione.
Il workflow richiesto (crea → comprimi → WEBP → aggiorna tutto → commit → deploy → verifica → conferma)
è implementato letteralmente nella timeline di pubblicazione.

## Media Library
- Upload multiplo, drag & drop, compressione automatica in browser (resize max 1600px → **WEBP**),
  SVG/PDF passano senza ricompressione.
- Convenzioni percorsi (compatibili al 100% col sito esistente):
  foto principale prodotto `img/<id>.webp` · gallery `img/<id>-g<n>.webp` · portfolio `img/port-<n>.webp`.
- Deduplica per hash SHA-1, scansione della cartella `img/` del repository, report **orfane** (nel repo ma
  non referenziate) e **mancanti** (referenziate ma assenti). Le immagini partono nello stesso commit dei dati.

## Moduli
Dashboard · Prodotti (wizard, gallery, duplica) · Categorie (CRUD completo, sottocategorie illimitate,
controllo integrità riferimenti) · Digitali · Media Library · Portfolio · Home & Hero (prodotti in evidenza,
video, statistiche) · Testi IT/EN · FAQ & Recensioni · Sezioni avanzate (editor JSON validato) ·
Contatti & Social · SEO · Pubblica & Deploy · Cronologia + Rollback (ripristino da qualsiasi commit) ·
Health Center · Backup (export/import totale) · Impostazioni (owner/repo/branch/token, test connessione).

## "AI Agents" — versione onesta
Su hosting statico non esistono demoni permanenti. Gli agenti sono implementati come:
1. **Health Center** nell'Admin: controlli automatici di sincronizzazione, integrità dati, immagini,
   token, permessi, Pages, versione live — segnalati *prima* che diventino errori visibili (QA/Sync/Media Agent);
2. **GitHub Actions** ad ogni push: validazione dati + controllo riferimenti immagini (Deploy/QA Agent).

## Sicurezza
Token fine-grained limitato a questo repository, permesso Contents R/W (+ Pages read opzionale).
Salvato solo in questo browser (sessione, o persistente su scelta esplicita). Admin `noindex`.
