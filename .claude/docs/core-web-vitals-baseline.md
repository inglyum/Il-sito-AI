# Core Web Vitals — Baseline Report
# INGLY DESIGN · www.inglydesign.it
# Sprint 4 | 2026-07-24

## Targets (Google "Good" thresholds)

| Metric | Target | Budget |
|--------|--------|--------|
| LCP    | < 2.5s | < 2.0s (our goal) |
| FID    | < 100ms | n/a (static, no server) |
| CLS    | < 0.10 | < 0.05 (our goal) |
| FCP    | < 1.8s | < 2.0s |
| TBT    | < 200ms | < 300ms |
| Speed Index | — | < 3.0s |

## Pre-Sprint 2 Estimated Baseline (no measurement yet)

| Metric | Estimated | Source |
|--------|-----------|--------|
| LCP    | ~2.1s     | Architecture report gap analysis |
| FCP    | ~1.4s     | Architecture report |
| TBT    | < 50ms    | Vanilla JS, no framework |
| CLS    | ~0.02     | Static layout, no dynamic shifts |

## Sprint 2 Improvements Applied (2026-07-24)

- ✅ `<link rel="preload" as="image" href="assets/images/og-image.jpg" fetchpriority="high">` → LCP target
- ✅ `<link rel="modulepreload">` for app.js, data-loader.js, main.js, products.js → FCP / TTI
- ✅ Cart & wishlist loaded from localStorage → no re-fetch on return visits

## Sprint 4 Additions (2026-07-24)

- ✅ Cloudflare Web Analytics (beacon.min.js, deferred) → no CLS/TBT impact
- ✅ Lighthouse CI budget gate in qa.yml → catches regressions automatically

## How to measure

```bash
# Option A — CLI (most accurate, run from your machine)
npx lighthouse https://www.inglydesign.it --view --preset=desktop
npx lighthouse https://www.inglydesign.it --view --preset=perf

# Option B — Chrome DevTools
# DevTools → Lighthouse → Mobile → Analyze page load
# Save the JSON report: ··· → Save as JSON

# Option C — PageSpeed Insights
# https://pagespeed.web.dev/analysis?url=https://www.inglydesign.it
```

## Next measurement

Run after each Sprint and paste results here.

### Template

```
Date: YYYY-MM-DD | Device: Mobile / Desktop | Tool: CLI / PSI / DevTools
LCP: Xs  FCP: Xs  TBT: Xms  CLS: X  SI: Xs
Performance: X/100  Accessibility: X/100  Best Practices: X/100  SEO: X/100
Notes: …
```

## Regression prevention

Lighthouse CI runs automatically on every push via `.github/workflows/qa.yml`.
Budget file: `.lighthousebudget.json`
Artifacts uploaded to temporary public storage — link appears in the CI run summary.
