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

// BE A+ 머지 전: mock data 로 컴포넌트 동작 검증.
// BE feature/kis-account-soft-delete 머지 후 USE_MOCK = false (또는 본 블록 삭제).
const USE_MOCK = true;
type MockScenario = 'empty' | 'active' | 'active-with-trash';
const MOCK_SCENARIO: MockScenario = 'active-with-trash';

function buildMockState(): { active: KisAccount | null; trashed: KisAccount | null } {
  if (MOCK_SCENARIO === 'empty') {
    return { active: null, trashed: null };
  }
  const active: KisAccount = {
    appKey: 'PSabcdefghijklmnopqrstuvwxyz1234',
    accountNumber: '12345678-01',
    accountProductCode: '01',
    accountType: 'MOCK',
    enabled: true,
    lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-05-01T00:00:00',
    deletedAt: null,
  };
  if (MOCK_SCENARIO === 'active') {
    return { active, trashed: null };
  }
  const trashed: KisAccount = {
    appKey: 'PSzyxwvutsrqponmlkjihgfedcba0987',
    accountNumber: '87654321-01',
    accountProductCode: '01',
    accountType: 'REAL',
    enabled: false,
    lastUsedAt: null,
    createdAt: '2026-04-15T00:00:00',
    deletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  };
  return { active, trashed };
}

interface KisAccountSectionProps {
  userId: string;
}

type FormMode =
  | { kind: 'closed' }
  | { kind: 'new' } // 신규 등록 (empty 또는 모드 전환)
  | { kind: 'replace'; lockedAccountType: KisAccountType }; // 같은 모드 키 교체

export function KisAccountSection({ userId }: KisAccountSectionProps) {
  const [active, setActive] = useState<KisAccount | null>(null);
  const [trashed, setTrashed] = useState<KisAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' });

  useEffect(() => {
    if (USE_MOCK) {
      const mock = buildMockState();
      setActive(mock.active);
      setTrashed(mock.trashed);
      setLoading(false);
      return;
    }
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
    if (USE_MOCK) {
      const now = new Date().toISOString();
      const next: KisAccount = {
        appKey: req.appKey,
        accountNumber: req.accountNumber,
        accountProductCode: req.accountProductCode,
        accountType: req.accountType,
        enabled: req.enabled,
        lastUsedAt: null,
        createdAt: now,
        deletedAt: null,
      };
      // 모드 다르면 기존을 휴지통으로 이동
      if (active && active.accountType !== req.accountType) {
        setTrashed({ ...active, deletedAt: now, enabled: false });
      }
      setActive(next);
      setFormMode({ kind: 'closed' });
      return;
    }
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('로그인이 필요합니다');
    const saved = await registerKisAccount(userId, token, req);
    setActive(saved);
    // 모드 전환은 BE 가 자동 soft delete → 휴지통 재조회
    const fresh = await getTrashedKisAccount(userId, token);
    setTrashed(fresh);
    setFormMode({ kind: 'closed' });
  }

  async function handleToggle(enabled: boolean) {
    if (!active) return;
    // 낙관 업데이트
    const previous = active;
    setActive({ ...active, enabled });
    if (USE_MOCK) return;
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
    if (!trashed || !active) return;
    if (USE_MOCK) {
      const restored: KisAccount = { ...trashed, deletedAt: null, enabled: true };
      const newlyTrashed: KisAccount = {
        ...active,
        deletedAt: new Date().toISOString(),
        enabled: false,
      };
      setActive(restored);
      setTrashed(newlyTrashed);
      return;
    }
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('로그인이 필요합니다');
    const restored = await restoreKisAccount(userId, token);
    setActive(restored);
    const freshTrashed = await getTrashedKisAccount(userId, token);
    setTrashed(freshTrashed);
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
            {trashed && <KisAccountTrashedCard account={trashed} onRestore={handleRestore} />}
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

        {USE_MOCK && (
          <p className="text-amber-500/60 text-[10px] mt-2">
            ⚠️ mock 데이터 상태 ({MOCK_SCENARIO}) — BE 머지 후 USE_MOCK=false 로 전환
          </p>
        )}
      </CardContent>
    </Card>
  );
}
