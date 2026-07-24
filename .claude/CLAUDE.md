# INGLY ENTERPRISE — AI OPERATING SYSTEM
# Chief AI Research Director Knowledge Base
# Version: 1.0 | Last updated: 2026-07-24

> This file is the primary context document loaded by Claude Code at session start.
> It supersedes all other files in case of conflict.
> Every agent, skill, and workflow in this system derives from this document.

---

## 1. MISSION

Transform INGLY DESIGN — a laser engraving, UV, DTF, and 3D printing studio based in Cesena, Italy —
into a world-class AI-native ecommerce platform comparable in engineering quality to Shopify, Framer,
Linear, and Medusa, while remaining 100% static-hostable on GitHub Pages.

The development environment is the FIRST product. The ecommerce platform is the SECOND.

---

## 2. PLATFORM IDENTITY

| Field         | Value                                  |
|---------------|----------------------------------------|
| Brand         | INGLY DESIGN                           |
| Owner         | inglydesign@gmail.com                  |
| Phone/WA      | +39 329 690 4627                       |
| Location      | Cesena, Emilia-Romagna, Italia         |
| Domain        | https://www.inglydesign.it             |
| Repo          | inglyum/Ingly-standalone-html          |
| Branch        | main (production)                      |
| Hosting       | GitHub Pages → Cloudflare CDN          |
| Admin         | admin.html (Git-based CMS)             |
| Languages     | Italian (default) + English            |

---

## 3. ARCHITECTURE OVERVIEW

```
GitHub (source of truth)
  └── main branch
        ├── index.html          ← SPA shell (8 hash-routed pages)
        ├── admin.html          ← Git-based CMS (no build required)
        ├── assets/
        │   ├── css/            ← 7 CSS modules (variables, reset, layout,
        │   │                      components, pages, animations, responsive)
        │   ├── js/             ← 12 ES modules + UMD fallback
        │   └── icons/          ← SVG sprite (38 icons)
        ├── data/               ← JSON source of truth + auto-generated .js wrappers
        │   ├── config.json     ← site config, social links, stats
        │   ├── products.json   ← product catalog
        │   ├── categories.json ← 12 categories with subcategories
        │   ├── content.json    ← portfolio, reviews, themes, promo, sponsors
        │   ├── social.json     ← social links with SVG icons
        │   └── texts.json      ← i18n strings (IT/EN)
        ├── scripts/            ← CI validation (Node.js, no dependencies)
        ├── tests/              ← automated test suite (91+ assertions)
        └── .github/workflows/  ← CI/CD (validate.yml, qa.yml)
```

**Data flow:** Admin edits → JSON → Git Data API → single atomic commit → GitHub Pages rebuild → Cloudflare CDN → users.

**JS module chain:** `app.js` → `data-loader.js` → `main.js` → (navigation, products, forms, animations, seo, lazyload, artwork)

---

## 4. TECHNOLOGY STACK

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Hosting     | GitHub Pages + Cloudflare (CDN, DDoS, SSL)    |
| Frontend    | Vanilla ES modules + UMD fallback bundle       |
| Styling     | CSS custom properties, no framework            |
| Data        | JSON files, auto-generated JS wrappers         |
| Forms       | Formspree (Preventivo + Newsletter)            |
| Checkout    | WhatsApp cart (wa.me/ deep link)               |
| CMS         | admin.html (Git Data API, no server)           |
| CI/CD       | GitHub Actions (validate + QA)                 |
| Images      | WEBP + responsive variants (400/800px)         |
| i18n        | IT/EN via window.INGLY.D dictionary            |
| Themes      | 103 seasonal themes + artwork engine           |
| Animation   | CSS IntersectionObserver + Canvas API          |
| SEO         | JSON-LD (LocalBusiness, Product, FAQ, BL)      |
| PWA         | manifest.webmanifest + favicon set             |

---

## 5. THE 14 NON-NEGOTIABLE RULES

These rules are derived from real production bugs. Violating any will break the site.

1. **NEVER set `animation` on `img.pimgph`, `img.gimg`, `img.bimg`.**
   `animation: imgfade` brings opacity from 0→1. Any override with `animation:none` makes images permanently invisible.
   Safety net: `img.pimgph{opacity:1!important}` at bottom of `components.css`. Never remove it.

2. **`srcset` only for variants that actually exist.**
   `MV` is a map `{"img/1.webp":[400,800]}` never an array. Declaring a non-existent variant → 404 → invisible image.

3. **`sub` of a product must be 1 to `categoria.sub.length`.**
   `sub=0` hides the product from all filters. Admin auto-corrects; CI blocks it.

4. **GitHub Pages must be "Deploy from a branch" → main → / (root).**
   Actions-mode deployment prevents commit-based deploy verification from working.

5. **No workflow must make automatic commits on the branch.**
   Auto-commits conflict with atomic publication. Any `sistemazione.yml`-style workflow must be removed.

6. **No API keys in the front-end.**
   The site is public and static. GitHub token lives only in the Admin's sessionStorage/localStorage.

7. **Every read of `MAT_ART[p.mat]` must go through `matArt()`.**
   Undefined material crashed the entire site. Three-layer defense: `healData()`, `matArt()` guard, Admin dropdown.

8. **`healData()` is the parachute — never remove or weaken it.**
   Repairs malformed data in memory before rendering. Logs corrections to console.

9. **Backup import does MERGE, not replacement.**
   Sections absent in backup file are kept from current version. User is warned what was preserved.

10. **Focal point:** `content.json → FOCAL` map → `object-position` CSS property.
    Set by clicking the enlarged preview in the Media Library.

11. **Generated SVG backgrounds never go in `background-image` inline style.**
    Use CSS variables (`--card-bg`, `--theme-bg`). Inline style re-serialization drops long data-URIs.

12. **Every `.reveal` section MUST be reached by `observeAll()`.**
    Missing elements stay invisible forever. 3-second failsafe adds `html.reveal-failsafe` as backup.

13. **No publication without validation.**
    `validaBozza()` blocks on grave errors (missing material, duplicate IDs, malformed links).

14. **Data-URIs inside `style="..."` must use single quotes.**
    Double-quoted attributes truncate at the first `"`. `INGLY_ART.css()` encodes `'` as `%27`.

---

## 6. DATA STRUCTURES

### Product
```json
{
  "id": 1,
  "n": { "it": "Nome prodotto", "en": "Product name" },
  "cat": "arredamento",
  "sub": 1,
  "mat": "Legno",
  "price": 29.90,
  "icon": "🪵",
  "img": "img/1.webp",
  "gallery": ["img/1-g1.webp", "img/1-g2.webp"],
  "desc": { "it": "Descrizione", "en": "Description" },
  "tag": "New",
  "coll": ["best", "new"],
  "hero": false,
  "rev": 47,
  "sku": "ING-001",
  "video": "",
  "poster": "",
  "misure": [["Larghezza", "20 cm"], ["Altezza", "30 cm"]],
  "rel": [2, 3],
  "hidden": false,
  "prod": 3
}
```

### Category
```json
{
  "id": "arredamento",
  "n": { "it": "Arredamento", "en": "Home Decor" },
  "s": { "it": "Descrizione breve", "en": "Short description" },
  "ic": "🏠",
  "icon": "arredamento",
  "bg": "#3a2f26,#6b543e",
  "img": "img/cat-arredamento.webp",
  "big": false,
  "w": false,
  "sub": [
    { "it": "Sottocategoria", "en": "Subcategory" }
  ]
}
```

---

## 7. ACTIVE AGENTS IN THIS PROJECT

See `.claude/agents/` for full specifications. Active agents:

- `cto` — Strategic decisions, architecture evolution
- `architect` — System design, module boundaries  
- `frontend` — HTML/CSS/JS implementation
- `seo-expert` — SEO, JSON-LD, structured data
- `performance` — Core Web Vitals, loading optimization
- `security` — Token management, CSP, OWASP
- `testing` — Test suite, CI/CD
- `laser-expert` — Domain knowledge for product descriptions
- `prompt-engineer` — AI prompt systems for admin

---

## 8. QUICK REFERENCE

### Start a new session
```
1. Read this file (CLAUDE.md)
2. Read docs/kb/stato-attuale.md (current project state)
3. Check data/version.json (deployed version)
4. Run: node scripts/validate-data.mjs
```

### Deploy checklist
```
1. node scripts/validate-data.mjs ✓
2. node tests/test-sito.mjs ✓
3. node tests/test-admin.mjs ✓
4. node tests/test-css.mjs ✓
5. git add (specific files only, never -A blindly)
6. git commit -m "feat/fix/chore: description"
7. git push -u origin main
8. Verify on GitHub Pages
```

### CSS variable naming convention
```css
--bg-deep        /* deep background */
--bg-card        /* card background */
--ink            /* primary text */
--ink-soft       /* secondary text */
--accent         /* brand accent */
--theme-accent   /* seasonal theme override */
--line           /* borders */
--glass          /* glassmorphism */
--fs-xs … --fs-4xl  /* type scale (ratio 1.25) */
--lh-tight … --lh-loose  /* line heights */
```

### File image conventions
```
img/<id>.webp          ← product main photo
img/<id>-g<n>.webp     ← product gallery (n starts at 1)
img/port-<n>.webp      ← portfolio entry
img/cat-<id>.webp      ← category cover
img/sponsor-<n>.webp   ← sponsor logo
```
