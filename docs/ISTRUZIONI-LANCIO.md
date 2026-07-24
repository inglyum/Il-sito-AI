# INGLY — Istruzioni per il lancio

Guida completa dal file zip al sito online. Nessuna competenza tecnica richiesta: segui i passi in ordine.

## Cosa ti serve
- Un account GitHub (gratuito) — se non ce l'hai, crealo su github.com.
- Il tuo repository: `https://github.com/inglyum/Sito-ingly` (già esistente).
- 15 minuti la prima volta. Le volte successive: pochi secondi per pubblicare.

---

## PARTE 1 — Mettere il sito online (una volta sola)

**1. Carica i file nel repository**
- Apri il file `INGLY-sito-PRO-v4.2.zip` ed estrai tutto.
- Su GitHub, entra nel tuo repository → «Add file» → «Upload files».
- Trascina **tutto il contenuto** della cartella estratta (non la cartella, il contenuto).
- In basso scrivi un messaggio tipo «Sito v4.2» e premi «Commit changes».

**2. Attiva GitHub Pages**
- Nel repository: «Settings» → «Pages» (menu a sinistra).
- Alla voce «Source» scegli **Deploy from a branch**.
- Branch: **main**, cartella: **/ (root)**. Premi «Save».
- ⚠️ NON scegliere «GitHub Actions»: deve essere «Deploy from a branch».
- Dopo 1-2 minuti il sito è online su `https://inglyum.github.io/sito-ingly/`.

---

## PARTE 2 — Collegare il pannello Admin (una volta sola)

Il pannello (`admin.html`) è la tua centrale di controllo. Per fargli pubblicare le modifiche
serve una «chiave» personale di GitHub, chiamata token.

**1. Crea il token**
- Vai su github.com → clicca la tua foto (alto a destra) → «Settings».
- In fondo a sinistra: «Developer settings» → «Personal access tokens» → «Fine-grained tokens».
- «Generate new token». Dai un nome (es. «INGLY Admin»), scadenza a piacere.
- Alla voce «Repository access» scegli «Only select repositories» e seleziona **Sito-ingly**.
- Alla voce «Permissions» → «Repository permissions» → «Contents»: metti **Read and write**.
- Premi «Generate token» e **copia** il codice che appare (inizia con `github_pat_...`).
  ⚠️ Lo vedi una volta sola: copialo subito.

**2. Incollalo nel pannello**
- Apri `https://inglyum.github.io/sito-ingly/admin.html`.
- Vai su «Impostazioni» → incolla il token nel campo apposito.
- Premi «Test connessione». Se è verde, sei pronto.
  Il token resta salvato solo sul tuo dispositivo, non finisce mai online.

---

## PARTE 3 — Il ciclo di lavoro quotidiano

Ogni volta che vuoi cambiare qualcosa sul sito:

1. Apri il pannello Admin.
2. Modifica quello che ti serve (prodotti, foto, portfolio, recensioni, sponsor…).
3. Vai su «Pubblica & Deploy». Il pannello controlla i dati: se qualcosa è rotto,
   te lo dice in rosso e **blocca** la pubblicazione prima che rompa il sito.
4. Se è tutto verde, premi «Pubblica tutto». Le modifiche vanno online in 1-2 minuti.

**Regola d'oro**: non modificare mai i file a mano su GitHub. Tutto passa dal pannello,
che tiene i dati coerenti e fa un unico salvataggio pulito.

---

## PARTE 4 — Le cose che vorrai fare subito

**Caricare le foto del portfolio** (le tessere «Dal laboratorio» con le icone colorate)
- Admin → «Portfolio» → «📷 Carica più foto» → seleziona più immagini insieme.
- Le icone colorate sono solo segnaposto: appena carichi una foto, spariscono.

**Raccontare un progetto** (la parte che distingue uno studio premium)
- Admin → «Portfolio» → clicca una tessera → compila «Dettagli del progetto»:
  cliente, materiali, macchina usata, il racconto, foto delle fasi, prima/dopo.
- Sul sito, cliccando quella tessera si aprirà la scheda completa del lavoro.

**Aggiungere più foto a un prodotto**
- Admin → «Prodotti» → apri un prodotto → «🖼 Immagini del prodotto» → «➕ Aggiungi alla gallery»
  (puoi caricarne molte insieme). Sul sito diventano miniature navigabili.

**Compilare la tabella misure**
- Nella scheda prodotto, campo «📐 Tabella misure»: una riga per voce, formato `Etichetta | Valore`.
  Esempio: `Dimensioni | 30 × 20 cm`. Appare nella colonna informazioni del prodotto.

**Fare un backup completo**
- Admin → «Backup» → «Esporta» → alla domanda «Includere anche le immagini?» rispondi **SÌ**.
  Così il file contiene tutto e, reimportandolo, ritrovi anche le foto (serve il token collegato).

---

## Se qualcosa non va

- **«Impossibile caricare i dati»**: di solito è un materiale scritto male in un prodotto.
  Il pannello ora te lo segnala prima di pubblicare. Correggi e ripubblica.
- **Le modifiche non si vedono**: aspetta 1-2 minuti (GitHub deve ricostruire) e ricarica
  con Ctrl+F5. La verifica nel pannello ti conferma quando il sito è aggiornato.
- **Il token non funziona più**: i token scadono. Creane uno nuovo (Parte 2) e reincollalo.

---

## Modalità chiara e scura
In alto, accanto alla lingua, c'è l'interruttore ☀/🌙. La scelta viene ricordata.
Se non scegli, il sito segue le impostazioni del tuo telefono o computer.
