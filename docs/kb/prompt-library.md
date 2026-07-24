# INGLY DESIGN — Prompt Library per AI Artwork

Linee guida per generare prompt di immagini AI coerenti con `brand.md` e `design-system.md`.

## Struttura consigliata di un prompt
1. **Soggetto** — oggetto/prodotto reale del catalogo (vedi `ecommerce-rules.md`), mai un soggetto generico scollegato dal catalogo.
2. **Tecnica/materiale** — nominare esplicitamente la texture reale: incisione laser su legno (venature visibili, bruciatura leggera ai bordi), taglio laser su plexiglass (bordi lucidi/traslucidi), stampa UV (colori saturi, superficie lucida), DTF (texture morbida su tessuto), stampa 3D (strati visibili, PLA opaco).
3. **Palette** — richiamare i colori di `design-system.md` per sfondo/ambientazione (`--paper #0a0d18`, accenti `--blue #3b7de0`, `--laser #f5d94e`, `--spark #ff8a3c`), non colori a caso.
4. **Illuminazione** — coerente col tema "immersivo scuro": preferire luce direzionale drammatica, riflessi del fascio laser, piuttosto che flat-light da catalogo bianco.
5. **Composizione** — prodotto in primo piano, sfondo scuro/minimal, stile "product shot premium", non collage affollati.
6. **Aspect ratio** — indicare sempre in base all'uso: `1:1` per card prodotto/categoria, `16:9` per hero/banner, `9:16` per social/stories.
7. **Negative prompt** — sempre escludere: loghi/watermark di terzi, personaggi coperti da copyright, testo illeggibile/storpiato, mani deformate, stile "clipart economica".

## Esempio di prompt (testo da adattare, non da copiare identico ogni volta)
"Product photo, custom laser-engraved wooden house plaque with visible wood grain, dark navy-black background (#0a0d18), single dramatic blue-white light source with a subtle warm amber laser-beam highlight, premium minimal studio composition, 1:1, no text, no watermark, no logos"

## Regole del Brand Guardian sui prompt
- Ogni prompt generato per INGLY deve essere valutabile rispetto a `design-system.md` (palette/tono) e `laser-business.md` (materiali reali): se un prompt propone un materiale non lavorato dal brand, va segnalato prima di generare l'immagine.
- Evitare stili "cartoon"/"kawaii"/eccessivamente colorati: non coerenti col posizionamento premium-scuro del brand.
- Non riprodurre mai loghi, brand o personaggi di terzi nelle immagini generate, nemmeno come riferimento stilistico esplicito.
