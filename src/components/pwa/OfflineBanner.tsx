'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    // 초기 상태 반영
    if (!navigator.onLine) setIsOffline(true);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white shadow-md">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.</span>
      </div>
    </div>
  );
}
