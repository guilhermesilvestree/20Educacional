const CACHE_NAME = '20educacional-v1';
// Caminhos absolutos a partir da raiz do site.
const appShellFiles = [
  '/',
  '/index.html',
  '/menu.html',
  '/matematica/index.html',
  '/linguagens.html',
  '/redacao/index.html',
  '/firebase/firebase-config.js',
  '/firebase/firebase-conta.js',
  '/assets/imagens/logo-branca-20Png.png',
  '/assets/imagens/saudar.png',
  '/redacao/assets/icon.ico',
  '/redacao/assets/default-avatar.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cacheando o App Shell');
      return cache.addAll(appShellFiles);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cacheia as aulas sob demanda
        if (event.request.url.includes('/aulas/')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      });
    })
  );
});