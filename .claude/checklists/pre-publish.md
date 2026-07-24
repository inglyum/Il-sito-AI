# Checklist: Pre-Publish

Run this before every production deploy.

## Data Integrity
- [ ] `node scripts/validate-data.mjs` — passes with 0 errors
- [ ] No product has `sub: 0`
- [ ] No product has material not in MAT_ART
- [ ] No duplicate product IDs
- [ ] All `rel` product references point to existing products

## Test Suite
- [ ] `node tests/test-sito.mjs` — all assertions pass
- [ ] `node tests/test-admin.mjs` — all 91+ assertions pass
- [ ] `node tests/test-css.mjs` — no CSS regressions

## CSS Safety (Rule 1 — most common production bug)
- [ ] `img.pimgph { opacity: 1 !important; }` present in components.css
- [ ] No `animation: none` on `.pimgph`, `.gimg`, `.bimg` in ANY CSS file
- [ ] `grep -r "animation.*none" assets/css/` returns nothing relevant

## Security
- [ ] No API keys or tokens in any staged file
- [ ] `git diff` reviewed — nothing sensitive in diff

## Git
- [ ] `git status` — only intended files modified
- [ ] Commit message follows convention (`feat|fix|perf|...`)
- [ ] Branch is up to date with origin

## After Deploy
- [ ] Admin → Health Center → all green
- [ ] Check `https://www.inglydesign.it` live
- [ ] New products/categories visible on site
- [ ] Dark/light mode toggle works
- [ ] Mobile navigation works (test ≤820px)
- [ ] WhatsApp FAB visible and links to correct number
