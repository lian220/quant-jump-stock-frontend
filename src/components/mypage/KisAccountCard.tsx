'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { maskAppKey, maskAccountNumber } from '@/lib/api/kis-account';
import type { KisAccount } from '@/types/kis-account';

interface KisAccountCardProps {
  account: KisAccount;
  onToggle: (enabled: boolean) => Promise<void>;
  onReplace: () => void; // 같은 모드 내 키 교체
  onModeChange: () => void; // 모드 전환 (다른 accountType)
}

export function KisAccountCard({
  account,
  onToggle,
  onReplace,
  onModeChange,
}: KisAccountCardProps) {
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const isReal = account.accountType === 'REAL';

  async function handleToggle() {
    if (toggling) return;
    const next = !account.enabled;
    setToggling(true);
    setToggleError(null);
    try {
      await onToggle(next);
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : '활성 상태 변경에 실패했습니다');
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-700/30 p-3 space-y-3">
      {/* 헤더: 모드 + 마스킹 정보 */}
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={`text-xs ${
            isReal ? 'border-red-500/40 text-red-300' : 'border-emerald-500/40 text-emerald-300'
          }`}
        >
          {isReal ? '🔴 실전' : '🟢 모의'}
        </Badge>
        <span className="text-slate-500 text-xs">
          {account.lastUsedAt ? `마지막 사용 ${formatRelative(account.lastUsedAt)}` : '미사용'}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400 text-xs">APP KEY</span>
          <span className="text-white font-mono text-xs">{maskAppKey(account.appKey)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400 text-xs">계좌번호</span>
          <span className="text-white font-mono text-xs">
            {maskAccountNumber(account.accountNumber)}
          </span>
        </div>
      </div>

      {/* 활성 토글 */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
        <div>
          <p className="text-white text-sm font-medium">자동매매 활성</p>
          <p className="text-slate-500 text-xs">OFF 시 매매 신호 무시</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            account.enabled ? 'bg-emerald-600' : 'bg-slate-600'
          } ${toggling ? 'opacity-50' : ''}`}
          role="switch"
          aria-checked={account.enabled}
          aria-label={`자동매매 ${account.enabled ? '끄기' : '켜기'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              account.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {toggleError && <p className="text-red-400 text-xs">{toggleError}</p>}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReplace}
          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
        >
          키 교체
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onModeChange}
          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
        >
          모드 전환
        </Button>
      </div>
    </div>
  );
}

/**
 * ISO timestamp 를 "방금 전 / N분 전 / N시간 전 / N일 전" 한국어로 변환.
 * 서버-클라이언트 시계 오차로 미래 시각이 들어와도 `Math.max(0, ...)` 가드로 "방금 전" 처리.
 */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  // 시계 오차로 미래 시각이 들어오면 "방금 전" 으로 처리.
  const diffMs = Math.max(0, Date.now() - then);
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}일 전`;
}
