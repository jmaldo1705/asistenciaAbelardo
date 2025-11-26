// Service Worker para forzar actualización de la aplicación
const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `asistencia-cache-${CACHE_VERSION}`;

// Instalar el service worker y limpiar caches antiguas
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting(); // Activar inmediatamente
});

// Activar y limpiar caches viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activado');
      return self.clients.claim(); // Tomar control inmediatamente
    })
  );
});

// No cachear requests, siempre ir a la red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Si falla la red, intentar desde cache
      return caches.match(event.request);
    })
  );
});
