# Workflow: Performance Optimization

## Trigger
LCP > 2.5s, Lighthouse score < 85, or user reports slow loading.

## Step 1 — Measure first
```bash
# Never optimize without data
# Run Lighthouse in Chrome DevTools → Lighthouse → Mobile
# Or: npx lighthouse https://www.inglydesign.it --view

# Key metrics to capture before any change:
# LCP, FCP, CLS, TBT, Speed Index
# Screenshot the scores for before/after comparison
```

## Step 2 — Identify the LCP element
Chrome DevTools → Performance tab → record page load → find LCP marker.
Most likely candidates:
- Hero canvas animation (`.coin-scene`)
- Hero featured product images (`#heroCard1 img`)
- Category bento images (`.bimg`)

## Step 3 — Apply fixes in order of impact

### Fix A: Preload LCP image (highest impact, 5 min)
```html
<!-- Add to <head> BEFORE any CSS links: -->
<link rel="preload" as="image" href="assets/images/og-image.jpg" fetchpriority="high">
<!-- Or if hero product image is LCP: -->
<link rel="preload" as="image" href="img/1.webp" fetchpriority="high">
```

### Fix B: Module preloading (medium impact, 10 min)
```html
<!-- Add to <head>: -->
<link rel="modulepreload" href="assets/js/app.js">
<link rel="modulepreload" href="assets/js/data-loader.js">
<link rel="modulepreload" href="assets/js/main.js">
<link rel="modulepreload" href="assets/js/products.js">
```

### Fix C: localStorage cart/wishlist (UX impact, 30 min)
```javascript
// In products.js — persist cart between sessions
function saveCart() {
  try { localStorage.setItem('ingly_cart', JSON.stringify(cart)); } catch(e) {}
}
function loadCart() {
  try { const c = localStorage.getItem('ingly_cart'); if(c) cart = JSON.parse(c); } catch(e) {}
}
// Call loadCart() in initShopControls(), saveCart() after every cart mutation
```

### Fix D: Reduce CSS blocking (advanced, 1 hour)
Extract critical CSS (variables + reset + topbar skeleton) → inline in `<head>`.
Load remaining CSS asynchronously with `media="print" onload="this.media='all'"`.

## Step 4 — Measure again
Run the same Lighthouse test. Compare scores.
Document: what changed, before score, after score.

## Step 5 — Commit
```bash
git add index.html assets/js/products.js
git commit -m "perf: preload LCP image and modulepreload critical JS"
```

## Performance Budget Enforcement (future)
Add to `.github/workflows/qa.yml`:
```yaml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: 'https://www.inglydesign.it'
    budgetPath: '.lighthousebudget.json'
    uploadArtifacts: true
```

`.lighthousebudget.json`:
```json
[{
  "path": "/",
  "timings": [
    { "metric": "interactive", "budget": 3000 },
    { "metric": "first-contentful-paint", "budget": 1500 }
  ],
  "scores": [
    { "category": "performance", "minScore": 85 },
    { "category": "accessibility", "minScore": 90 }
  ]
}]
```
