'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getActiveKisAccount,
  getTrashedKisAccount,
  registerKisAccount,
  toggleKisAccount,
  restoreKisAccount,
} from '@/lib/api/kis-account';
import type { KisAccount, KisAccountRegisterRequest, KisAccountType } from '@/types/kis-account';
import { KisAccountCard } from './KisAccountCard';
import { KisAccountTrashedCard } from './KisAccountTrashedCard';
import { KisAccountForm } from './KisAccountForm';

interface KisAccountSectionProps {
  userId: string;
}

type FormMode =
  | { kind: 'closed' }
  | { kind: 'new' } // 신규 등록 또는 모드 전환
  | { kind: 'replace'; lockedAccountType: KisAccountType }; // 같은 모드 키 교체

export function KisAccountSection({ userId }: KisAccountSectionProps) {
  const [active, setActive] = useState<KisAccount | null>(null);
  const [trashed, setTrashed] = useState<KisAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' });

  useEffect(() => {
    let mounted = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([getActiveKisAccount(userId, token), getTrashedKisAccount(userId, token)])
      .then(([a, t]) => {
        if (!mounted) return;
        setActive(a);
        setTrashed(t);
      })
      .catch((err) => {
        if (!mounted) return;
        setLoadError(err instanceof Error ? err.message : '계좌 정보를 불러오지 못했습니다');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  async function handleRegister(req: KisAccountRegisterRequest) {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('로그인이 필요합니다');
    await registerKisAccount(userId, token, req);
    // BE 가 모드 전환 시 자동 soft delete 하므로 활성/휴지통 모두 재조회.
    const [a, t] = await Promise.all([
      getActiveKisAccount(userId, token),
      getTrashedKisAccount(userId, token),
    ]);
    setActive(a);
    setTrashed(t);
    setFormMode({ kind: 'closed' });
  }

  async function handleToggle(enabled: boolean) {
    if (!active) return;
    // 낙관 업데이트
    const previous = active;
    setActive({ ...active, enabled });
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setActive(previous);
      throw new Error('로그인이 필요합니다');
    }
    try {
      await toggleKisAccount(userId, token, enabled);
    } catch (err) {
      setActive(previous);
      throw err;
    }
  }

  async function handleRestore() {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('로그인이 필요합니다');
    await restoreKisAccount(userId, token);
    const [a, t] = await Promise.all([
      getActiveKisAccount(userId, token),
      getTrashedKisAccount(userId, token),
    ]);
    setActive(a);
    setTrashed(t);
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg text-white">자동매매 계좌</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-slate-400 text-sm">로딩 중...</p>}

        {!loading && loadError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
            <p className="text-red-400 text-sm">{loadError}</p>
          </div>
        )}

        {!loading && !loadError && !active && formMode.kind === 'closed' && (
          <div className="text-center py-4 space-y-2">
            <p className="text-slate-400 text-sm">
              자동매매를 시작하려면 한국투자증권 계좌를 연결해주세요
            </p>
            <Button
              size="sm"
              onClick={() => setFormMode({ kind: 'new' })}
              className="bg-emerald-600 hover:bg-emerald-700 text-xs"
            >
              계좌 연결하기
            </Button>
          </div>
        )}

        {!loading && !loadError && active && formMode.kind === 'closed' && (
          <>
            <KisAccountCard
              account={active}
              onToggle={handleToggle}
              onReplace={() =>
                setFormMode({ kind: 'replace', lockedAccountType: active.accountType })
              }
              onModeChange={() => setFormMode({ kind: 'new' })}
            />
            {trashed && (
              <KisAccountTrashedCard
                key={trashed.appKey + (trashed.deletedAt ?? '')}
                account={trashed}
                onRestore={handleRestore}
              />
            )}
          </>
        )}

        {formMode.kind !== 'closed' && (
          <KisAccountForm
            lockedAccountType={formMode.kind === 'replace' ? formMode.lockedAccountType : undefined}
            currentActiveAccountType={active?.accountType}
            onSubmit={handleRegister}
            onCancel={() => setFormMode({ kind: 'closed' })}
          />
        )}
      </CardContent>
    </Card>
  );
}
