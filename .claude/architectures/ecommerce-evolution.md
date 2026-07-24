# Architecture: Ecommerce Evolution Roadmap

## Current State (v4.2) — Static SPA
```
GitHub Pages → Cloudflare CDN → Browser
     ↓
  index.html (SPA shell)
  data/*.json (catalog)
  admin.html (Git CMS)
     ↓
WhatsApp checkout
Formspree forms
```
**Cost:** ~€0/month
**Capability:** Basic ecommerce, manual order processing

## Stage 2 — Enhanced Static (3-6 months)
```
Add to current stack:
+ Stripe Payment Links (digital products checkout)
+ Cloudflare Web Analytics (privacy-first, free)
+ localStorage cart/wishlist persistence
+ Claude API in admin (product copy, SEO meta)
+ Brevo (ex-Sendinblue) email integration (free tier: 300 emails/day)
```
**Cost:** ~€10/month (Stripe fees + optional Brevo)
**Capability:** Digital product sales automated, email marketing, AI-assisted content

Implementation priority:
1. `CONFIG.stripeLinks` map: `{ productId: "https://buy.stripe.com/..." }`
2. In `renderDigital()`: button becomes Stripe link instead of WhatsApp
3. In admin → Digitali: field for Stripe Payment Link URL

## Stage 3 — Edge Functions (6-12 months)
If server-side logic becomes necessary:
```
Cloudflare Workers (edge functions, free tier: 100k req/day)
  ├── /api/order    → save order to D1 (Cloudflare SQLite)
  ├── /api/stock    → check/update inventory
  └── /api/webhook  → Stripe webhook handler
```
**Cost:** ~€5/month (Cloudflare Workers paid if > 100k req)
**Capability:** Real inventory, order history, Stripe webhooks

This stays static-hostable for the site; only the API endpoints move to Workers.

## Stage 4 — Full Headless (12-24 months)
If scale demands it (>500 products, >100 orders/day):
```
Payload CMS (self-hosted or Payload Cloud)
  → Products, orders, customers, inventory
  → REST/GraphQL API
  → Current index.html fetches from Payload instead of JSON files
  → Admin panel replaced by Payload admin
```
**Cost:** ~€50/month (Payload Cloud or VPS)
**Capability:** Full CMS, inventory, order management, CRM

**Migration path:** JSON files → Payload → site reads same data shape.
The frontend (index.html) barely changes; only `data-loader.js` changes its source.

## What NOT to do
- **Don't:** Migrate to WordPress/WooCommerce (complexity, cost, security)
- **Don't:** Add React/Vue/Svelte before Stage 3 (no server = no SSR = worse SEO)
- **Don't:** Build custom auth system (use Cloudflare Access or Payload's auth)
- **Don't:** Store payment details anywhere (Stripe handles all of it)

## Decision Triggers

| Trigger | Action |
|---------|--------|
| >10 digital product orders/month | → Stage 2: Stripe Payment Links |
| Cart abandon rate >60% | → Stage 2: localStorage cart persistence |
| >200 products in catalog | → Stage 3: real search (Algolia free tier) |
| Manual order processing taking >2h/day | → Stage 3: Cloudflare Workers orders API |
| >1000 customers | → Stage 4: Payload CMS |
