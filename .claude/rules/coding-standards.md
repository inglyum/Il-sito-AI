# CODING STANDARDS — INGLY ENTERPRISE

## JavaScript

### Module system
- All new code: ES modules (import/export)
- Never: CommonJS (require/module.exports) in browser code
- `app.fallback.js` is the ONLY UMD bundle — maintain it in sync with main.js changes

### Naming
```javascript
// Functions: verb + noun camelCase
renderProducts()    // renders to DOM
initNav()           // one-time setup
bindLightbox()      // attaches event listeners
applyThemeAccent()  // applies state to DOM

// Variables: camelCase
const currentPage = 'shop';
let cartItems = [];

// Constants: SCREAMING_SNAKE if truly constant at module level
const PAGES = ['home', 'shop', 'product'];
const SP_ORDER = { gold: 0, silver: 1 };

// DOM element references: $ shorthand (from utils.js)
const grid = $('shopGrid');  // equivalent to document.getElementById('shopGrid')
```

### Event handling
```javascript
// ALWAYS: central delegation via actions map in main.js
// NEVER: inline handlers in render functions
// NEVER: addEventListener inside loops

// Adding a new action:
const actions = {
  // ... existing actions ...
  'my-new-action': el => doSomething(el.dataset.arg),
};

// HTML counterpart:
// <button data-action="my-new-action" data-arg="value">...</button>
```

### i18n
```javascript
// ALWAYS: use T() helper for UI strings
import { T } from './utils.js';
el.textContent = T('myKey');  // reads window.INGLY.D[L].myKey

// Adding a new string: edit data/texts.json
// { "myKey": { "it": "Testo italiano", "en": "English text" } }
// NEVER: hardcode Italian or English text in JS files
```

### Error handling
```javascript
// Simple try/catch for API calls (forms, admin)
try {
  const r = await fetch(url, options);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const data = await r.json();
  // success path
} catch (e) {
  toast(T('formsErr'));  // user-friendly error, never raw error.message
  console.error('[INGLY]', e);  // technical detail for debugging
}

// DOM queries: always null-check
const el = document.getElementById('myElement');
if (!el) return;  // graceful exit, not throw
```

### Performance
```javascript
// Batch DOM writes: build string, then single innerHTML assignment
$('grid').innerHTML = items.map(item => `<div>${item.name}</div>`).join('');
// NEVER: append in a loop (reflow per iteration)

// Avoid layout thrash: don't read layout after writing
// BAD:
items.forEach(el => { el.style.width = el.offsetWidth + 10 + 'px'; });
// GOOD:
const widths = items.map(el => el.offsetWidth);
items.forEach((el, i) => { el.style.width = widths[i] + 10 + 'px'; });
```

## CSS

### Variable usage
```css
/* ALWAYS use variables, never raw values */
color: var(--ink);                          /* ✓ */
color: #eae8f5;                             /* ✗ */
background: var(--bg-deep);                 /* ✓ */
background: #0a0d18;                        /* ✗ */
font-size: var(--fs-base);                  /* ✓ */
font-size: 16px;                            /* ✗ (except in :root definition) */
transition: color var(--dur) ease;          /* ✓ */
transition: color 300ms ease;               /* ✗ */
```

### Selector specificity
```css
/* Prefer class selectors, avoid ID selectors */
.pcard { ... }         /* ✓ */
#shopGrid .pcard { }   /* ✓ when scoping needed */
#shopGrid { ... }      /* ✓ for unique elements */

/* Never: !important except in the safety nets: */
img.pimgph { opacity: 1 !important; }   /* ← safety net, never remove */

/* Never: deep nesting beyond 3 levels */
.page .section .card { }       /* ✓ */
.page .section .card .body { } /* ✓ */
.page .section .card .body p { } /* ✗ — too deep */
```

### Media queries
```css
/* Use established breakpoints only (from responsive.css): */
/* 1160, 980, 820, 640, 480, 340 */
@media (max-width: 820px) { ... }  /* ✓ */
@media (max-width: 768px) { ... }  /* ✗ — not in our system */

/* Prefer max-width (mobile-last) for overrides */
/* The base styles are designed for desktop */
```

### Dark/light mode
```css
/* Always define colors in variables.css: */
:root { --ink: #eae8f5; }                   /* dark mode default */
[data-mode="light"] { --ink: #141830; }     /* light mode override */

/* Component just uses the variable: */
.myComponent { color: var(--ink); }         /* ✓ — works in both modes */
.myComponent { color: #eae8f5; }            /* ✗ — broken in light mode */
```

## HTML

### Semantic structure
```html
<!-- Use semantic elements: -->
<article class="pcard">     <!-- product card = article -->
<section class="page">      <!-- page section -->
<nav>                       <!-- navigation -->
<main>                      <!-- main content -->
<header>                    <!-- site header -->
<footer>                    <!-- site footer -->
<figure>                    <!-- images with captions -->
<details><summary>          <!-- accordion FAQ -->
```

### Data attributes for JS
```html
<!-- All JS hooks via data-action + data-arg: -->
<button data-action="open-product" data-id="1">...</button>
<button data-action="go" data-arg="shop">...</button>

<!-- i18n via data-i18n: -->
<span data-i18n="navHome">Home</span>

<!-- Placeholders via data-ph: -->
<input data-ph="searchPh" type="text">
```

### Accessibility
```html
<!-- All buttons: descriptive text or aria-label -->
<button aria-label="Aggiungi alla wishlist">♡</button>

<!-- All images: descriptive alt or empty for decorative -->
<img src="..." alt="Portachiavi in legno inciso con nome — INGLY DESIGN">
<img src="..." alt="">  <!-- decorative icon -->

<!-- All links: clear purpose -->
<a href="#/shop">Scopri il Catalogo</a>  <!-- ✓ -->
<a href="#/shop">Clicca qui</a>           <!-- ✗ -->
```

## Git

### Commit messages
```
feat: add bulk discount table to product page
fix: prevent img.pimgph animation override in dark mode
perf: preload hero image for faster LCP
docs: update stato-attuale.md with v4.2 changes
refactor: extract matArt guard to utils.js
test: add regression test for imgfade animation rule
chore: update sitemap dates to 2026-07-24
```

### Branch naming
```
claude/feature-description  (AI-generated features)
feat/feature-description    (new features)
fix/bug-description         (bug fixes)
perf/optimization-topic     (performance)
```

### Never
```
- Never commit: .env, tokens, credentials
- Never commit: /node_modules/, /dist/, temp files
- Never: git push --force to main
- Never: git commit -m "fix" (no description)
- Never: auto-commit from GitHub Actions workflow
```
