# INGLY DESIGN — Audit del repository e piano a dieci anni

> Versione leggibile: https://claude.ai/code/artifact/3993b18d-f34e-44b0-ae05-45bab2da4d09
> Base dell'audit: commit `9386494`. Numeri contati nei dati, non dichiarati.
> Sostituisce `docs/ROADMAP.md` e `docs/kb/roadmap.md` come piano corrente.

## Il verdetto

L'ingegneria è avanti di due anni rispetto al contenuto.

| Misurato | Valore |
|---|---|
| Pagine statiche per i motori che non eseguono JS | 81 |
| Controlli automatici, tutti verdi | 796 |
| Prodotti visibili con una foto | **23 / 69** |
| Prodotti con domande, parole chiave o punti di forza | **0 / 69** |
| Prodotti con più di una foto | 9 / 69 |
| Moduli di contatto collegati | **0 / 3** |
| Dati di visita raccolti | **nessuno** |
| Recensioni pubblicate | 2 |

Il vincolo dei prossimi dodici mesi non è tecnico: sono 46 fotografie e 3 campi da
compilare. Finché restano così, ogni funzione aggiunta amplifica il nulla.

## La decisione architetturale

Metà della lista richiesta (ordini, CRM, fatture, conti azienda, analitica in tempo
reale, email/SMS, checkout) richiede uno stato che un sito statico non può avere.

- **A — comprare Shopify/Medusa:** no. Si perde il CMS su Git, la pubblicazione
  atomica e le pagine statiche per i motori AI, per ottenere un commercio a listino
  che non è il nostro modello.
- **B — backend proprio:** no. Il costo non è costruirlo, è mantenerlo per dieci anni.
- **C — statico + bordo Cloudflare (Workers, D1, R2): SÌ.** Il sito pubblico non
  cambia di una riga. Solo preventivi, conti azienda e file caricati vivono nello
  stato. Cloudflare è già nella pila.

**Non costruire il pagamento online.** Per la lavorazione su misura il modello
corretto è preventivo → ordine. Eccezione: prodotti digitali e articoli a listino,
dove basta un link Stripe (già previsto nei dati).

## Le quattro perdite aperte

1. **Formspree scollegato** (`formspreePreventivo`, `formspreeNewsletter`,
   `formspreePreventivoB2B` vuoti) — ogni richiesta di preventivo si perde.
   0 giorni · Critico
2. **46 prodotti su 69 senza foto** — non si vendono, non entrano in Shopping, non
   vengono citati. Lavoro dello studio, non di uno sviluppatore. Critico
3. **Nessuna misura** (token Cloudflare vuoto, Search Console non collegata) —
   ogni priorità è un'ipotesi. 0,5 giorni · Critico
4. **5 famiglie di caratteri bloccanti da `fonts.googleapis.com`** — quando quel
   server non risponde si ferma tutto: dati, moduli, disegno. Misurato: 13 s a
   utilizzabile, CLS 0,55. (Il mio ambiente blocca quel dominio, quindi il numero
   non è quello reale; la fragilità nel codice sì.) Ospitarli in proprio, ridurre
   a 3, `font-display:swap`. Risolve anche il problema GDPR. 1 giorno · Alto

## Fasi

**Fase 1 — 30 giorni · fermare la perdita.** Formspree, foto, analytics + Search
Console + Bing + IndexNow, caratteri in proprio, spazio riservato alle immagini,
SKU/misure/EN, entità fondatore + `sameAs`, tema «segui il sistema».
*Fine fase:* preventivi in casella > 0; 69/69 con foto; LCP < 2,5 s; CLS < 0,1.

**Fase 2 — 90 giorni · farsi trovare e citare.** 25 pagine per intenzione di ricerca
generate dal motore esistente via `intenti.json`; 5 domande vere per prodotto; feed
Merchant Center + prezzi per prodotto (non globali); Accademia del laser; pagine di
confronto; collegamenti interni automatici; estrazione dei pannelli Admin; recensioni.
*Fine fase:* da 81 a 130+ pagine indicizzate; prova di citazione mensile su 20
domande in ChatGPT/Perplexity/AI Overview.

**Fase 3 — 180 giorni · il bordo che pensa.** Cloudflare Workers/D1/R2;
**preventivatore laser** (materiale × area × tempo × finitura); caricamento CAD;
conti azienda; portale HORECA per soluzioni, non per materiali; preventivi come
imbuto misurabile; email automatiche.
*Fine fase:* scontrino medio e clienti che tornano.

**Fase 4 — oltre 12 mesi.** Assistente di vendita AI fondato sul catalogo,
raccomandazioni dai percorsi reali, fedeltà/invito, coda di produzione, Europa.

## Cosa non fare, tra le cose chieste

- **Costruttore visuale a trascinamento:** mesi di lavoro per un vincolo che non
  avete. Il denaro va sul catalogo.
- **Heatmap e registrazione sessioni:** rumore con il traffico attuale, e uno script
  di terze parti contro le prestazioni che stiamo migliorando.
- **SMS/Telegram/push:** tre canali prima di saperne usare uno. WhatsApp è dove
  sono i clienti italiani.
- **Lighthouse 100 ovunque:** sopra 95 si paga più di quanto renda. L'obiettivo
  sono i Core Web Vitals in verde *sul campo*.
- **Prezzi spenti globalmente:** giusto sul su misura, ma esclude da Shopping.
  Rendere l'interruttore *per prodotto* — mezza giornata, Fase 2.

## Il punto per i dieci anni

Quasi tutto ciò che darà vantaggio nel 2035 non è codice: è l'archivio di quello che
sapete fare — materiali, tolleranze, errori, casi risolti — scritto in pagine che una
macchina può leggere. Il software per pubblicarlo c'è già quasi tutto.
