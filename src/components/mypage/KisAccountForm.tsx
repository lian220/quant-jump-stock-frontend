'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { KisAccountRegisterRequest, KisAccountType } from '@/types/kis-account';

interface KisAccountFormProps {
  // 같은 모드 내 키 교체일 때 lockedAccountType 으로 라디오 잠금.
  lockedAccountType?: KisAccountType;
  // 현재 활성 계좌의 모드. 폼에서 선택한 accountType 과 다르면 모드 전환 동의 모달 노출.
  currentActiveAccountType?: KisAccountType;
  onSubmit: (req: KisAccountRegisterRequest) => Promise<void>;
  onCancel: () => void;
}

const APP_KEY_MIN_LEN = 32;
const APP_SECRET_MIN_LEN = 64;
const ACCOUNT_NUMBER_PATTERN = /^\d{8,10}-\d{2}$/;

export function KisAccountForm({
  lockedAccountType,
  currentActiveAccountType,
  onSubmit,
  onCancel,
}: KisAccountFormProps) {
  const [appKey, setAppKey] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<KisAccountType>(lockedAccountType ?? 'MOCK');
  const [accountProductCode] = useState('01');
  const [realAgreed, setRealAgreed] = useState(false);
  const [modeChangeAgreed, setModeChangeAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 unmount 시 secret 메모리에서 제거
  useEffect(() => {
    return () => {
      setAppSecret('');
    };
  }, []);

  const trimmedAppKey = appKey.trim();
  const trimmedAppSecret = appSecret.trim();
  const trimmedAccountNumber = accountNumber.trim();

  const appKeyValid = trimmedAppKey.length >= APP_KEY_MIN_LEN;
  const appSecretValid = trimmedAppSecret.length >= APP_SECRET_MIN_LEN;
  const accountNumberValid = ACCOUNT_NUMBER_PATTERN.test(trimmedAccountNumber);

  const isReal = accountType === 'REAL';
  const isModeChange =
    !lockedAccountType &&
    currentActiveAccountType !== undefined &&
    currentActiveAccountType !== accountType;

  const canSubmit =
    appKeyValid &&
    appSecretValid &&
    accountNumberValid &&
    (!isReal || realAgreed) &&
    (!isModeChange || modeChangeAgreed) &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        appKey: trimmedAppKey,
        appSecret: trimmedAppSecret,
        accountNumber: trimmedAccountNumber,
        accountProductCode,
        accountType,
        enabled: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      <div className="space-y-3">
        {/* APP KEY */}
        <div className="space-y-1">
          <label htmlFor="kis-app-key" className="text-xs text-slate-400">
            APP KEY
          </label>
          <Input
            id="kis-app-key"
            type="password"
            autoComplete="off"
            value={appKey}
            onChange={(e) => setAppKey(e.target.value)}
            placeholder="한국투자증권에서 발급받은 APP KEY"
            className="bg-slate-800 border-slate-600 text-white text-sm"
          />
          {appKey.length > 0 && !appKeyValid && (
            <p className="text-red-400 text-xs">APP KEY 는 최소 {APP_KEY_MIN_LEN}자입니다</p>
          )}
        </div>

        {/* APP SECRET */}
        <div className="space-y-1">
          <label htmlFor="kis-app-secret" className="text-xs text-slate-400">
            APP SECRET
          </label>
          <Input
            id="kis-app-secret"
            type="password"
            autoComplete="off"
            value={appSecret}
            onChange={(e) => setAppSecret(e.target.value)}
            placeholder="한국투자증권에서 발급받은 APP SECRET"
            className="bg-slate-800 border-slate-600 text-white text-sm"
          />
          {appSecret.length > 0 && !appSecretValid && (
            <p className="text-red-400 text-xs">APP SECRET 은 최소 {APP_SECRET_MIN_LEN}자입니다</p>
          )}
        </div>

        {/* 계좌번호 */}
        <div className="space-y-1">
          <label htmlFor="kis-account-number" className="text-xs text-slate-400">
            계좌번호
          </label>
          <Input
            id="kis-account-number"
            type="text"
            autoComplete="off"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="12345678-01"
            className="bg-slate-800 border-slate-600 text-white text-sm"
          />
          {accountNumber.length > 0 && !accountNumberValid && (
            <p className="text-red-400 text-xs">계좌번호 형식: 12345678-01</p>
          )}
        </div>

        {/* 계좌 유형 */}
        <div className="space-y-1">
          <span className="text-xs text-slate-400">계좌 유형</span>
          <div className="flex gap-2">
            {(['MOCK', 'REAL'] as const).map((type) => {
              const checked = accountType === type;
              const disabled = lockedAccountType !== undefined && lockedAccountType !== type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => !disabled && setAccountType(type)}
                  disabled={disabled}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    checked
                      ? type === 'REAL'
                        ? 'border-red-500/60 bg-red-500/10 text-red-300'
                        : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {type === 'MOCK' ? '🟢 모의투자' : '🔴 실전투자'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 모드 전환 동의 */}
      {isModeChange && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
          <p className="text-amber-200 text-xs">
            현재 키({currentActiveAccountType === 'MOCK' ? '모의' : '실전'})는 7일간 보관됩니다. 7일
            안에 [이전 키 복원] 버튼으로 되돌릴 수 있어요.
          </p>
          <label className="flex items-center gap-2 text-xs text-amber-200 cursor-pointer">
            <input
              type="checkbox"
              checked={modeChangeAgreed}
              onChange={(e) => setModeChangeAgreed(e.target.checked)}
              className="accent-amber-400"
            />
            이해했어요
          </label>
        </div>
      )}

      {/* 실전 동의 */}
      {isReal && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 space-y-2">
          <p className="text-red-300 text-xs font-medium">⚠️ 실전 계좌는 실제 자금이 매매됩니다</p>
          <label className="flex items-center gap-2 text-xs text-red-200 cursor-pointer">
            <input
              type="checkbox"
              checked={realAgreed}
              onChange={(e) => setRealAgreed(e.target.checked)}
              className="accent-red-400"
            />
            실제 자금 매매 위험을 인지했어요
          </label>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
          className="text-slate-400 hover:text-white text-xs"
        >
          취소
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs disabled:opacity-40"
        >
          {submitting ? '연결 중...' : '연결'}
        </Button>
      </div>
    </div>
  );
}
