# Workflow: AI Product Copy Generation

## Trigger
User says: "genera descrizione", "scrivi copy prodotto", "AI description", or opens product editor in admin.

## Inputs
```
product.n.it        → product name in Italian
product.mat         → material (Legno, Metallo, etc.)
product.cat         → category ID
product.sub         → subcategory index
product.price       → price in EUR
product.tag         → tag (New/Sale/Limited/B2B)
```

## Steps

### 1. Gather context
```javascript
const cat = CATS.find(c => c.id === product.cat);
const subcat = cat?.sub[product.sub]?.it || '';
const matDesc = MATERIAL_DESCRIPTIONS[product.mat] || '';
// MATERIAL_DESCRIPTIONS loaded from laser-expert.md knowledge
```

### 2. Build prompt
Use template from `.claude/prompts/product-description.md`

### 3. Call Claude API (when integrated in admin)
```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': adminConfig.claudeApiKey,  // stored in admin sessionStorage
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',  // fast + cheap for copy generation
    max_tokens: 400,
    messages: [{ role: 'user', content: buildPrompt(product) }],
    system: SYSTEM_PROMPT_PRODUCT_DESCRIPTION
  })
});
const { content } = await response.json();
const desc = JSON.parse(content[0].text);  // { it: string, en: string }
```

### 4. Validate output
```javascript
function validateDesc(desc) {
  if (!desc?.it || !desc?.en) throw new Error('Missing language');
  if (desc.it.split(' ').length < 40) throw new Error('IT description too short');
  if (desc.en.split(' ').length < 40) throw new Error('EN description too short');
  const forbidden = ['straordinario','meraviglioso','fantastico','incredibile'];
  if (forbidden.some(w => desc.it.toLowerCase().includes(w))) throw new Error('Forbidden word in IT');
  return desc;
}
```

### 5. Present to user
Show both IT and EN descriptions in editable text areas.
User can edit, regenerate, or accept.
On accept: set `product.desc = { it: ..., en: ... }`.

### 6. Save
Standard product save flow (Admin → Pubblica).

## Fallback (API unavailable)
Show manual description form with:
- Character counter (target: 80-120 words)
- Style guide tip: "Includi: tecnologia (CO₂/MOPA/UV), materiale specifico, occasione d'uso"
- Example descriptions from existing products

## Cost estimate
- Claude Haiku: ~$0.0003 per product description
- 100 products/month = $0.03/month
- Negligible cost, high value
