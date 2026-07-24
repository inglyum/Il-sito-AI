# INSTALLAZIONE E AVVIO — guida in 5 minuti

## PASSO 1 — Carica i file nel repository
1. Vai su `https://github.com/inglyum/Sito-ingly` (o il repository che usi).
2. **Add file → Upload files** → trascina **tutto il contenuto** della cartella del progetto
   (importante: i file devono stare nella **radice**, non dentro una sottocartella:
   `index.html` deve vedersi subito nella lista).
3. Scrivi come messaggio `Admin 2.0` e premi **Commit changes**.

> Se sostituisci una versione precedente: carica sopra, GitHub sovrascrive i file con lo stesso nome.

## PASSO 2 — Attiva GitHub Pages (una volta sola)
1. Repository → **Settings** → **Pages**.
2. **Source**: `Deploy from a branch`
3. **Branch**: `main` — **Folder**: `/ (root)` → **Save**.

⚠️ Molto importante: **NON** usare «GitHub Actions» come Source. Con l'opzione Actions il sito
va online solo dopo un workflow e l'Admin non riesce a confermare la pubblicazione.
(L'Admin ora te lo dice da solo: pulsante **🩺 Diagnosi GitHub Pages**.)

Dopo 1–2 minuti il sito è su:
**https://inglyum.github.io/Sito-ingly/**

## PASSO 3 — Crea il token (una volta sola)
1. GitHub → foto profilo in alto a destra → **Settings**
2. In fondo a sinistra: **Developer settings**
3. **Personal access tokens → Fine-grained tokens → Generate new token**
4. Compila così:
   - **Token name**: `ingly-admin`
   - **Expiration**: 1 anno (o «No expiration»)
   - **Repository access**: `Only select repositories` → scegli **il tuo repository**
   - **Permissions → Repository permissions**:
     - **Contents** → **Read and write** ← obbligatorio
     - **Pages** → **Read-only** ← facoltativo, serve solo per lo stato del deploy
5. **Generate token** → **copia** il codice che inizia con `github_pat_…`
   (si vede una volta sola: copialo subito).

## PASSO 4 — Collega l'Admin
1. Apri **https://inglyum.github.io/Sito-ingly/admin.html**
2. Menu a sinistra → **⚙️ Impostazioni**
3. Owner, Repository e Branch sono già compilati in automatico dall'indirizzo: controlla che siano giusti.
4. Incolla il token nel campo **Token**, spunta *Ricorda il token su questo computer*.
5. Premi **🧪 Test connessione** → deve comparire in verde
   *«✔ Connesso a … con permesso di scrittura»*.

Fatto. Da adesso non tocchi più nessun file a mano.

---

# COME SI USA (il ciclo di lavoro)

1. Modifichi quello che vuoi nelle sezioni del menu (prodotti, categorie, foto, testi…).
   In alto a destra il pallino diventa **giallo**: ci sono modifiche in bozza.
2. Vai su **🚀 Pubblica & Deploy** → scrivi due parole nel messaggio → **Pubblica tutto**.
3. La pipeline fa tutto da sola: un solo commit, build di Pages, verifica del sito online.
4. Se compare *«non ancora confermato»*: **il lavoro è già salvo**, Pages sta solo finendo.
   Aspetta un minuto e premi **🔍 Verifica ora il sito online**.

## Dove si fa cosa

| Voglio… | Sezione |
|---|---|
| Aggiungere/modificare un prodotto | **📦 Prodotti** |
| Cambiare le card «12 mondi» (nome, testo, **foto**, sottocategorie) | **🗂 Categorie** → ✎ Modifica |
| Caricare foto ai prodotti (principale + gallery) | **🖼 Media Library** |
| Mettere le foto dei lavori nel Portfolio | **🏆 Portfolio** → ✎ → 📷 Carica |
| Modificare «Ingly Business — Il tuo brand, marcato per sempre» | **🏢 Sezione Business** |
| Scegliere i 3 prodotti della Home | **🎯 Home & Hero** |
| Cambiare qualunque frase del sito (IT e EN) | **✍️ Testi IT/EN** |
| Numero e messaggio del **pulsante WhatsApp** | **📞 Contatti & Social** |
| Titolo/descrizione Google | **🔎 SEO** |
| Controllare che sia tutto sano | **🩺 Health Center** |
| Tornare indietro a prima di un errore | **🕘 Cronologia** → ⤺ Ripristina |
| Salvare una copia di tutto | **💾 Backup** |

## Dominio personalizzato (facoltativo)
1. Dal tuo provider (Aruba, GoDaddy…) crea un record **CNAME**:
   `www` → `inglyum.github.io`
2. GitHub → Settings → Pages → **Custom domain** → scrivi `www.tuodominio.it` → Save
3. Spunta **Enforce HTTPS** (compare dopo qualche minuto).
4. Nell'Admin → **🔎 SEO** → campo **Dominio** → metti `https://www.tuodominio.it`, poi Pubblica.

## Se qualcosa non va
| Messaggio | Cosa fare |
|---|---|
| «Il token non vede il repository» | Rigenera il token scegliendo **quel** repository (Passo 3) |
| «Permessi insufficienti» | Al token manca **Contents → Read and write** |
| «Limite API superato» | Inserisci il token: senza, GitHub concede solo 60 richieste/ora |
| Il sito non si aggiorna | **🩺 Diagnosi GitHub Pages**: quasi sempre Source è impostato su «GitHub Actions» invece che sul branch (Passo 2) |
| Le foto non cambiano | Sono versionate in automatico: fai **Ctrl+F5** una volta |

## Regola d'oro
Mai modificare i file JSON a mano. Mai caricare immagini a mano.
**Tutto passa dall'Admin, in un unico commit.**
