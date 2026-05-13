'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { maskAppKey, maskAccountNumber, trashedDaysLeft } from '@/lib/api/kis-account';
import type { KisAccount } from '@/types/kis-account';

interface KisAccountTrashedCardProps {
  account: KisAccount;
  onRestore: () => Promise<void>;
}

export function KisAccountTrashedCard({ account, onRestore }: KisAccountTrashedCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysLeft = trashedDaysLeft(account.deletedAt);
  // 만료된 휴지통 (BE Scheduler 가 곧 hard delete 할 예정) 은 숨김
  if (daysLeft <= 0) return null;

  const isReal = account.accountType === 'REAL';

  async function handleRestore() {
    setRestoring(true);
    setError(null);
    try {
      await onRestore();
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이전 키 복원에 실패했습니다');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-slate-600 bg-slate-800/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">🗑️</span>
          <span className="text-slate-400 text-xs">이전 키 (휴지통)</span>
        </div>
        <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-300">
          D-{daysLeft}
        </Badge>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">모드</span>
          <span className={isReal ? 'text-red-300' : 'text-emerald-300'}>
            {isReal ? '🔴 실전' : '🟢 모의'}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">APP KEY</span>
          <span className="text-slate-400 font-mono">{maskAppKey(account.appKey)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">계좌번호</span>
          <span className="text-slate-400 font-mono">
            {maskAccountNumber(account.accountNumber)}
          </span>
        </div>
      </div>

      {confirming ? (
        <div className="space-y-2 rounded-lg bg-slate-900/50 p-2">
          <p className="text-slate-300 text-xs">
            이전 키로 되돌리시겠어요? 현재 활성 키가 휴지통으로 이동합니다.
          </p>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={restoring}
              className="text-slate-400 hover:text-white text-xs"
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleRestore}
              disabled={restoring}
              className="bg-amber-600 hover:bg-amber-700 text-xs"
            >
              {restoring ? '복원 중...' : '복원'}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(true)}
          className="w-full border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs"
        >
          이전 키 복원
        </Button>
      )}
    </div>
  );
}
