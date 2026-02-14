// Service Worker for Alpha Foundry PWA
// 배포 시 이 버전을 변경하면 SW가 자동 업데이트됨
const SW_VERSION = '3';
const STATIC_CACHE = `alphafoundry-static-v${SW_VERSION}`;
const DYNAMIC_CACHE = `alphafoundry-dynamic-v${SW_VERSION}`;

// 캐시할 정적 자원 (아이콘/이미지만)
const STATIC_ASSETS = ['/icon-192.png', '/icon-512.png', '/main_logo.png'];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing v${SW_VERSION}...`);
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Service Worker 활성화 - 이전 버전 캐시 삭제 후 클라이언트에 리로드 알림
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating v${SW_VERSION}...`);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log(`[SW] Deleting old cache: ${key}`);
              return caches.delete(key);
            }),
        );
      })
      .then(() => {
        // 모든 클라이언트에 리로드 메시지 전송
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_UPDATED' });
          });
        });
      }),
  );
  self.clients.claim();
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청은 네트워크만 사용
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: '오프라인 상태입니다.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );
    return;
  }

  // HTML 네비게이션 요청 → Network-First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline');
          });
        }),
    );
    return;
  }

  // Next.js 빌드 에셋 (_next/) → Network-First, 404 시 캐시 폴백 + 리로드 유도
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          }
          // 404 등 에러 → 새 빌드 배포 후 이전 chunk 요청
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // 캐시에도 없으면 클라이언트에 리로드 알림
            self.clients.matchAll({ type: 'window' }).then((clients) => {
              clients.forEach((client) => {
                client.postMessage({ type: 'CHUNK_LOAD_FAILED' });
              });
            });
            return response;
          });
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response('', { status: 503 });
          });
        }),
    );
    return;
  }

  // 아이콘/이미지 등 정적 자원 → Cache-First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    }),
  );
});

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// 푸시 알림
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
  console.log('[SW] Syncing data...');
}
