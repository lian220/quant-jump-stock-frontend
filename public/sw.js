// Service Worker for Alpha Foundry PWA
// 배포 시 이 버전을 변경하면 SW가 자동 업데이트됨
const SW_VERSION = '5';
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
  // skipWaiting 제거: iOS Safari에서 무한 새로고침 루프 방지
  // 새 SW는 기존 탭이 모두 닫힌 후 자연스럽게 활성화됨
});

// Service Worker 활성화 - 이전 버전 캐시 삭제
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating v${SW_VERSION}...`);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          }),
      );
    }),
  );
  // clients.claim() 제거: iOS Safari에서 controllerchange 무한 루프 방지
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청 처리
  if (url.pathname.startsWith('/api/')) {
    // POST/PUT/DELETE/PATCH 등 변이 요청은 SW를 거치지 않고 브라우저가 직접 처리
    // 이유: fetch body 소비 문제, credentials 전달 이슈, 로그인/구독 등 중요 요청 오작동 방지
    if (request.method !== 'GET') {
      return;
    }
    // GET 요청은 네트워크 우선, 오프라인 시 503
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
            return cached || response;
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

// SKIP_WAITING 메시지 핸들러 (UpdatePrompt에서 사용)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 푸시 알림
self.addEventListener('push', (event) => {
  let title = 'Alpha Foundry';
  let options = {
    body: '새로운 알림이 있습니다.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      options.body = payload.body || options.body;
      options.data = { action_url: payload.action_url || '/' };
    } catch {
      // JSON 파싱 실패 시 텍스트로 폴백
      options.body = event.data.text() || options.body;
      options.data = { action_url: '/' };
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const actionUrl = event.notification.data?.action_url || '/';
  event.waitUntil(clients.openWindow(actionUrl));
});

async function syncData() {
  console.log('[SW] Syncing data...');
}
