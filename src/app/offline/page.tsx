'use client';

import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="text-center">
        <WifiOff className="mx-auto h-24 w-24 text-slate-400" />
        <h1 className="mt-6 text-3xl font-bold text-white">오프라인 상태</h1>
        <p className="mt-4 text-slate-300">인터넷 연결을 확인하고 다시 시도해주세요.</p>
        <div className="mt-8 flex gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    </div>
  );
}
