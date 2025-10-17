const CACHE_NAME = '20educacional-v1';
// Caminhos absolutos a partir da raiz do site, incluindo o nome do repositório.
const appShellFiles = [
  '/20Educacional/',
  '/20Educacional/index.html',
  '/20Educacional/menu.html',
  '/20Educacional/matematica/index.html',
  '/20Educacional/linguagens.html',
  '/20Educacional/redacao/index.html',
  '/20Educacional/firebase/firebase-config.js',
  '/20Educacional/firebase/firebase-conta.js',
  '/20Educacional/assets/imagens/logo-branca-20Png.png',
  '/20Educacional/assets/imagens/saudar.png',
  '/20Educacional/redacao/assets/icon.ico',
  '/20Educacional/redacao/assets/default-avatar.png'
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
            console.log('Service Worker: Deletando cache antigo:', cache);
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
        // Cacheia as aulas sob demanda (verifique se o caminho está correto)
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