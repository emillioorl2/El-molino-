// Service worker de El Molino — Finanzas personales.
// Cachea el "app shell" para que la app abra sin internet; los datos siguen
// yendo y viniendo de Firebase cuando hay conexión (esto solo cachea archivos).
const CACHE = 'libreta-v1';
const SHELL = ['./', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Nunca cachear llamadas a Firebase/Google: esos datos deben ser siempre frescos.
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebaseio.com') || url.hostname.includes('gstatic.com') && url.pathname.includes('firebasejs')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res && res.ok && url.origin === self.location.origin) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
