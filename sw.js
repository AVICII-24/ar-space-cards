// Service worker: stores the whole app on the tablet the first time it loads,
// so it keeps working on wards with poor or no Wi-Fi. No data is ever uploaded.
importScripts('./precache.js');
const CACHE = 'ar-space-cards-' + self.APP_VERSION;
const DEV = ['localhost', '127.0.0.1'].includes(self.location.hostname);

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(self.APP_FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ar-space-cards-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const cached = () => caches.match(e.request, { ignoreSearch: true }).then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
  // On a developer's machine always prefer fresh files; on a tablet prefer the stored copy (instant, works offline).
  e.respondWith(DEV
    ? fetch(e.request).catch(() => cached()).then(r => r || Response.error())
    : cached().then(r => r || fetch(e.request)));
});
