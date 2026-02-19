'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('애플리케이션 오류:', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-semibold text-white">오류가 발생했습니다</h2>
        <p className="text-slate-400">
          {process.env.NODE_ENV === 'development' ? error.message : '잠시 후 다시 시도해주세요.'}
        </p>
        <Button onClick={reset} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          다시 시도
        </Button>
      </div>
    </div>
  );
}
