# Checklist: New Feature Development

Use this for any non-trivial change to JS, CSS, or data structures.

## Before Writing Code
- [ ] Read `.claude/rules/non-negotiable.md` — understand the 14 rules
- [ ] Read `docs/kb/stato-attuale.md` — understand current project state
- [ ] Check: does this affect any of the 14 rules? If yes, proceed with extreme care
- [ ] Check: is this static-hosting compatible? (no server-side code in production)

## Design Phase
- [ ] Feature fits within existing module structure
- [ ] New data? Define schema first, add to standards/data-integrity.md
- [ ] New i18n strings? Add to `data/texts.json` (both IT and EN)
- [ ] New CSS? Uses only CSS variables from variables.css, no hardcoded colors

## Implementation
- [ ] New event handlers use central delegation (`data-action` + actions map)
- [ ] New images use `imgTag()`, `imgV()`, `srcsetFor()` helpers
- [ ] New material access uses `matArt()` wrapper, never `MAT_ART[mat]` directly
- [ ] New SVG backgrounds use CSS variable (`--card-bg`), not inline style
- [ ] New `.reveal` elements: verify `observeAll()` selector catches them
- [ ] Dark mode: new elements visible in both dark and light modes

## Testing
- [ ] Write regression test BEFORE fixing any visible-image-related bug
- [ ] Run `node tests/test-css.mjs` after any CSS change
- [ ] Run `node scripts/validate-data.mjs` after any data change
- [ ] Test on mobile viewport (≤820px) — nav, layout, touch targets

## Documentation
- [ ] Update `docs/kb/stato-attuale.md` with what changed
- [ ] Add entry to `docs/CHANGELOG.md`
- [ ] Update `data/version.json` version number

## Code Review
- [ ] Run `/code-review` or apply `skills/code-review.md` checklist
- [ ] All BLOCKING items resolved
- [ ] All IMPORTANT items resolved or explicitly accepted with reason
