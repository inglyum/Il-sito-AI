# Architecture Report — INGLY ENTERPRISE v4.2
# Generated: 2026-07-24

## Executive Summary

INGLY DESIGN operates a 100% static ecommerce platform on GitHub Pages + Cloudflare CDN.
The architecture is unusually sophisticated for its hosting tier: it includes a Git-based CMS,
atomic publish pipeline, 103-theme engine, AI artwork generation, and a 91-assertion test suite —
all without a single server-side process.

**Strengths:** Zero hosting cost, instant CDN delivery, no security attack surface (no server),
admin-level capabilities without a backend, battle-tested through 4 major versions.

**Gaps:** No real-time inventory, no automated checkout, no analytics, limited SEO indexability
for individual products. All are solvable at the current hosting tier.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     INGLY ENTERPRISE v4.2                    │
├─────────────────────────────────────────────────────────────┤
│  HOSTING LAYER                                               │
│  GitHub Pages (origin) → Cloudflare CDN (edge)              │
│  Domain: www.inglydesign.it                                  │
├─────────────────────────────────────────────────────────────┤
│  FRONTEND LAYER                                              │
│  index.html — SPA shell (480 lines)                         │
│  Hash router: #/home #/shop #/product #/digital              │
│               #/business #/portfolio #/about #/faq #/quote  │
│                                                              │
│  JS Modules (ES modules + UMD fallback):                     │
│  app.js → data-loader.js → main.js                          │
│    ├── navigation.js   (hash router, page transitions)       │
│    ├── products.js     (catalog, filters, cart, lightbox)   │
│    ├── forms.js        (Formspree, pill selector)            │
│    ├── animations.js   (IntersectionObserver, magnets)       │
│    ├── seo.js          (JSON-LD per page)                    │
│    ├── lazyload.js     (lazy image loading)                  │
│    └── artwork.js      (SVG background generator)            │
│                                                              │
│  CSS Modules (7 files):                                      │
│  variables → reset → layout → components → pages            │
│  → animations → responsive                                   │
├─────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                  │
│  data/*.json (source of truth, 6 files, ~5,000 lines)       │
│  data/*.js   (auto-generated wrappers, never hand-edited)    │
│  window.INGLY (runtime namespace, ~20 properties)            │
├─────────────────────────────────────────────────────────────┤
│  ADMIN LAYER                                                 │
│  admin.html — Git-based CMS (single file, no build)         │
│  GitHub Data API → atomic single-commit publish              │
│  Modules: Products, Categories, Digital, Media Library,      │
│           Portfolio, Home/Hero, Texts, FAQ/Reviews,          │
│           Contacts, SEO, Publish/Deploy, History/Rollback,   │
│           Health Center, Backup, Settings                    │
├─────────────────────────────────────────────────────────────┤
│  CI/CD LAYER                                                 │
│  .github/workflows/validate.yml → validate-data.mjs         │
│  .github/workflows/qa.yml       → test-sito + test-css      │
│  tests/ → 91+ assertions (headless DOM)                      │
├─────────────────────────────────────────────────────────────┤
│  EXTERNAL INTEGRATIONS                                       │
│  Formspree    → form submissions (preventivo + newsletter)   │
│  WhatsApp     → cart checkout (wa.me deep link)             │
│  Cloudflare   → CDN, DDoS, SSL, analytics                   │
│  GitHub Pages → static hosting, deploy on push              │
└─────────────────────────────────────────────────────────────┘
```

## File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| index.html | 480 | SPA shell, all pages |
| admin.html | ~4000 | Git-based CMS |
| assets/js/main.js | 342 | App bootstrap, renders, event delegation |
| assets/js/products.js | 429 | Catalog, shop, product page, cart |
| assets/js/artwork.js | 159 | 15-style SVG background generator |
| assets/js/animations.js | 140 | IntersectionObserver, reveal, magnets |
| assets/js/seo.js | 112 | JSON-LD per-page injection |
| assets/js/data-loader.js | 108 | JSON fetch, healData(), window.INGLY |
| assets/js/forms.js | 46 | Formspree integration |
| assets/js/navigation.js | 46 | Hash router, page transitions |
| assets/js/utils.js | 51 | $(), T(), eur(), imgTag() helpers |
| assets/js/lazyload.js | 12 | Native lazy + IO fallback |
| assets/js/app.js | 9 | ES module entry point |
| assets/js/app.fallback.js | 45 | UMD bundle for non-ESM browsers |
| assets/css/components.css | 719 | All reusable components |
| data/content.json | 3443 | Portfolio, reviews, themes, promo... |
| data/products.json | 698 | Product catalog |
| data/categories.json | 394 | 12 categories with subcategories |
| data/texts.json | 289 | i18n strings (IT/EN) |
| data/config.json | 53 | Site configuration |
| data/social.json | 31 | Social links + SVG icons |

## Known Technical Debt

### High priority
1. No LCP image preload → LCP ~2.1s (target: <1.5s)
2. Cart/wishlist lost on page close → user frustration
3. No spam protection on forms → potential abuse

### Medium priority
4. All JSON fetched on every page load → unnecessary for cached visits
5. `app.fallback.js` likely diverged from `main.js` (no sync enforcement)
6. No Content Security Policy headers implemented
7. Individual products not SEO-indexable (hash routing limitation)

### Low priority
8. No service worker / offline support
9. No font subsetting (full character sets loaded)
10. No AVIF image format (WEBP only)

## AI Operating System Status

Installed at `.claude/`:
- ✅ CLAUDE.md (master context)
- ✅ agents/ (9 specialist agents)
- ✅ rules/ (non-negotiable + coding standards)
- ✅ skills/ (add-product, code-review)
- ✅ prompts/ (product-description, seo-meta, social-post)
- ✅ knowledge/ (brand, architecture-gaps)
- ✅ playbooks/ (seasonal-theme, deploy-checklist)
- ✅ workflows/ (ai-product-copy, performance-optimization)
- ✅ standards/ (ui-ux, data-integrity, git)
- ✅ checklists/ (pre-publish, new-feature)
- ✅ architectures/ (ecommerce-evolution)
- ✅ mcp/ (available-servers)
- ✅ docs/ (this report)
