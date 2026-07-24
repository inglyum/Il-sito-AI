# INGLY DESIGN — Business & Materiali (personalizzazione)

## Tecniche di produzione del brand
- **Incisione/taglio laser** (CO₂ e Fibra) — tecnica cardine del brand, richiamata anche visivamente nella palette (`--laser`, `--spark`, vedi `design-system.md`).
- **Stampa UV** — stampa diretta su superfici rigide.
- **Stampa DTF** (Direct-to-Film) — stampa su tessuti/superfici trasferibili.
- **Stampa 3D** — pezzi/gadget stampati in 3D.

Precisione dichiarata: **0,01 mm** (vedi `brand.md`). Ogni contenuto tecnico o markting che parla di "precisione" deve restare coerente con questo dato reale, non inventare tolleranze diverse.

## Materiali lavorati (coerenti con `data/config.json.statistiche.materiali = 8` e i valori reali nel campo `mat` di `data/products.json`, es. "Legno")
Legno · Plexiglass/Acrilico · Acciaio · Alluminio — più eventuali altri materiali specifici di laser CO₂ (organici: legno, pelle, carta) vs laser Fibra (metalli). Quando si genera nuovo contenuto prodotto, il materiale (`mat`) va scelto da un elenco coerente con questi, non inventato liberamente.

## Categorie d'uso (da `data/categories.json`)
Le macro-categorie reali del catalogo (verificare sempre `data/categories.json` per l'elenco aggiornato, non assumerlo statico) includono ambiti come casa & arredamento, eventi/feste/ricorrenze — ed è ragionevole aspettarsi ambiti affini come regali personalizzati, matrimoni, aziende/branding, animali domestici, secondo il posizionamento del brand descritto in `brand.md`. Non dare per scontate categorie che non sono presenti nel JSON: verificarle sempre a runtime.

## Cosa questo significa per contenuti, prompt e prodotti
- I testi prodotto devono nominare la tecnica reale (es. "inciso a laser su legno", non genericamente "personalizzato").
- I prompt per artwork AI (vedi `prompt-library.md`) devono rispecchiare la texture reale della tecnica (venatura del legno per il laser, superficie lucida/opaca per UV, texture morbida per DTF, strato visibile per 3D print) — mai immagini generiche di prodotti stampati industriali che non richiamano queste tecniche.
- Il posizionamento è artigianale + preciso, mai "usa e getta"/economico: evitare linguaggio da gadget low-cost anche parlando di materiali.
