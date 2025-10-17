const CACHE_NAME = '20educacional-v5'; // Versão atualizada para forçar a atualização do cache
const OFFLINE_URL = '/20Educacional/offline.html';

const appShellFiles = [
  '/20Educacional/',
  '/20Educacional/index.html',
  '/20Educacional/menu.html',
  '/20Educacional/visao-geral.html',
  '/20Educacional/offline.html',
  '/20Educacional/matematica/index.html',
  '/20Educacional/linguagens.html',
  '/20Educacional/redacao/index.html',
  '/20Educacional/firebase/firebase-config.js',
  '/20Educacional/firebase/firebase-conta.js',
  '/20Educacional/assets/js/art-background.js',
  '/20Educacional/assets/imagens/logo-branca-20Png.png',
  '/20Educacional/assets/imagens/logo-192.png',
  '/20Educacional/assets/imagens/saudar.png',
  '/20Educacional/pwa/notifications.js' 
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cacheando o App Shell e a página offline.');
      return cache.addAll(appShellFiles);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Deletando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
      await clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // 1. Tenta obter a resposta da rede primeiro.
        const networkResponse = await fetch(event.request);
        
        // 2. Se a requisição for bem-sucedida, atualiza o cache e retorna a resposta da rede.
        // A verificação 'event.request.method === 'GET'' já foi feita acima, mas é uma boa prática manter aqui também.
        if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // 3. Se a rede falhar, busca no cache.
        console.log('Rede falhou, buscando no cache:', event.request.url);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // 4. Se for uma navegação e a página não estiver no cache, mostra a página offline.
        if (event.request.mode === 'navigate') {
          console.log('Navegação falhou e não há cache, mostrando página offline.');
          const offlinePage = await cache.match(OFFLINE_URL);
          return offlinePage;
        }
        
        // 5. Se não for navegação e o recurso não estiver no cache, retorna uma resposta de erro genérica.
        return new Response("Conteúdo indisponível offline.", {
          status: 404,
          statusText: "Offline",
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })
  );
});


// Event listener para o clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/20Educacional/menu.html')
  );
});