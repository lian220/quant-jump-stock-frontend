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

      // SW 메시지 처리
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATED') {
          console.log('[PWA] 새 버전 감지, 페이지 리로드...');
          window.location.reload();
        }
        if (event.data?.type === 'CHUNK_LOAD_FAILED') {
          console.log('[PWA] 청크 로드 실패 (새 빌드 감지), 페이지 리로드...');
          window.location.reload();
        }
      });

      // 새 SW가 컨트롤러로 교체되면 리로드 (controllerchange 백업)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}
