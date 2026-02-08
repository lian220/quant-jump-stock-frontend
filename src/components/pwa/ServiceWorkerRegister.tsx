'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker 등록 성공:', registration.scope);

          // 주기적으로 업데이트 확인 (1시간마다)
          setInterval(
            () => {
              registration.update();
            },
            1000 * 60 * 60,
          );

          // 업데이트 확인
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] 새 버전이 사용 가능합니다.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker 등록 실패:', error);
        });

      // Service Worker 메시지 수신
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'RELOAD_PAGE') {
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}
