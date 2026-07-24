---
name: add-product
description: Add a new product to the INGLY catalog — validates schema, generates JSON, suggests SEO copy
---

# Skill: Add Product

## When to use
When the user says: "aggiungi prodotto", "add product", "nuovo prodotto", or describes a new item to add to the catalog.

## Input gathering
Ask for (or infer from context):
1. Product name (IT required, EN optional — can be auto-translated)
2. Category (must be one of the 12 in categories.json)
3. Material (must be in MAT_ART: Legno, Bamboo, MDF, Metallo, Alluminio, Plexiglass, Acrilico, Vetro, Pelle, PLA, Carta, Tessuto)
4. Price (EUR, e.g. 29.90)
5. Production time in days (default: 3)
6. Emoji icon (e.g. 🪵)
7. Tags: "New" | "Sale" | "Limited" | "B2B" | "" (optional)
8. Collection: "best" | "new" | "gift" (optional, array)

## Process

### Step 1: Generate new ID
```javascript
// Read current products.json, find max ID
const maxId = Math.max(...products.map(p => p.id));
const newId = maxId + 1;
```

### Step 2: Find subcategory
```javascript
// Read categories.json, find the category, list subcategories
// Ask user which subcategory (1-indexed, or 0 for none)
// RULE: sub must be ≥ 1 if subcategories exist
```

### Step 3: Build product object
```json
{
  "id": <newId>,
  "n": { "it": "<nome IT>", "en": "<name EN>" },
  "cat": "<category_id>",
  "sub": <subcategory_index>,
  "mat": "<Material>",
  "price": <price>,
  "icon": "<emoji>",
  "img": "img/<newId>.webp",
  "gallery": [],
  "desc": { "it": "<generated description IT>", "en": "<generated description EN>" },
  "tag": "<tag or empty string>",
  "coll": ["<collection>"],
  "hero": false,
  "rev": 0,
  "sku": "",
  "video": "",
  "poster": "",
  "misure": [],
  "rel": [],
  "hidden": false,
  "prod": 3
}
```

### Step 4: Generate description (using prompt-engineer)
Use the product description generator prompt:
- Input: name, material, category, price
- Output: `{ it: string, en: string }` — 80-120 words each

### Step 5: Validate
Run through rules:
- [ ] `sub` ≥ 1 if category has subcategories
- [ ] `mat` exists in MAT_ART keys
- [ ] `cat` exists in categories.json
- [ ] `id` is unique (check against all existing IDs)
- [ ] `price` is a number > 0

### Step 6: Add to products.json
Read `data/products.json`, append new product, write back.

### Step 7: Update docs/kb/stato-attuale.md
Note the new product in the appropriate section.

## Output
Show the user:
1. The generated JSON for review
2. The generated description in both languages
3. Reminder: "Upload image `img/<id>.webp` via Admin → Media Library"
4. Reminder: "Run `node scripts/validate-data.mjs` to verify"

## Image naming convention
```
img/<id>.webp          ← main photo (upload via Admin)
img/<id>-g1.webp       ← gallery photo 1
img/<id>-g2.webp       ← gallery photo 2
```

## Quick example
```json
{
  "id": 51,
  "n": { "it": "Targa Nome Porta in Noce", "en": "Personalized Walnut Door Sign" },
  "cat": "arredamento",
  "sub": 1,
  "mat": "Legno",
  "price": 34.90,
  "icon": "🚪",
  "img": "img/51.webp",
  "gallery": [],
  "desc": {
    "it": "Targa porta incisa al laser CO₂ su noce massello...",
    "en": "CO₂ laser-engraved door sign on solid walnut..."
  },
  "tag": "New",
  "coll": ["best"],
  "hero": false,
  "rev": 0,
  "sku": "ING-051",
  "prod": 3,
  "hidden": false
}
```
