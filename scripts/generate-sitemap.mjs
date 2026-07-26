#!/usr/bin/env node
/* Generates sitemap.xml from data/products.json + data/categories.json
   Run: node scripts/generate-sitemap.mjs
   Output: sitemap.xml (overwrites) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, '..');

const products   = JSON.parse(readFileSync(join(root,'data/products.json'),'utf8'));
const categories = JSON.parse(readFileSync(join(root,'data/categories.json'),'utf8'));

const BASE  = 'https://www.inglydesign.it';
const today = new Date().toISOString().slice(0,10);

const u = (loc, freq, pri, mod=today) =>
  ` <url><loc>${loc}</loc><lastmod>${mod}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`;

const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  u(BASE+'/',         'weekly',  '1.0'),
  u(BASE+'/#/shop',   'weekly',  '0.9'),
  u(BASE+'/#/digital','weekly',  '0.8'),
  u(BASE+'/#/business','weekly', '0.8'),
  u(BASE+'/#/portfolio','monthly','0.7'),
  u(BASE+'/#/about',  'monthly', '0.6'),
  u(BASE+'/#/faq',    'monthly', '0.7'),
  u(BASE+'/#/quote',  'monthly', '0.6'),
];

/* category filter pages */
for(const cat of categories){
  lines.push(u(`${BASE}/#/shop?cat=${cat.id}`, 'weekly', '0.7'));
}

/* product detail pages (skip hidden) */
for(const p of products){
  if(p.hidden) continue;
  lines.push(u(`${BASE}/#/product?id=${p.id}`, 'monthly', '0.6'));
}

lines.push('</urlset>','');

const xml = lines.join('\n');
writeFileSync(join(root,'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml — ${lines.length-3} URLs (${products.filter(p=>!p.hidden).length} products, ${categories.length} categories)`);
