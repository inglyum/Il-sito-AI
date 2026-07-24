# Git Standards — INGLY ENTERPRISE

## Commit Message Convention
```
<type>(<scope>): <imperative short description>

Types:
  feat     — new feature or capability
  fix      — bug fix
  perf     — performance improvement (no behavior change)
  docs     — documentation only
  refactor — code restructure (no behavior change)
  test     — adding or fixing tests
  chore    — tooling, CI, dependencies, sitemap dates
  style    — CSS/formatting (no logic change)

Scope (optional, used when change is localized):
  admin / products / css / seo / forms / animations / data / ci

Examples:
  feat(admin): add AI product description generator
  fix(css): prevent img.pimgph animation override in dark mode
  perf: preload hero image for faster LCP
  docs: update stato-attuale.md with v4.2 architecture
  refactor(products): extract matArt guard to utils.js
  test: add regression test for imgfade animation rule
  chore: update sitemap dates to 2026-07-24
  fix(data): repair product sub=0 for product ID 23
```

## Branch Strategy
```
main                          ← production (protected, deploy on push)
claude/<feature-name>-<hash>  ← AI-generated feature branches
feat/<feature-name>           ← human-initiated features
fix/<bug-description>         ← bug fixes
perf/<optimization>           ← performance work
docs/<topic>                  ← documentation only
```

## Staging files (never use -A or .)
```bash
# CORRECT: stage specific files
git add index.html
git add assets/css/responsive.css assets/js/products.js
git add data/products.json data/content.json

# WRONG:
git add -A        ← could include secrets, temp files, OS files
git add .         ← same risk

# Before staging, always check:
git status        ← verify only intended files are modified
git diff          ← verify content of changes is correct
```

## Protected Rules
```bash
# NEVER:
git push --force origin main        ← destroys production history
git commit --amend (on main)        ← rewrites public history
git rebase origin/main (on main)    ← rewrites public history

# ALWAYS check before commit:
1. No .env files staged
2. No token/credentials in diff
3. No node_modules in diff
4. Commit message follows convention
```

## Admin Commit Flow (DO NOT REPLICATE IN CI)
The admin panel creates commits via GitHub Data API.
This is the ONLY allowed automated commit source.
Any GitHub Actions workflow that makes commits must be removed.

Reason: Race condition between admin commit and workflow commit causes merge conflicts,
which can leave the site in a broken state.

## .gitignore Contents
```
node_modules/
.DS_Store
*.log
*.tmp
.env
.env.local
dist/
build/
coverage/
.claude/settings.local.json   ← personal token, never commit
```

## Tag Strategy (releases)
```bash
# On significant milestones:
git tag v4.2.0 -m "v4.2.0 — multi-file SPA with full admin"
git push origin v4.2.0

# Format: vMAJOR.MINOR.PATCH
# MAJOR: architectural change (new routing, new CMS engine)
# MINOR: new feature section or admin capability
# PATCH: bug fix or content update
```
