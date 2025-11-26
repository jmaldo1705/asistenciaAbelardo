// Service Worker de limpieza - elimina caches y se desregistra sin causar recargas
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Instalando limpieza');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🧹 SW: Limpiando caches');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🗑️ Eliminando:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .then(() => console.log('✅ SW desregistrado'))
  );
});

// No cachear nada
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
