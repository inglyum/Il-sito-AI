# UI/UX Standards — INGLY ENTERPRISE

## Design Philosophy
Build for the 45-year-old who wants to order a personalized gift on mobile,
not for the developer who knows what a hash route is.
Every interaction must feel instant, every error must be human.

## Layout System

### Breakpoints (use ONLY these)
```css
/* Desktop first (base styles) */
/* ≤1160px */ @media (max-width:1160px) { /* tablet landscape */  }
/* ≤980px  */ @media (max-width:980px)  { /* tablet portrait */   }
/* ≤820px  */ @media (max-width:820px)  { /* mobile nav kicks in */ }
/* ≤640px  */ @media (max-width:640px)  { /* mobile S */           }
/* ≤480px  */ @media (max-width:480px)  { /* mobile XS */          }
/* ≤340px  */ @media (max-width:340px)  { /* tiny phones */        }
```

### Spacing scale
```css
4px / 8px / 12px / 16px / 24px / 32px / 48px / 64px / 96px / 128px
/* Always use multiples of 4. Never odd values. */
```

### Container
```css
.wrap { max-width: 1240px; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 40px); }
```

## Component Standards

### Buttons
```css
/* Primary (filled accent) */
.btn-primary { background: var(--accent); color: #0a0d18; }

/* Secondary (outlined) */
.btn { border: 1px solid var(--line); background: transparent; color: var(--ink); }

/* Blue (WhatsApp/cart) */
.btn-blue { background: #1d3557; color: #e8f4f8; }

/* Sizing */
.btn { padding: 14px 28px; font-size: var(--fs-sm); border-radius: 10px; }
.btn-sm { padding: 10px 20px; font-size: var(--fs-xs); }

/* State */
.btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
.btn:active { transform: translateY(0); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
```

### Cards
```css
/* Product card: .pcard */
/* Category card: .bcard */
/* Review card: .rcard */
/* B2B card: .rcard (reuses) */
/* Tech card: .mcard */

/* All cards share: */
border-radius: 20px;
background: var(--bg-card);
transition: transform var(--dur) ease, box-shadow var(--dur) ease;

/* Hover lift: */
.card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,.3); }
```

### Navigation
- **Desktop:** horizontal links in topbar (hidden ≤820px)
- **Mobile:** burger → full-screen overlay menu
- **Active state:** `.nav-links a.active` — underline + accent color
- **Sticky:** `position: fixed; top: 0; z-index: 100` with backdrop blur

### Toast notifications
```javascript
// Duration: 3000ms auto-dismiss
// Position: bottom-right (desktop), bottom-center (mobile)
// Never block the user's primary task
// Max 1 toast at a time (queue if rapid actions)
toast(T('added'));    // ✓ short, contextual
toast('Errore durante il salvataggio dei dati. Riprova.'); // ✗ too long
toast(T('saved'));   // ✓
```

## UX Principles

### 1. Zero-friction discovery
- Category bento on home → shop filtered to that category (one click)
- Hero featured products → direct product page (one click)
- Search autocomplete → product/category/material (keyboard navigable)

### 2. WhatsApp as primary conversion
The user is already on WhatsApp. Don't make them learn Stripe.
- Cart → "Ordina via WhatsApp" → pre-filled message
- FAB (floating WhatsApp button) always visible
- Response time displayed: "Rispondiamo di solito in meno di un'ora"

### 3. Trust signals
- Star ratings on every product card
- Review count visible without opening product
- Verified purchase badge on reviews
- "3 giorni lavorativi" production time always visible
- Real photos in portfolio (not stock)
- Real Instagram feed link

### 4. Mobile-first interactions
- Minimum tap target: 44×44px (WCAG 2.1 AA)
- Thumb zones: primary actions in bottom 2/3 of screen
- No hover-only interactions (all discoverable by tap)
- Full-screen modals on mobile (not small dialogs)

### 5. Loading states
- Skeleton screens for product grid (never empty flash)
- Button disabled + "…" text while submitting forms
- Spinner only for operations > 2s (progress bar preferred for > 5s)
- Never: blank white flash between pages (fade transition prevents this)

## Accessibility Standards (WCAG 2.1 AA)

### Color contrast
```
Normal text (< 18px): ≥ 4.5:1
Large text (≥ 18px or 14px bold): ≥ 3:1
UI components (borders, icons): ≥ 3:1

Dark mode checks:
--ink on --bg-deep: #eae8f5 on #0a0d18 = ~14:1 ✓
--ink-soft on --bg-deep: #9896b0 on #0a0d18 = ~6:1 ✓
--accent on --bg-deep: #c4a35a on #0a0d18 = ~6:1 ✓
```

### Focus management
```css
/* Always visible, never removed */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 4px;
}

/* NEVER: */
:focus { outline: none; }  /* ← removes focus from keyboard users */
```

### ARIA requirements
- Modals: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Loading: `aria-busy="true"` on container
- Expanded: `aria-expanded="true/false"` on toggles (burger, filters)
- Live regions: `aria-live="polite"` for toast area
- Images: `alt=""` for decorative, descriptive for informational
- Rating: `aria-label="5 su 5"` on star ratings

## Dark/Light Mode UX
- Default: dark (matches brand aesthetic)
- Toggle: moon/sun icon in topbar (always accessible)
- Persistence: localStorage.ingly_mode
- System sync: follows prefers-color-scheme if user has never toggled
- Transition: smooth 450ms with `.theme-anim` class (prevents flash)
- Never: flash on initial page load (script in `<head>` applies mode before paint)
