# Come testare il sito e l'Admin

Questo è il repository **di sviluppo** (`Il-sito-AI`).
Il sito in produzione vive in `Sito-claude-code-` e **non viene toccato**.

---

## ⚠️ Leggi prima: due cose che potrebbero fare danni

**1. Non impostare mai `inglydesign.it` come dominio di questo repository.**
Il dominio appartiene al repository di produzione. Se lo dichiarassero in due,
GitHub scollegherebbe il sito online. Per questo qui il file `CNAME` è stato
rimosso — vedi `.github-pages-note.md`.

**2. L'Admin ricorda il repository nel browser, non nel file.**
Se sullo stesso computer hai già usato l'Admin di produzione, la destinazione
resta salvata. Questo Admin se ne accorge, la riporta su `Il-sito-AI` e te lo
dice con un messaggio. Prima di premere **Pubblica**, controlla comunque in
**Impostazioni** che il repository indicato sia `inglyum / Il-sito-AI`.

---

## Metodo 1 — Anteprima online (consigliato)

1. Vai su **Settings → Pages** del repository `Il-sito-AI`
2. *Source*: **Deploy from a branch**
3. *Branch*: `main` — cartella `/ (root)` → **Save**
4. **Non impostare alcun dominio personalizzato**

Dopo un paio di minuti il sito è su:

```
https://inglyum.github.io/Il-sito-AI/
https://inglyum.github.io/Il-sito-AI/admin.html
```

Il sito funziona anche dentro una sottocartella: il percorso base viene
riconosciuto da solo, non c'è niente da configurare.

## Metodo 2 — In locale sul tuo computer

Serve Python (già presente su Mac e Linux):

```bash
git clone https://github.com/inglyum/Il-sito-AI
cd Il-sito-AI
node scripts/dev-server.mjs
```

Poi apri `http://localhost:8080`.

> Non aprire `index.html` con un doppio clic: gli indirizzi puliti
> (`/shop`, `/product?id=7`) hanno bisogno di un server che sappia servire
> `404.html`, esattamente come fa GitHub Pages. È quello che fa questo script.

---

## Cosa controllare nel SITO

### Indirizzi dei prodotti — è la novità di M0
- [ ] Apri un prodotto: l'indirizzo diventa `…/product?id=7` (prima erano tutti `/product`)
- [ ] Copia quell'indirizzo, incollalo in una scheda nuova → si apre **lo stesso** prodotto
- [ ] Cambia l'id a mano (`?id=23`) → si apre un prodotto **diverso**
- [ ] Metti un id inesistente (`?id=99999`) → finisci sul catalogo, senza errori

### Navigazione
- [ ] Tutte le voci di menu: Home, Shop, Digitale, B2B, Portfolio, Chi Siamo, FAQ, Preventivo
- [ ] Il tasto **indietro** del browser torna alla pagina giusta
- [ ] Ricaricando una pagina interna resti su quella pagina
- [ ] Scrivendo solo il dominio arrivi alla **home** (non allo shop)

### Catalogo e carrello
- [ ] Lo shop mostra **55 prodotti** (35 sono nascosti dall'Admin)
- [ ] Ricerca, filtri per categoria/materiale, ordinamento
- [ ] Aggiungi al carrello → quantità e totale corretti
- [ ] Il totale è **lineare**: 10 pezzi = 10 × prezzo (lo sconto a scaglioni è stato rimosso)
- [ ] Scheda prodotto: **nessun** selettore materiali, **nessun** campo testo, **nessuna** tabella sconti

### Lingua e aspetto
- [ ] IT / EN cambiano i testi
- [ ] Chiaro / scuro
- [ ] Su telefono: menu, griglie e immagini

---

## Cosa controllare nell'ADMIN

Apri `…/admin.html`.

### Prima di tutto
- [ ] **Impostazioni** → il repository è `inglyum / Il-sito-AI` (⚠️ **non** `Sito-claude-code-`)

### Prodotti — le correzioni di questa settimana
- [ ] **Nuovo prodotto** → compila → **Salva**: il prodotto resta nella lista
- [ ] Salva con il **nome vuoto** o **prezzo 0** → la finestra **resta aperta** e mostra l'errore in rosso
- [ ] Modifica un prodotto esistente → Salva → la modifica c'è
- [ ] **Ricarica la pagina**: l'Admin chiede se riprendere le modifiche non pubblicate
  - «OK» → ritrovi il lavoro
  - «Annulla» → riparti dai dati del sito
- [ ] In alto compare «*n* modifiche in bozza»

### Media Library
- [ ] Carica un'immagine → la destinazione **➕ Nuova tessera Portfolio** esiste
- [ ] «Solo libreria» spiega cosa fa

### Altri pannelli
- [ ] Tecnologie: le 6 voci hanno emoji, badge e lista materiali
- [ ] Categorie, Portfolio, Recensioni, Temi, Social Hub, SEO si aprono senza errori

### Pubblicazione (solo quando vuoi davvero pubblicare)
- [ ] **Pubblica** → il riepilogo elenca i file modificati
- [ ] Se qualcuno ha modificato il repository dopo il caricamento, compare
      l'avviso di sovrascrittura: **Annulla** è la scelta giusta

---

## Se qualcosa non va

Apri la console del browser (`F12` → *Console*) e guarda se ci sono righe rosse.
Riportamele insieme a **cosa stavi facendo**: con quelle due informazioni il
problema si trova quasi sempre subito.

Se il sito mostra «Impossibile caricare i dati del sito», ricarica una volta:
si ripara da solo svuotando la cache. Se persiste, è un guasto vero.

---

## Test automatici (per me, o se vuoi provarli tu)

```bash
node scripts/validate-data.mjs   # coerenza dei dati
node tests/test-admin.mjs        # 153 controlli sull'Admin
node tests/test-css.mjs          # regressioni CSS/immagini
```

Devono chiudersi tutti senza errori. Se uno fallisce, **è un guasto vero**:
la suite è stata ripulita apposta perché un fallimento significhi qualcosa.
