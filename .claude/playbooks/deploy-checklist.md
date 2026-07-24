# Playbook: Deploy Checklist

## Pre-deploy (run every time)
```bash
node scripts/validate-data.mjs    # data integrity
node tests/test-sito.mjs          # site rendering
node tests/test-admin.mjs         # admin panel
node tests/test-css.mjs           # CSS regressions
```

## Git procedure
```bash
git status                        # verify only intended files changed
git add <specific files>          # NEVER: git add -A or git add .
git commit -m "feat: description"
git push -u origin main
```

## Post-deploy verification (Admin panel)
1. Admin → Pubblica → verify deploy SHA matches GitHub Pages SHA
2. Admin → Health Center → all checks green
3. Check site live: https://www.inglydesign.it

## Rollback
If something breaks: Admin → Cronologia → select last good commit → Ripristina

## Critical checks before ANY CSS change
- [ ] `img.pimgph { opacity: 1 !important; }` still in components.css
- [ ] No `animation: none` on `.pimgph`, `.gimg`, `.bimg`
- [ ] All new colors use CSS variables, not hardcoded hex
- [ ] Both dark and light modes tested

## Critical checks before ANY data change
- [ ] Run `node scripts/validate-data.mjs`
- [ ] No product sub=0
- [ ] No undefined materials
- [ ] No duplicate IDs or SKUs
