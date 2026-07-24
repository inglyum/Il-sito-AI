---
name: code-review
description: INGLY-specific code review — checks the 14 rules, CSS safety, data integrity, performance, security
---

# Skill: Code Review

## When to use
Before any commit that touches: CSS files, JS modules, data/*.json, index.html, admin.html, or any file that affects the 14 non-negotiable rules.

## Review Checklist

### 🚨 BLOCKING — Must fix before merge

#### Rule 1 violations (invisible images)
- [ ] No `animation: none` on `img.pimgph`, `img.gimg`, `img.bimg`
- [ ] Safety net `img.pimgph { opacity: 1 !important; }` still present in `components.css`

#### Rule 7 violations (material crash)
- [ ] No direct `MAT_ART[product.mat]` access — must use `matArt(x.mat)`
- [ ] All new code using material properties uses the wrapper

#### Rule 11 violations (SVG background disappears)
- [ ] No `el.style.backgroundImage = INGLY_ART.css(...)`
- [ ] SVG backgrounds use CSS variable: `el.style.setProperty('--card-bg', ...)`

#### Rule 14 violations (data-URI truncation)
- [ ] No `url("data:...")` with double quotes inside `style="..."` attributes
- [ ] Any data-URI generation uses single quotes and encodes `'` as `%27`

#### Data integrity
- [ ] No product with `sub: 0` if category has subcategories
- [ ] No product `mat` value not in MAT_ART
- [ ] No new srcset variants not registered in MV map
- [ ] No duplicate product IDs

#### Security
- [ ] No API keys, tokens, or credentials in any file
- [ ] No `innerHTML` with user-submitted content (XSS risk)

---

### ⚠️ IMPORTANT — Fix before merge

#### Animation and visibility
- [ ] New `.reveal` sections are reachable by `observeAll()` selector
- [ ] New animated elements have `prefers-reduced-motion` consideration

#### i18n
- [ ] New user-facing strings added to `data/texts.json` for both IT and EN
- [ ] No hardcoded Italian or English text in JS files
- [ ] No hardcoded Italian or English text in data-i18n attributes without texts.json entry

#### Dark/light mode
- [ ] No hardcoded colors (hex/rgb) in new CSS — only CSS variables
- [ ] New elements visible in both dark (default) and light mode

#### Performance
- [ ] No new render-blocking resources added to `<head>`
- [ ] New images use `loading="lazy"` (except hero/above-fold)
- [ ] No new dependencies added without justification in commit message

#### Git workflow
- [ ] No workflow file that makes auto-commits
- [ ] Commit message follows convention: `feat|fix|perf|docs|refactor|test|chore: description`

---

### 💡 SUGGESTIONS — Nice to fix

#### Code quality
- [ ] New functions have names that describe their action (verb + noun)
- [ ] No `console.log` left in production code (use `console.warn` with `[INGLY]` prefix)
- [ ] New event listeners use the central delegation pattern (not per-element addEventListener)
- [ ] No magic numbers — use named constants or CSS variables

#### Documentation
- [ ] Significant changes documented in `docs/kb/stato-attuale.md`
- [ ] Breaking changes noted in `docs/CHANGELOG.md`

---

## Review Report Format
```
## Code Review — [description of change]

### 🚨 BLOCKING (must fix)
- [list issues]

### ⚠️ IMPORTANT (should fix)
- [list issues]

### 💡 SUGGESTIONS
- [list items]

### ✅ VERIFIED
- Rule 1 (animation): clean
- Rule 7 (matArt): all material access guarded
- Rule 11 (SVG bg): no inline background-image with data-URI
- Rule 14 (single quotes): confirmed
- Data integrity: validate-data.mjs passes
- Dark mode: tested
- i18n: both languages present
```
