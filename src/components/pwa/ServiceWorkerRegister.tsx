'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker 등록 성공:', registration.scope);

          // 업데이트 확인
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] 새 버전이 사용 가능합니다.');
                  // 선택적: 사용자에게 새로고침 알림
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker 등록 실패:', error);
        });
    }
  }, []);

  return null;
}
