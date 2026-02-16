'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker 등록 성공:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker 등록 실패:', error);
        });

      // controllerchange 한 번만 리로드 (sessionStorage로 무한 루프 방지)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        if (sessionStorage.getItem('sw-reloaded')) {
          sessionStorage.removeItem('sw-reloaded');
          return;
        }
        refreshing = true;
        sessionStorage.setItem('sw-reloaded', '1');
        window.location.reload();
      });
    }
  }, []);

  return null;
}
