const CACHE_NAME = 'salaah-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.add('/'))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Cache a specific URL on demand (called when user saves home city)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_URL') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache =>
        fetch(event.data.url)
          .then(res => { if (res.ok) cache.put(event.data.url, res); })
          .catch(() => {})
      )
    );
  }
});
