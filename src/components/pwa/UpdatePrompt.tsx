'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setRegistration(reg);
                setShowUpdate(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
      <div className="relative overflow-hidden rounded-lg border border-cyan-600/50 bg-slate-800 p-4 shadow-lg shadow-cyan-600/20">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-transparent" />

        {/* 내용 */}
        <div className="relative">
          <div className="mb-3 flex items-start gap-3">
            <div className="rounded-lg bg-cyan-600/20 p-2">
              <RefreshCw className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">새 버전 사용 가능</h3>
              <p className="mt-1 text-sm text-slate-400">
                최신 기능과 개선사항이 포함되어 있습니다
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleUpdate} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
              지금 업데이트
            </Button>
            <Button
              onClick={() => setShowUpdate(false)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              나중에
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
