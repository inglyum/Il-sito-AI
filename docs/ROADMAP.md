# ROADMAP INGLY — sito, Admin e stile

## ✅ v2.7 (oggi) — Temi pronti all'uso, con sfondo incluso

**Artwork Engine**: 15 stili di sfondo **generati vettorialmente** dalla palette di ogni tema.
Nessuna immagine da generare o caricare: ~2,6 KB l'uno (un'immagine AI ne pesa ~100), nitidi a
qualsiasi dimensione, coerenti col brand perché costruiti sui colori del tema stesso.
Tutti i **103 temi** hanno già il loro stile assegnato: scegli il tema, un click, cambia tutto il sito.
Se per una categoria carichi una foto, quella ha sempre la precedenza sullo sfondo generato.

Stili: Aurora · Raggio laser · Griglia tecnica · Luci sfocate · Onde · Curve di livello · Raggi ·
Particelle · Marmo · Circuito · Neve · Coriandoli · Sfumatura morbida · Archi · Fasci di luce.

---

## ✅ v2.8 — Fase 1.1 e 1.2 completate + due bug critici risolti

**Bug 1 — «Impossibile caricare i dati del sito».** Un materiale non presente in `MAT_ART`
interrompeva il render e il catch globale mostrava solo quel messaggio: il sito restava bianco.
Risolto su quattro livelli: auto-guarigione dei dati al caricamento, lettura del materiale sempre
protetta, **tendina** al posto del testo libero nell'Admin, e blocco in CI.

**Bug 2 — importazione backup.** Un backup esportato prima dei temi li cancellava insieme a icone,
varianti e punti focali. Ora l'import fa **merge**: ciò che manca nel file resta dalla versione
attuale, e l'Admin ti dice quali sezioni ha mantenuto.

**1.1 Icone vettoriali** — sostituite le ultime emoji in evidenza (Tecnologie, Stagionale, Edizioni
Limitate, materiali). Il menu usava già icone vettoriali.

**1.2 Punto focale** — nella Media Library, clic sull'anteprima ingrandita per fissare il punto che
deve restare sempre inquadrato: vale su ogni schermo, anche dove il ritaglio CSS taglia l'immagine.

---

## Fase 1 — Cosa resta

**1.4 Anteprima affiancata nell'Admin** · 1 giorno
Oggi l'anteprima apre una scheda nuova. Un riquadro affiancato che si aggiorna mentre scrivi
renderebbe molto più rapido il lavoro sui testi.

---

## ✅ v2.9 — Fasi 2.1 e 2.2 completate

**2.1 Pagina prodotto** — zoom a tutto schermo con frecce, Esc e conteggio; **video** del prodotto con
poster; **tabella misure**; **correlati scelti a mano** che compaiono prima di quelli automatici;
descrizione IT/EN. Tutti i campi si compilano dalla scheda prodotto nell'Admin.

**2.2 Ricerca e filtri** — suggerimenti mentre scrivi (prodotti, categorie, materiali) con frecce ed
Invio; ordinamento **«Novità»**; **filtri salvati nell'URL**: la ricerca filtrata diventa un link
condivisibile su WhatsApp e viene ripristinata all'apertura.

## ✅ v3.0 — Fasi 1.3, 2.4, 3.2 e 3.3 completate

**1.3** Lo sfondo del tema non è più solo sulle 12 card: colora anche la hero e la fascia CTA, così
cambiando tema cambia l'atmosfera dell'intera pagina.
**2.4** Fascia promozionale programmata: testo, pulsante, link, colori e finestra di date, con anteprima
dal vivo nell'Admin. Black Friday e saldi si accendono e si spengono da soli.
**3.2** Ingresso scaglionato: le card della stessa griglia entrano con 70 ms di scarto l'una dall'altra.
**3.3** Scala tipografica esplicita (rapporto 1.25) come fonte unica delle dimensioni del testo.

## Fase 2 — Cosa resta

**2.3 Preventivi tracciati** · 2 giorni
Numerazione delle richieste, allegati multipli, pagina «stato della richiesta» per il cliente.
Oggi il modulo parte e finisce lì: nessuno sa a che punto è.

---

## Fase 3 — Stile INGLY, il salto di qualità

**3.1 Fotografia coerente** · *vale più di qualsiasi codice*
Fondo scuro, una sola luce laterale, sempre la stessa inquadratura e lo stesso rapporto per tutti i
prodotti. Un set fotografico costante fa sembrare il sito il doppio più costoso senza modificare una
riga. Le linee guida sono già in `docs/kb/prompt-library.md`.

**3.4 Modalità chiara** · 2 giorni
Il tema scuro è l'identità, ma una versione chiara per la stampa dei preventivi e per chi arriva da
mobile in pieno sole aumenterebbe la leggibilità. Da valutare, non urgente.

---

## Fase 4 — Quando servirà un backend
Pagamenti Stripe, area clienti con storico ordini, magazzino, utenti e permessi reali, analytics
proprie. Richiede il passaggio da GitHub Pages a Cloudflare Pages o Vercel. I JSON attuali sono già
nel formato giusto per essere importati: questa architettura è un ponte, non un vicolo cieco.

---

## ✅ v3.1 — Portfolio, Recensioni, Sponsor

**Portfolio indipendente dal catalogo** — «Carica più foto» crea una tessera per ogni immagine in un colpo
solo; restano disponibili «Dalla libreria» e «Dal catalogo» come alternative.
**Recensioni complete** — testo IT/EN, nome, sottotitolo, stelle da 1 a 5, data, spunta «cliente verificato»
e **foto del lavoro** che si aprono ingrandite. (L'editor precedente scriveva su campi che il sito non
leggeva: le modifiche non comparivano mai. Corretto.)
**Sponsor & Partner** — sezione in fondo alla pagina con livelli Gold/Silver/Bronze, loghi a colori
(o bianco e nero con colore al passaggio), link, descrizione, scadenza dell'accordo e invito finale.

## ✅ v3.2 — Due bug prioritari risolti

**Sponsor invisibili — causa trovata.** La sezione era corretta nel DOM ma restava a `opacity:0`:
`.reveal` diventa visibile solo quando l'osservatore aggiunge `.in`, e il selettore copriva soltanto
`.page.active .reveal`, `footer .reveal` e `.cta-band`. La sezione Sponsor, che sta fuori da tutti e tre,
non veniva mai osservata. Ora l'osservatore copre ogni `.reveal` del documento e una **rete di sicurezza**
dopo 3 secondi rende comunque leggibile qualsiasi sezione rimasta indietro.

**Sincronizzazione Admin → sito.** Il caricamento dei dati era già anti-cache (`version.json` con
`no-store` e JSON con `?v=`). Mancava invece il controllo *prima* del commit: ora `validaBozza()`
**blocca** la pubblicazione su errori gravi (materiale inesistente, categoria mancante, ID duplicati,
link sponsor malformati) e avvisa su quelli minori. Il pannello «Pubblica» mostra l'esito in tempo reale,
verde o rosso, prima ancora di premere il pulsante.

Vedi `docs/PIANO-PREMIUM.md` per il piano completo verso il livello Awwwards.

## ✅ v3.3 — Portfolio, tema chiaro

**Striscia portfolio più calma** — un giro completo passa da 44 a 96 secondi, ed è regolabile dall'Admin.
**Clic sulla foto = zoom**, non più semplice pausa: si apre a tutto schermo e si scorrono tutte le foto
del portfolio con frecce e tastiera. Il link Instagram è diventato una freccia dedicata in alto a destra,
così il clic sulla foto e il clic sul social non si contendono più lo stesso spazio.

**Modalità chiara** — interruttore accanto al selettore lingua. La scelta si ricorda; se non hai mai
scelto, il sito segue le preferenze del sistema. Applicata prima del primo disegno: nessun lampo bianco.

**Le foto in «Dal laboratorio»** non erano un limite del codice: la striscia mostra `<img>` da sempre e
usa le stesse tessere del portfolio. Bastava caricarle — ora si fa in blocco con «📷 Carica più foto».

## ✅ v3.4 — SEO strutturata, integrità dati, pulizia

Analisi completa del progetto in `docs/ANALISI-PROGETTO.md`. In sintesi: architettura sana, nessun codice
duplicato, tre file HTML morti rimossi. Aggiunti: **dati strutturati** completi (Product con gallery,
Breadcrumb, FAQ — sono le stelle e le info ricche nei risultati Google), **controllo integrità** in CI
(nessun riferimento rotto, nessun ID duplicato), campi **SKU** e **rating** per prodotto.

## ✅ v4.1 — Portfolio come progetto completo (piano premium #1)

La tessera portfolio non è più solo foto + link: può diventare la **storia di un lavoro** — cliente, data,
materiali, macchina usata, il racconto, le foto delle fasi, il prima/dopo, i prodotti collegati. Cliccandola
sul sito si apre una scheda a schermo. È la cosa che distingue uno studio premium da un catalogo.
Più tre correzioni: tabella misure ora visibile, zoom della miniatura giusta, tema chiaro senza riquadri scuri.

## Cosa resta davvero
- **3.1 Fotografia coerente** — dipende da te, ed è la voce con il ritorno più alto in assoluto.
- **2.3 Preventivi tracciati** — numerazione, allegati multipli, pagina «stato richiesta».
- **1.4 Anteprima affiancata nell'Admin** — comodità di lavoro.
- **Fase 4** — solo quando serviranno pagamenti e area clienti veri.

## Regola d'oro
Mai modificare JSON a mano. Mai caricare immagini a mano. Tutto dall'Admin, in un unico commit.
Prima di ogni consegna: `npm test` tutto verde.
