'use client';

import { Wifi } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center">
      <div className="space-y-6">
        {/* 오프라인 아이콘 */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-800">
          <Wifi className="h-12 w-12 text-slate-400" strokeWidth={1.5} />
        </div>

        {/* 제목 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">오프라인 상태입니다</h1>
          <p className="text-slate-400">인터넷 연결을 확인한 후 다시 시도해주세요.</p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => window.location.reload()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            새로고침
          </Button>
          <Button asChild variant="outline" className="border-slate-700">
            <Link href="/">홈으로 이동</Link>
          </Button>
        </div>

        {/* 추가 정보 */}
        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-800/50 p-4 text-left text-sm text-slate-300">
          <p className="font-semibold text-white">💡 오프라인에서도 일부 기능 사용 가능</p>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>• 최근 조회한 전략 정보</li>
            <li>• 캐시된 주식 데이터</li>
            <li>• 저장된 페이지 콘텐츠</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
