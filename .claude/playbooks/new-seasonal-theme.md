# Playbook: New Seasonal Theme

## When to use
When adding a seasonal theme (Christmas, Valentine's, Easter, Halloween, etc.) or modifying an existing one.

## Theme data structure (content.json → THEMES)
```json
{
  "id": "natale-2026",
  "nome": { "it": "Natale 2026", "en": "Christmas 2026" },
  "stato": "attivo",
  "dal": "12-01",
  "al": "12-31",
  "prio": 10,
  "palette": ["#b22222", "#1a3a1a", "#c4a35a", "#f5f5f5"],
  "bg": "stars",
  "art": {
    "arredamento": "img/nat-arredamento.webp",
    "eventi": "img/nat-eventi.webp"
  }
}
```

## Step-by-step

### 1. Define the theme
- `id`: lowercase, hyphenated, include year (e.g., `natale-2026`)
- `dal` / `al`: MM-DD format (wraps around year boundary if needed)
- `prio`: higher number = higher priority when multiple themes active simultaneously
- `palette`: 4 hex colors [primary, secondary, accent, text-on-dark]
- `bg`: artwork style key from artwork.js

### 2. Available artwork styles (window.INGLY_ART)
```
stars / snowflakes / hearts / flowers / dots / waves
grid / hexagons / diamonds / leaves / circles / lines / noise
```

### 3. Create promo bar for the season
```json
{
  "attivo": true,
  "id": "natale-2026-promo",
  "dal": "12-01",
  "al": "12-24",
  "testo": {
    "it": "Spedizione gratuita per ordini natalizi sopra €60!",
    "en": "Free shipping on Christmas orders over €60!"
  },
  "cta": { "it": "Scopri i regali", "en": "Find gifts" },
  "link": "#/shop?cat=eventi",
  "colori": "#b22222,#1a3a1a"
}
```

### 4. Verify
- [ ] Category bento cards pick up the seasonal artwork
- [ ] `--theme-accent` changes the site accent color
- [ ] `--theme-bg` appears as subtle background on hero
- [ ] Promo bar appears and is dismissible
- [ ] Theme deactivates automatically after `al` date

## Recurring seasonal calendar

| Season | ID suffix | dal | al |
|--------|-----------|-----|----|
| San Valentino | valentino | 02-01 | 02-14 |
| Pasqua | pasqua | varies | varies |
| Festa della Mamma | mamma | 05-08 | 05-12 |
| Estate | estate | 06-21 | 09-21 |
| Halloween | halloween | 10-15 | 10-31 |
| Natale | natale | 12-01 | 12-31 |
| Capodanno | capodanno | 12-26 | 01-06 |
