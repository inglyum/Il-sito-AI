# INGLY DESIGN — Regole Ecommerce (schema dati reale)

Fonte: `data/products.json`, `data/categories.json`, `data/config.json`, `assets/js/products.js`, `assets/js/data-loader.js`.

## Schema prodotto (`data/products.json`, array)
```json
{
  "id": 1,
  "cat": "casa",
  "sub": 1,
  "n": { "it": "Targa Casa Personalizzata", "en": "Custom House Plaque" },
  "mat": "Legno",
  "price": 34,
  "icon": "🪧",
  "rev": 67,
  "coll": ["best"],
  "tag": "Best",
  "prod": 3
}
```
- `cat`: id categoria (foreign key verso `categories.json`).
- `sub`: indice numerico della sottocategoria dentro `categories[cat].sub`.
- `n`: nome bilingue IT/EN — va sempre popolato in entrambe le lingue.
- `mat`: materiale principale (es. "Legno" — vedi `laser-business.md` per l'elenco materiali del brand).
- `coll`: array di collection/etichette (es. `"best"`), usato per badge tipo "Best".
- `prod`: presumibilmente tempo/quantità di produzione — verificare in `assets/js/products.js` prima di assumere il significato esatto se serve usarlo in logica nuova.

## Schema categoria (`data/categories.json`, array)
```json
{
  "id": "casa",
  "ic": "🏠",
  "n": { "it": "Casa & Arredamento", "en": "Home & Living" },
  "s": { "it": "Targhe, lampade, quadri", "en": "Plaques, lamps, art" },
  "sub": [{ "it": "Decorazioni nome", "en": "Name decor" }, ...],
  "big": 1,
  "bg": "linear-gradient(150deg,#f3e7d3,#e2c9a2)",
  "icon": "casa"
}
```
- `ic`: emoji fallback. `icon`: chiave verso lo sprite `assets/icons/ingly-icons.svg` (vedi `design-system.md`) — se non esiste nello sprite, il sito ricade sull'emoji `ic`.
- `s`: sottotitolo breve bilingue mostrato sotto il nome categoria.
- `sub`: elenco sottocategorie bilingue (solo testo, non hanno id proprio: sono indicizzate per posizione, referenziate da `sub` nel prodotto).
- `bg`: gradiente CSS specifico della categoria — **non è nella palette globale di `design-system.md`**: ogni categoria ha un proprio gradiente identificativo, mantenere questa convenzione per nuove categorie invece di riusare i colori di brand.

## Configurazione business (`data/config.json`)
Contiene titolo/descrizione SEO, contatti, social, statistiche vetrina (`statistiche`), prodotti in evidenza in home (`heroFeatured`: array di id prodotto), FAB WhatsApp (`whatsappFab`). Vedi `brand.md` per i valori attuali.

## Regole operative
1. Mai inventare id categoria o prodotto: derivarli sempre da `categories.json`/`products.json` esistenti o proporre nuovi id coerenti con lo stile esistente (minuscolo, senza spazi, es. `"eventi"`, `"casa"`).
2. Ogni nuovo prodotto o categoria richiede **sempre** sia `it` che `en` popolati.
3. Prezzo (`price`) è un numero, valuta implicita EUR (non presente un campo valuta — non aggiungerne uno senza motivo, il sito è mono-valuta).
4. Qualunque modifica ai dati segue comunque la regola d'oro dell'Admin (`admin-rules.md`): mai a mano, sempre via Admin/commit atomico, tranne quando si sta lavorando in locale su una bozza da proporre.
