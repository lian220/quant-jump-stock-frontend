// Service Worker for Alpha Foundry PWA
const CACHE_NAME = 'alphafoundry-v1';
const STATIC_CACHE = 'alphafoundry-static-v1';
const DYNAMIC_CACHE = 'alphafoundry-dynamic-v1';

// 캐시할 정적 자원
const STATIC_ASSETS = ['/', '/offline', '/icon-192.png', '/icon-512.png', '/main_logo.png'];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

// SKIP_WAITING 메시지 처리
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청은 네트워크 우선
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return new Response(JSON.stringify({ error: '오프라인 상태입니다.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }),
    );
    return;
  }

  // 정적 자원은 캐시 우선
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          // 성공적인 응답만 캐시
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 오프라인 페이지 반환
          return caches.match('/offline');
        });
    }),
  );
});

// 백그라운드 동기화 (선택적)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// 푸시 알림 (선택적)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification('Alpha Foundry', options));
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

async function syncData() {
  // 백그라운드에서 데이터 동기화 로직
  console.log('[SW] Syncing data...');
}
