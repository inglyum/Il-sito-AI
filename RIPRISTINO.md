# Come tornare indietro

Questo repository serve **inglydesign.it**: quello che finisce su `main` va
online. Prima di ogni lavoro importante viene creato un ramo di salvataggio,
così tornare indietro è una cosa di due minuti e non una notte in bianco.

## Punti di ripristino disponibili

| Ramo | Cos'è |
|---|---|
| `backup-2026-08-02-1917` | Sitemap pulita, dati strutturati senza duplicati, −87KB di JavaScript, cruscotto Admin, abbinamento automatico foto, modulo preventivo privati/aziende. Suite verde. |
| `backup-prima-anteprima-2026-07-31` | Versione precedente, prima dei lavori di agosto. |

Per vedere tutti i salvataggi:
`https://github.com/inglyum/Il-sito-AI/branches`

## Ripristino dal browser, senza riga di comando

1. Apri `https://github.com/inglyum/Il-sito-AI/compare`
2. **base:** `main` — **compare:** il ramo di salvataggio che vuoi
3. «Create pull request» → «Merge»

Funziona quando devi solo **riportare indietro** dei file. Se `main` è andato
avanti con lavoro da tenere, questa strada crea un conflitto: in quel caso usa
la procedura qui sotto.

## Ripristino completo (sostituisce `main`)

```bash
git clone https://github.com/inglyum/Il-sito-AI.git
cd Il-sito-AI

# mette al sicuro com'è adesso, prima di toccare qualsiasi cosa
git push origin main:refs/heads/prima-del-ripristino-$(date +%Y-%m-%d-%H%M)

# riporta main esattamente al salvataggio scelto
git checkout -B main origin/backup-2026-08-02-1917
git push --force-with-lease origin main
```

`--force-with-lease` si rifiuta di scrivere se nel frattempo qualcuno ha
pubblicato dall'Admin: è la differenza fra un ripristino e una cancellazione.

## Dopo il ripristino

- Il sito torna online nella versione ripristinata in 1–2 minuti.
- **Il file `CNAME` deve restare.** Se il ramo di salvataggio non ce l'ha,
  ricrealo con dentro `inglydesign.it`, altrimenti il sito risponde solo su
  `inglyum.github.io/Il-sito-AI/`.
- Chi ha già visitato il sito potrebbe vedere ancora la versione precedente per
  qualche minuto: CSS e JavaScript sono serviti «prima dalla rete», quindi si
  aggiornano da soli al ricaricamento.

## I dati non stanno solo qui

Prodotti, categorie e contenuti vivono in `data/*.json` e ogni pubblicazione
dall'Admin è un commit: la cronologia di GitHub è già un archivio completo.
L'Admin ha anche **Backup → Esporta**, che salva tutto in un file da tenere
fuori da GitHub — utile se sbagli *dentro* l'Admin e vuoi tornare indietro
senza toccare il repository.
