# INGLY DESIGN — Design System

Fonte: `assets/css/variables.css`, `assets/css/components.css`, `assets/css/layout.css`, `assets/css/pages.css`, `assets/css/reset.css`, `assets/css/responsive.css`, `assets/css/animations.css`.

## Palette (tema "immersivo" — l'unico attivo, definito in `:root`)
| Variabile | Hex/valore | Uso |
|---|---|---|
| `--paper` | `#0a0d18` | sfondo pagina (blu-nero profondo) |
| `--white` | `#12162a` | superfici/card (nome legacy, in realtà è scuro) |
| `--graphite` | `#141830` | superfici secondarie |
| `--gray` | `#171c33` | superfici terziarie |
| `--ink` | `#eef1fb` | testo primario (quasi bianco) |
| `--ink-soft` | `#9aa3c7` | testo secondario/muted |
| `--line` | `rgba(140,160,220,.16)` | bordi/divisori sottili |
| `--blue` | `#3b7de0` | colore primario di brand/CTA |
| `--blue-hi` | `#5a95f0` | hover/accent del blu |
| `--laser` | `#f5d94e` | accento "giallo laser" — richiama il fascio di incisione |
| `--spark` | `#ff8a3c` | accento "scintilla arancio" — usato per enfasi/badge |

**Regola Brand Guardian:** qualunque nuovo colore in UI deve derivare da queste variabili (o da una loro variazione di opacità/luminosità), mai colori hardcoded nuovi. `--laser` e `--spark` sono accenti "scarsi": vanno su dettagli (badge, icone attive, micro-highlight), non su superfici larghe.

## Tipografia
- Font display: `Exo 2` (`--fd`) — usato per titoli, elementi "tech".
- Font fallback/corpo: `Inter, system-ui, sans-serif` (`--fb`).
- Scala tipografica: `--fs-xs:11px · --fs-sm:12.5px · --fs-base:14px · --fs-md:16px · --fs-lg:18px · --fs-xl:20px · --fs-2xl:25px · --fs-3xl:28px`.

## Forme e profondità
- Raggio standard: `--radius:20px`, raggio grande: `--radius-lg:28px`.
- Easing standard: `--ease:cubic-bezier(.16,1,.3,1)`.
- Scala elevazione a 4 livelli (solo profondità strutturale — i bagliori colorati laser/blu sono effetti separati, non elevazione):
  - `--elev-1: 0 2px 8px rgba(0,0,0,.16)` — leggero
  - `--elev-2 (--shadow-soft): 0 10px 40px rgba(0,0,0,.45)`
  - `--elev-3: 0 18px 40px rgba(0,0,0,.28)`
  - `--elev-4 (--shadow-lift): 0 24px 60px rgba(0,0,0,.55)`

## Icone
Sistema icone proprietario INGLY: 38 icone vettoriali disegnate nello stile del logo (outline, tratto uniforme, geometrie coerenti) in `assets/icons/ingly-icons.svg`, usate in categorie e tecnologie. Il colore è ereditato dal contesto (funzionano su sfondo chiaro e scuro) con fallback automatico all'emoji se l'icona non esiste. Non introdurre librerie icone esterne (es. Font Awesome, Material Icons): estendere sempre lo sprite `ingly-icons.svg` nello stesso stile.

## Componenti
Cataloghi CSS: `layout.css` (griglie/struttura pagina), `components.css` (card, bottoni, form, modali, nav — 38KB, il file più grande: consultarlo prima di creare un componente nuovo per evitare duplicati), `pages.css` (stili specifici di pagina), `animations.css` (transizioni/keyframe, usa sempre `--ease`), `reset.css`, `responsive.css`.

## Regola d'oro del Design System
Prima di introdurre un nuovo colore, font, radius o shadow, controllare se esiste già una variabile equivalente in `variables.css`. Se manca davvero, va aggiunta lì come variabile, mai come valore hardcoded sparso nei componenti.
