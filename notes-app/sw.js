const STATIC_CACHE = 'app-shell-v2';
const DYNAMIC_CACHE = 'dynamic-content-v1';

// Статические файлы (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icons/icon-16x16.png',
  '/icons/icon-32x32.png',
  '/icons/icon-48x48.png',
  '/icons/icon-128x128.png',
  '/icons/icon-512x512.png'
];

// Установка: кэшируем App Shell
self.addEventListener('install', event => {
  console.log('SW: установка');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Активация: удаляем старые кэши
self.addEventListener('activate', event => {
  console.log('SW: активация');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => {
            console.log('Удаляем старый кэш:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: разная стратегия для разных типов запросов
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Пропускаем запросы к CDN (chota)
  if (url.origin !== location.origin) return;
  
  // Динамические страницы (/content/*) — Network First
  if (url.pathname.startsWith('/content/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Кэшируем свежий ответ
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Если сеть недоступна — берём из кэша или fallback на home
          return caches.match(event.request)
            .then(cached => cached || caches.match('/content/home.html'));
        })
    );
    return;
  }
  
  // Для статики — Cache First (сначала кэш, потом сеть)
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});