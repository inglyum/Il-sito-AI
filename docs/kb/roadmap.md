# INGLY DESIGN — Roadmap (sintesi da docs/ROADMAP.md)

**Nota:** questo file è un riassunto orientativo. Prima di pianificare lavoro su una feature, rileggere `docs/ROADMAP.md` nel repository per lo stato aggiornato: la roadmap cambia spesso più velocemente di questo riassunto.

## Completato (v2.4, allo stato di questo pacchetto di skill)
Media Library professionale con dedup reale (hash SHA di Git), assegnazione diretta immagini a prodotti/categorie, eliminazione dal repo inclusa nel commit atomico · caricamento foto diretto da scheda prodotto o da libreria esistente · import Backup che marca tutti i file per ripubblicazione · Icon system INGLY (38 icone vettoriali proprietarie, vedi `design-system.md`) · commit atomico e verifica deploy · ritaglio con zoom/rotazione · varianti immagine 1600/800/400 con srcset · anteprima bozza · sitemap/robots automatici · categorie con immagine · portfolio con link Instagram · Health Center · cronologia con rollback.

## Fase C — cosa resta (in ordine di valore dichiarato)
1. Punto focale per immagine (salvare punto x,y, usarlo come `object-position`).
2. Anteprima affiancata dentro l'Admin (invece di aprire una scheda nuova).
3. Icone anche in menu, materiali e vantaggi (lo sprite le contiene già).
4. Ricerca interna e filtri condivisibili via URL, ordinamento per novità.
5. Pagina prodotto più ricca (zoom, video, tabella misure, correlati scelti a mano).
6. Instagram automatico (da valutare — richiede account Business e rinnovo token ogni 60 giorni).
7. Preventivi tracciati (numerazione richieste, allegati multipli, pagina stato per il cliente).

## Fase D — quando serve un backend
Stripe, area clienti, magazzino, ruoli reali, analytics proprie → migrazione a Cloudflare Pages/Vercel. I JSON attuali sono già nel formato giusto per quella migrazione, ma **non è lo stato attuale**: nessuna skill deve presupporre un backend esistente.

## Regola d'oro (vale per ogni voce di roadmap)
Mai modificare JSON a mano. Mai caricare immagini a mano. Tutto dall'Admin, in un unico commit. Qualunque nuova feature proposta va progettata rispettando questo vincolo, salvo sia esplicitamente parte della Fase D.
