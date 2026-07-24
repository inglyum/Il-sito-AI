# NON-NEGOTIABLE RULES — INGLY ENTERPRISE
# These 14 rules are derived from real production bugs.
# Violating any will break the live site.
# Read before ANY code change. No exceptions.

---

## RULE 1 — NEVER set animation on product/gallery/category images
```
NEVER: img.pimgph { animation: none; }
NEVER: img.gimg   { animation: none; }  
NEVER: img.bimg   { animation: none; }

WHY: animation:imgfade brings opacity from 0→1.
     Any override with animation:none makes them permanently invisible.
     BUG OCCURRED: v2.3→v2.5 (discovered in production).

SAFETY NET (never remove from components.css):
img.pimgph { opacity: 1 !important; }
```

## RULE 2 — srcset only for variants that actually exist in MV map
```
WRONG: srcset="img/1-400.webp 400w, img/1-800.webp 800w"  ← if files don't exist
RIGHT: read window.INGLY.MV["img/1.webp"] → [400,800] → then declare those

WHY: Browser chooses 800w srcset, file returns 404, image is blank.
     MV is a map {"img/1.webp":[400,800]} — never an array.
```

## RULE 3 — Product sub must be 1 to category.sub.length (never 0)
```
WRONG: product.sub = 0
RIGHT: product.sub = 1..n where n = category.sub.length

WHY: sub=0 means "no subcategory selected" which hides the product from filters.
     Admin auto-corrects on load; CI blocks in validate-data.mjs.
```

## RULE 4 — GitHub Pages: Deploy from branch → main → / (root)
```
WRONG: Settings → Pages → GitHub Actions
RIGHT: Settings → Pages → Deploy from branch → main → / (root)

WHY: Actions mode: admin commit goes live only after workflow runs (~2 min).
     Branch mode: admin commit IS the deploy. Immediate verification possible.
```

## RULE 5 — No workflow must auto-commit to the branch
```
WRONG: A GitHub Actions workflow that does `git commit && git push`
RIGHT: All commits come from the Admin panel via Git Data API only

WHY: Auto-commits conflict with atomic publication.
     Race condition: admin commit + workflow commit → merge conflict.
```

## RULE 6 — No API keys in front-end code
```
WRONG: const API_KEY = "sk-abc123";  // in any .js or .html file
RIGHT: Admin stores GitHub token in sessionStorage/localStorage only.
       Formspree IDs are public-facing form endpoints (not secrets).

WHY: Front-end code is public. Any key in it is compromised.
```

## RULE 7 — Always use matArt() wrapper, never MAT_ART[mat] directly
```
WRONG: const style = MAT_ART[product.mat].bg;
RIGHT: const style = matArt(product.mat).bg;

WHERE: matArt() is in products.js
  const matArt = m => MAT_ART[m] || MAT_ART[Object.keys(MAT_ART)[0]] || { bg:'#3a2f26,#6b543e' };

WHY: Undefined material → MAT_ART[undefined] → undefined.bg → TypeError → entire site crashes.
     BUG OCCURRED: v2.7 (destroyed entire site render).
```

## RULE 8 — Never remove or weaken healData()
```
WHERE: assets/js/data-loader.js
WHAT IT DOES:
  - Repairs product sub=0 → 1
  - Ensures material exists in MAT_ART
  - Adds missing i18n keys from IT to EN
  - Repairs missing required fields with safe defaults
  - Logs all corrections to console

WHY: Any imperfect data (old backup, admin mistake) must never crash the site.
     healData() = three minutes of downtime prevented.
```

## RULE 9 — Backup import = MERGE, not replacement
```
WRONG: import replaces ALL of content.json with backup content
RIGHT: import merges — sections present in backup overwrite; sections absent are kept

WHY: A backup from before themes were added wiped all theme data on import.
     User lost all 103 theme definitions. Bug occurred and was catastrophic.
     Now: absent sections in backup file → preserved from current live data.
```

## RULE 10 — Focal point via FOCAL map, not inline style
```
WHERE: content.json → FOCAL = { "img/1.webp": "40% 30%" }
USE:   focalOf('img/1.webp') → style="object-position:40% 30%"

NEVER: img.style.objectPosition = "40% 30%"  ← lost on re-render
```

## RULE 11 — Generated SVG backgrounds use CSS variables, not inline style
```
WRONG: el.style.backgroundImage = window.INGLY_ART.css(...)
RIGHT: el.style.setProperty('--card-bg', window.INGLY_ART.css(...))
       Then in CSS: .bcard--gen { background-image: var(--card-bg); }

WHY: Any subsequent el.style.xxx reserializes the attribute and can drop long data-URIs.
     BUG OCCURRED: --rd delay assignment dropped a 2.6KB data-URI (v2.7).
```

## RULE 12 — Every .reveal section MUST be reached by observeAll()
```
CURRENT SELECTOR:
  document.querySelectorAll('.reveal, .counter, .cta-band')
  // Excludes pages that are not active: if(pg && !pg.classList.contains('active')) skip

WRONG: Adding a .reveal element outside .page.active, footer, or any observed container
RIGHT: observeAll() uses a broad selector — any .reveal anywhere is found

FAILSAFE: After 3 seconds, html.reveal-failsafe class makes all .reveal elements visible
WHY: A section with display:none or opacity:0 from .reveal that never fires .in = invisible forever
BUG OCCURRED: Sponsor section invisible (v3.1)
```

## RULE 13 — No publication without validation
```
Admin flow:
  1. validaBozza() runs automatically in "Pubblica" panel
  2. BLOCKS on: missing material, duplicate IDs, malformed sponsor links, category not found
  3. WARNS on: low-res images, missing translations
  4. CI also runs validate-data.mjs on every push

NEVER: disable validaBozza() to "speed up" publishing
```

## RULE 14 — Data-URIs in style= attributes use single quotes
```
WRONG: el.style.cssText = `background: url("data:image/svg+xml,...")`
RIGHT: el.style.cssText = `background: url('data:image/svg+xml,...')`
       And encode single quotes: .replace(/'/g, '%27')

WHERE: INGLY_ART.css() already does this correctly. Never change it.
WHY: Double-quoted attribute value is truncated at first " inside it.
     Background disappears silently (no console error).
     BUG OCCURRED: v2.7 intercepted by test-css.mjs
```
