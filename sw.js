/* ============ SERVICE WORKER — INGLY DESIGN ============
   Strategia:
   - CSS / JS / icone / font → Cache-first (versioned, durata 7gg)
   - JSON data → Network-first con fallback cache (dati freschi ogni volta)
   - Immagini → Cache-first (durata 30gg)
   - HTML / navigazione → Network-first con fallback offline page
   Offline page: mostrata solo se non si può caricare nessuna risorsa HTML. */

const CACHE_VER   = 'ingly-v2';
const CACHE_ASSETS= CACHE_VER + '-assets';
const CACHE_DATA  = CACHE_VER + '-data';
const CACHE_IMG   = CACHE_VER + '-img';

/* risorse precachate all'install */
const PRECACHE = [
  '/',
  '/index.html',
  '/assets/css/reset.css',
  '/assets/css/variables.css',
  '/assets/css/layout.css',
  '/assets/css/components.css',
  '/assets/css/pages.css',
  '/assets/css/animations.css',
  '/assets/css/responsive.css',
  '/assets/js/app.js',
  '/assets/js/data-loader.js',
  '/assets/js/main.js',
  '/assets/js/utils.js',
  '/assets/js/products.js',
  '/assets/js/navigation.js',
  '/assets/js/animations.js',
  '/assets/js/forms.js',
  '/assets/js/seo.js',
  '/assets/js/lazyload.js',
  '/assets/js/wishlist.js',
  '/assets/js/referral.js',
  '/assets/js/artwork.js',
  '/manifest.webmanifest',
  '/favicon/favicon-32.png',
];

const DATA_URLS = [
  '/data/config.json',
  '/data/products.json',
  '/data/categories.json',
  '/data/content.json',
  '/data/social.json',
  '/data/texts.json',
  '/data/version.json',
];

/* ---- Install: precache assets statici ---- */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_ASSETS)
      .then(c => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

/* ---- Activate: elimina cache vecchie ---- */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.startsWith(CACHE_VER)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ---- Fetch: strategie per tipo risorsa ---- */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Solo richieste GET dello stesso origin (+ Google Fonts) */
  if(e.request.method !== 'GET') return;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if(url.origin !== self.location.origin && !isFont) return;

  /* JSON data → Network-first */
  if(DATA_URLS.some(p => url.pathname.startsWith(p)) || url.pathname.endsWith('.json')){
    e.respondWith(networkFirst(e.request, CACHE_DATA, 3000));
    return;
  }

  /* Immagini → Cache-first (30gg) */
  if(/\.(webp|jpg|jpeg|png|svg|gif|ico)$/i.test(url.pathname)){
    e.respondWith(cacheFirst(e.request, CACHE_IMG));
    return;
  }

  /* Font Google → Cache-first */
  if(isFont){
    e.respondWith(cacheFirst(e.request, CACHE_ASSETS));
    return;
  }

  /* CSS / JS / altri assets → Cache-first */
  if(/\.(css|js|woff2?|ttf)$/i.test(url.pathname)){
    e.respondWith(cacheFirst(e.request, CACHE_ASSETS));
    return;
  }

  /* HTML / navigazione → Network-first con offline fallback */
  e.respondWith(networkFirst(e.request, CACHE_ASSETS, 5000, '/index.html'));
});

/* Cache-first: prova cache, poi rete (aggiorna cache) */
async function cacheFirst(req, cacheName){
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if(cached) return cached;
  try{
    const fresh = await fetch(req);
    if(fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  }catch(e){ return new Response('Offline', {status: 503}) }
}

/* Network-first: prova rete entro timeout, poi cache */
async function networkFirst(req, cacheName, timeout=4000, fallback=null){
  const cache = await caches.open(cacheName);
  try{
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeout);
    const fresh = await fetch(req, {signal: ctrl.signal});
    clearTimeout(id);
    if(fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  }catch(e){
    const cached = await cache.match(req);
    if(cached) return cached;
    if(fallback){
      const fb = await cache.match(fallback);
      if(fb) return fb;
    }
    return new Response('<h1>Offline</h1>', {status: 503, headers:{'Content-Type':'text/html'}});
  }
}
