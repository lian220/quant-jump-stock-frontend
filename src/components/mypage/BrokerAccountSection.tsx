'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  listBrokerAccounts,
  registerBrokerAccount,
  toggleBrokerAccount,
  softDeleteBrokerAccount,
  restoreBrokerAccount,
  trashedDaysLeft,
} from '@/lib/api/broker-account';
import {
  BROKER_META,
  ACCOUNT_TYPE_LABEL,
  type BrokerAccount,
  type BrokerAccountList,
  type BrokerAccountRegisterRequest,
  type Broker,
  type AccountType,
} from '@/types/broker-account';

interface Props {
  userId: string;
}

export function BrokerAccountSection({ userId }: Props) {
  const [list, setList] = useState<BrokerAccountList>({ active: [], trashed: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [trashTarget, setTrashTarget] = useState<BrokerAccount | null>(null);

  function token(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  }

  async function refresh() {
    const t = token();
    if (!t) {
      setLoading(false);
      return;
    }
    try {
      const data = await listBrokerAccounts(userId, t);
      setList(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '계좌 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) await refresh();
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleRegister(req: BrokerAccountRegisterRequest) {
    const t = token();
    if (!t) throw new Error('로그인이 필요합니다');
    await registerBrokerAccount(userId, t, req);
    setShowForm(false);
    await refresh();
  }

  async function handleToggle(account: BrokerAccount, enabled: boolean) {
    const t = token();
    if (!t) throw new Error('로그인이 필요합니다');
    await toggleBrokerAccount(userId, t, account.id, enabled);
    await refresh();
  }

  function handleSoftDelete(account: BrokerAccount) {
    // ConfirmDialog 로 위임. 실 실행은 confirmTrash().
    setTrashTarget(account);
  }

  async function confirmTrash() {
    const account = trashTarget;
    if (!account) return;
    setTrashTarget(null);
    const t = token();
    if (!t) throw new Error('로그인이 필요합니다');
    await softDeleteBrokerAccount(userId, t, account.id);
    await refresh();
  }

  async function handleRestore(account: BrokerAccount) {
    const t = token();
    if (!t) throw new Error('로그인이 필요합니다');
    await restoreBrokerAccount(userId, t, account.id);
    await refresh();
  }

  // broker 별 그룹핑
  const grouped: Record<Broker, BrokerAccount[]> = { KIS: [], TOSS: [] };
  list.active.forEach((a) => grouped[a.broker].push(a));
  const trashedByBroker: Record<Broker, BrokerAccount[]> = { KIS: [], TOSS: [] };
  list.trashed.forEach((a) => trashedByBroker[a.broker].push(a));

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg text-white">자동매매 계좌</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" data-testid="broker-account-section">
        {loading && <p className="text-slate-400 text-sm">로딩 중...</p>}

        {!loading && loadError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
            <p className="text-red-400 text-sm">{loadError}</p>
          </div>
        )}

        {!loading && !loadError && (
          <>
            {(Object.keys(BROKER_META) as Broker[]).map((broker) => (
              <BrokerGroup
                key={broker}
                broker={broker}
                active={grouped[broker]}
                trashed={trashedByBroker[broker]}
                onToggle={handleToggle}
                onSoftDelete={handleSoftDelete}
                onRestore={handleRestore}
              />
            ))}

            {!showForm && (
              <Button
                size="sm"
                onClick={() => setShowForm(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                data-testid="add-broker-account-btn"
              >
                + 계좌 추가
              </Button>
            )}

            {showForm && (
              <BrokerAccountForm onSubmit={handleRegister} onCancel={() => setShowForm(false)} />
            )}
          </>
        )}
      </CardContent>
      <ConfirmDialog
        open={trashTarget !== null}
        title="휴지통으로 이동"
        description={
          trashTarget
            ? `${trashTarget.displayName} 계좌를 휴지통으로 이동합니다.\n7일 안에 복원할 수 있고, 이후 영구 삭제됩니다.`
            : ''
        }
        confirmLabel="휴지통으로 이동"
        cancelLabel="취소"
        tone="default"
        onConfirm={confirmTrash}
        onCancel={() => setTrashTarget(null)}
      />
    </Card>
  );
}

// ===== broker 그룹 =====

function BrokerGroup({
  broker,
  active,
  trashed,
  onToggle,
  onSoftDelete,
  onRestore,
}: {
  broker: Broker;
  active: BrokerAccount[];
  trashed: BrokerAccount[];
  onToggle: (a: BrokerAccount, enabled: boolean) => Promise<void>;
  onSoftDelete: (a: BrokerAccount) => void;
  onRestore: (a: BrokerAccount) => Promise<void>;
}) {
  const meta = BROKER_META[broker];

  return (
    <div
      className="border border-slate-700 rounded-lg p-3 space-y-2"
      data-testid={`broker-group-${broker}`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-white">
          {meta.label} <span className="text-slate-500 text-xs">({meta.shortLabel})</span>
        </h3>
        {!meta.supported && (
          <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
            {meta.description ?? '지원 예정'}
          </Badge>
        )}
      </div>

      {meta.supported && active.length === 0 && trashed.length === 0 && (
        <p className="text-slate-500 text-xs">등록된 계좌가 없습니다</p>
      )}

      {active.map((a) => (
        <AccountCard key={a.id} account={a} onToggle={onToggle} onSoftDelete={onSoftDelete} />
      ))}

      {trashed.map((a) => (
        <TrashedCard key={a.id} account={a} onRestore={onRestore} />
      ))}
    </div>
  );
}

// ===== 활성 계좌 카드 =====

function AccountCard({
  account,
  onToggle,
  onSoftDelete,
}: {
  account: BrokerAccount;
  onToggle: (a: BrokerAccount, enabled: boolean) => Promise<void>;
  onSoftDelete: (a: BrokerAccount) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isReal = account.accountType === 'REAL';

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onToggle(account, !account.enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : '활성 변경 실패');
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    // ConfirmDialog 가 Section 레벨에서 실제 삭제를 처리. 여기선 trigger 만.
    onSoftDelete(account);
  }

  return (
    <div
      className="rounded bg-slate-700/30 p-3 space-y-2"
      data-testid={`broker-account-${account.id}`}
    >
      <div className="flex justify-between items-center">
        <Badge
          variant="outline"
          className={`text-xs font-semibold ${
            isReal
              ? 'border-red-500/60 bg-red-500/20 text-red-200'
              : 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200'
          }`}
        >
          <span aria-hidden="true">{isReal ? '🔴' : '🟢'}</span>{' '}
          {ACCOUNT_TYPE_LABEL[account.accountType]}
        </Badge>
        <span className="text-white text-xs font-mono">{account.accountNumber}</span>
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-slate-400">APP KEY</span>
        <span className="text-white font-mono">{account.appKey}</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
        <span className="text-white text-xs">자동매매</span>
        <button
          onClick={handleToggle}
          disabled={busy}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            account.enabled ? 'bg-emerald-600' : 'bg-slate-600'
          } ${busy ? 'opacity-50' : ''}`}
          role="switch"
          aria-checked={account.enabled}
          aria-label={`자동매매 ${account.enabled ? '끄기' : '켜기'}`}
          data-testid={`broker-account-toggle-${account.id}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              account.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={busy}
        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
        data-testid={`broker-account-delete-${account.id}`}
      >
        휴지통으로 이동
      </Button>
    </div>
  );
}

// ===== 휴지통 카드 =====

function TrashedCard({
  account,
  onRestore,
}: {
  account: BrokerAccount;
  onRestore: (a: BrokerAccount) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const daysLeft = trashedDaysLeft(account.deletedAt);
  if (daysLeft === 0) return null;

  async function handleRestore() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onRestore(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : '복원 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="rounded border border-slate-600 bg-slate-700/10 p-3 space-y-2 opacity-70"
      data-testid={`broker-account-trashed-${account.id}`}
    >
      <div className="flex justify-between items-center">
        <Badge
          variant="outline"
          className="border-amber-500/60 bg-amber-500/15 text-amber-200 text-xs font-semibold"
        >
          <span aria-hidden="true">🗑️</span> 휴지통 · D-{daysLeft}
        </Badge>
        <span className="text-slate-500 text-xs font-mono">
          {ACCOUNT_TYPE_LABEL[account.accountType]} {account.accountNumber}
        </span>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={busy}
        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
        data-testid={`broker-account-restore-${account.id}`}
      >
        복원
      </Button>
    </div>
  );
}

// ===== 신규 계좌 등록 form =====

function BrokerAccountForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (req: BrokerAccountRegisterRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const [broker, setBroker] = useState<Broker>('KIS');
  const [accountType, setAccountType] = useState<AccountType>('MOCK');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountProductCode, setAccountProductCode] = useState('01');
  const [accountAlias, setAccountAlias] = useState('');
  const [appKey, setAppKey] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportedBroker = BROKER_META[broker].supported;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        broker,
        accountType,
        accountNumber: accountNumber.trim(),
        accountProductCode: broker === 'KIS' ? accountProductCode.trim() : null,
        accountAlias: accountAlias.trim() || null,
        appKey: appKey.trim(),
        appSecret: appSecret.trim(),
        enabled: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록 실패');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border border-slate-600 rounded p-3"
      data-testid="broker-account-form"
    >
      <h3 className="text-sm text-white font-semibold">신규 계좌 등록</h3>

      <div>
        <label className="text-xs text-slate-400 block mb-1">증권사</label>
        <select
          value={broker}
          onChange={(e) => setBroker(e.target.value as Broker)}
          className="w-full bg-slate-700 text-white text-sm rounded p-2 border border-slate-600"
          data-testid="form-broker"
        >
          {(Object.keys(BROKER_META) as Broker[]).map((b) => (
            <option key={b} value={b} disabled={!BROKER_META[b].supported}>
              {BROKER_META[b].label}
              {!BROKER_META[b].supported ? ' (지원 예정)' : ''}
            </option>
          ))}
        </select>
      </div>

      {!supportedBroker && (
        <p className="text-xs text-amber-400">선택한 증권사는 아직 지원되지 않습니다.</p>
      )}

      <div>
        <label className="text-xs text-slate-400 block mb-1">계좌 유형</label>
        <div className="flex gap-3 text-sm text-white">
          {(['MOCK', 'REAL'] as AccountType[]).map((t) => (
            <label key={t} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                checked={accountType === t}
                onChange={() => setAccountType(t)}
                data-testid={`form-accountType-${t}`}
              />
              {ACCOUNT_TYPE_LABEL[t]} ({t})
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 block mb-1">계좌번호 (숫자 8자리)</label>
        <input
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="w-full bg-slate-700 text-white text-sm rounded p-2 border border-slate-600 font-mono"
          required
          minLength={8}
          maxLength={12}
          pattern="\d+"
          data-testid="form-accountNumber"
        />
      </div>

      {broker === 'KIS' && (
        <div>
          <label className="text-xs text-slate-400 block mb-1">상품코드 (KIS)</label>
          <input
            value={accountProductCode}
            onChange={(e) => setAccountProductCode(e.target.value)}
            className="w-full bg-slate-700 text-white text-sm rounded p-2 border border-slate-600 font-mono"
            placeholder="01"
            maxLength={2}
            data-testid="form-accountProductCode"
          />
        </div>
      )}

      <div>
        <label className="text-xs text-slate-400 block mb-1">별명 (선택)</label>
        <input
          value={accountAlias}
          onChange={(e) => setAccountAlias(e.target.value)}
          className="w-full bg-slate-700 text-white text-sm rounded p-2 border border-slate-600"
          placeholder="예: 메인 계좌"
          maxLength={50}
          data-testid="form-accountAlias"
        />
      </div>

      <div>
        <label className="text-xs text-slate-400 block mb-1">APP KEY</label>
        <input
          value={appKey}
          onChange={(e) => setAppKey(e.target.value)}
          className="w-full bg-slate-700 text-white text-sm rounded p-2 border border-slate-600 font-mono"
          required
          minLength={10}
          maxLength={100}
          data-testid="form-appKey"
        />
      </div>

      <div>
        <label className="text-xs text-slate-400 block mb-1">APP SECRET</label>
        <input
          value={appSecret}
          onChange={(e) => setAppSecret(e.target.value)}
          type="password"
          className="w-full bg-slate-700 text-white text-sm rounded p-2 border border-slate-600 font-mono"
          required
          minLength={10}
          maxLength={200}
          data-testid="form-appSecret"
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={submitting || !supportedBroker}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          data-testid="form-submit"
        >
          {submitting ? '등록 중...' : '등록'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
          data-testid="form-cancel"
        >
          취소
        </Button>
      </div>
    </form>
  );
}
