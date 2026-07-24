> ⚠️ AGGIORNATO v2.5 — il motore multi-tema **esiste ed è in produzione**.
> Struttura dati, comportamento e limiti reali sono descritti in `docs/kb/stato-attuale.md` e `docs/TEMI.md`.
> Il testo che segue è la progettazione originale, mantenuta come contesto storico.

# INGLY DESIGN — Theme Engine (stato attuale + proposta)

## Stato reale del codice (da non dare per scontato)
Ad oggi il sito **ha un solo tema**, quello definito in `assets/css/variables.css` sotto il commento `TEMA IMMERSIVO (vince sul precedente)`. **Non esiste** nel codice attuale un sistema di temi stagionali (Natale, Black Friday, Summer, ecc.) già costruito, pluggabile o attivabile da Admin. Qualunque skill o agente che parli di "cambiare tema" deve saperlo e non inventare funzionalità inesistenti.

## Come è strutturata la base su cui costruire i temi
Tutto il sito legge colori/font/raggi/ombre solo tramite le variabili CSS in `:root` (vedi `design-system.md`). Questo è ciò che rende *possibile* un theme engine in futuro senza refactor massiccio: un tema è, in teoria, un secondo blocco di variabili CSS che sovrascrive `:root` sotto una classe (es. `body.theme-natale{--blue:...; --laser:...}`) o un attributo (`[data-theme="natale"]`).

## Se viene chiesto di creare un tema stagionale
1. Non toccare mai `data/*.json` a mano per attivare un tema (vedi `admin-rules.md`) — un theme engine reale dovrebbe passare dall'Admin/dati, non da modifiche manuali sparse.
2. Definire il nuovo tema come blocco di override delle variabili esistenti in `variables.css` (stessa lista di variabili di `design-system.md`, valori nuovi), non come CSS parallelo che duplica le regole di `components.css`/`layout.css`.
3. Mantenere l'accento "laser" concettuale: anche un tema natalizio dovrebbe conservare il richiamo al fascio laser/scintilla come firma visiva del brand, reinterpretato (es. oro/rosso invece di giallo/arancio) — non sostituirlo con un'estetica genericamente natalizia scollegata dal brand.
4. Verificare sempre con `brand.md` e `design-system.md` che il nuovo tema resti riconoscibile come INGLY e non un sito diverso.
5. Qualunque proposta di attivazione automatica per data (es. "attiva Natale dal 1 dicembre") è un'estensione dell'Admin (Git-based CMS, vedi `admin-rules.md`), non qualcosa che si fa con JS lato client basato su `new Date()` sparso nel codice — va progettata come modulo Admin coerente con `docs/ARCHITECTURE.md`.

## Roadmap collegata
Il theme engine multi-stagionale non è nella Fase C attuale (`roadmap.md`, "cosa resta"): è un'estensione futura. Se il progetto lo richiede, va proposto come nuovo modulo Admin, coerente col principio "mai modificare JSON a mano, tutto dall'Admin, in un unico commit".
