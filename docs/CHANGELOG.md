# CHANGELOG — INGLY

## v4.2 — Correzione Salva + lancio
### Corretto
- **Pulsante «Salva» nell'editor portfolio non funzionava**: una funzione annidata (`hasProject`)
  era dichiarata dopo il suo uso, e l'handler andava in errore silenzioso senza salvare né chiudere.
  Riscritta la normalizzazione della tupla in modo lineare. Test aggiunto che riapre la tessera e
  verifica che i dati siano davvero stati scritti (avrebbe intercettato il bug).
### Migliorato
- Sezione «Dal laboratorio»: segnaposto più curato quando manca la foto; la seconda riga della striscia
  si nasconde se nessuna tessera ha immagini, per non raddoppiare l'effetto vuoto.
- Aggiunte le **istruzioni complete di lancio** (`docs/ISTRUZIONI-LANCIO.md`): dal file zip al sito online,
  passo per passo, senza competenze tecniche.

## v4.1 — Portfolio-progetto + correzioni
### Corretto
- **Tabella misure invisibile**: era nella colonna foto, coperta dalla tabella prezzi. Spostata nella
  colonna informazioni, sotto gli sconti. Ora si vede.
- **Zoom miniatura sbagliato**: cliccando una miniatura si apriva sempre la foto principale. Ora apre quella.
- **Tema chiaro con riquadri scuri** (tecnologie, footer, topbar): superfici legate a variabili, tutto chiaro.
### Aggiunto
- **Portfolio come progetto completo**: cliente, data, durata, settore, macchina, materiali, tecnologie,
  tag, racconto IT/EN, video, prima/dopo, foto multiple, prodotti collegati, in evidenza. Scheda progetto
  a schermo sul sito. Retrocompatibile: le tessere semplici restano semplici.

## v4.0 — "Pro"
### Corretto
- **Backup senza immagini** (bug grave): l'export ora può includere le foto (base64), l'import le
  ripristina nella coda di pubblicazione. Non si riparte più da zero dopo un ripristino.
- **Modalità chiara incompleta**: i colori scuri fissi (body, navbar, toast, etichette) seguivano il
  tema solo in parte. Ora l'intera pagina cambia coerentemente in chiaro e scuro.
### Aggiunto
- Gallery prodotto con **caricamento multiplo** (più immagini in una volta) e sezione immagini più chiara.
- Transizione morbida al cambio tema; **focus da tastiera sempre visibile** (accessibilità WCAG AA).
- Dati strutturati completi (Product+gallery, Breadcrumb, FAQ), campi SKU e rating, controllo integrità in CI.
### Rimosso
- `components/*.html` (tre file morti mai referenziati).

## Note di migrazione
- **Nessuna azione richiesta**: i dati esistenti restano compatibili. `healData()` normalizza in memoria.
- I vecchi backup (`_ingly_backup:2`, solo dati) si importano ancora: semplicemente non contengono immagini.
- Per un backup completo: Backup → Esporta → «Includere anche le immagini? SÌ» (serve il token GitHub).
- Il tema segue le preferenze di sistema finché non lo cambi a mano; poi ricorda la tua scelta.
