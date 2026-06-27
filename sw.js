/* Service Worker : cache l'app shell pour un fonctionnement OFFLINE complet.
   Stratégie cache-first sur les fichiers de l'app -> l'app se lance sans réseau. */
const CACHE = 'ehr-shell-v1';
const ASSETS = [
  './', './index.html', './style.css', './manifest.json',
  './js/db.js', './js/i18n.js', './js/pdf.js', './js/ui.js',
  './js/services/sync.js', './js/services/auth.js', './js/services/patients.js',
  './js/services/consultations.js', './js/services/prescriptions.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached ||
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => cached))
  );
});
