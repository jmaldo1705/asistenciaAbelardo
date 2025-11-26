// Service Worker de desinstalación - Este SW elimina todos los caches y se desregistra
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Iniciando desinstalación');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🧹 Service Worker: Limpiando todos los caches');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🗑️ Eliminando cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('✅ Todos los caches eliminados');
        return self.clients.claim();
      })
      .then(() => {
        // Desregistrar este service worker
        return self.registration.unregister();
      })
      .then(() => {
        console.log('✅ Service Worker desregistrado');
        // Notificar a todos los clientes para que recarguen
        return self.clients.matchAll();
      })
      .then((clients) => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UNREGISTERED' });
        });
      })
  );
});

// No cachear nada, siempre ir directo a la red
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
