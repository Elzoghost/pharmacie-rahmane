// ═══════════════════════════════════════════
//  SERVICE WORKER · Pharmacie Rahmane PWA
// ═══════════════════════════════════════════
const CACHE = 'pharmacie-rahmane-v1';
const ASSETS = [
  '/pharmacie-rahmane/',
  '/pharmacie-rahmane/index.html',
  '/pharmacie-rahmane/manifest.json',
  '/pharmacie-rahmane/icon-192.png',
  '/pharmacie-rahmane/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
];

// ── INSTALLATION ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATION ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH : Cache first pour assets, Network first pour Supabase ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase API → toujours réseau (pas de cache)
  if(url.hostname.includes('supabase.co')){
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify([]), {
        headers: {'Content-Type': 'application/json'}
      }))
    );
    return;
  }

  // Google Fonts → cache first
  if(url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')){
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // App shell → cache first, fallback réseau
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res.ok){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/pharmacie-rahmane/index.html'));
    })
  );
});
