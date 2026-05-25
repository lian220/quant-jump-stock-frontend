import type {
  BrokerAccount,
  BrokerAccountList,
  BrokerAccountRegisterRequest,
  BrokerAccountUpdateRequest,
} from '@/types/broker-account';
import { fetchWithAutoRefresh } from '@/lib/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

function basePath(userId: string): string {
  return `${API_BASE}/api/v1/users/${encodeURIComponent(userId)}/broker-accounts`;
}

async function ensureOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return;
  let message = fallback;
  try {
    const body = (await res.json()) as { message?: string };
    if (typeof body.message === 'string') message = body.message;
  } catch {
    /* JSON 본문이 없어도 무방 */
  }
  const err = new Error(message) as Error & { status: number };
  err.status = res.status;
  throw err;
}

export async function listBrokerAccounts(
  userId: string,
  token: string,
): Promise<BrokerAccountList> {
  const res = await fetchWithAutoRefresh(basePath(userId), {
    headers: { Authorization: `Bearer ${token}` },
  });
  await ensureOk(res, '계좌 목록을 불러오지 못했습니다');
  return res.json() as Promise<BrokerAccountList>;
}

export async function registerBrokerAccount(
  userId: string,
  token: string,
  body: BrokerAccountRegisterRequest,
): Promise<BrokerAccount> {
  const res = await fetchWithAutoRefresh(basePath(userId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  await ensureOk(res, '계좌 등록에 실패했습니다');
  return res.json() as Promise<BrokerAccount>;
}

export async function updateBrokerAccount(
  userId: string,
  token: string,
  accountId: number,
  body: BrokerAccountUpdateRequest,
): Promise<BrokerAccount> {
  const res = await fetchWithAutoRefresh(`${basePath(userId)}/${accountId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  await ensureOk(res, '계좌 수정에 실패했습니다');
  return res.json() as Promise<BrokerAccount>;
}

export async function toggleBrokerAccount(
  userId: string,
  token: string,
  accountId: number,
  enabled: boolean,
): Promise<BrokerAccount> {
  const res = await fetchWithAutoRefresh(
    `${basePath(userId)}/${accountId}/toggle?enabled=${enabled}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  await ensureOk(res, '활성 상태 변경에 실패했습니다');
  return res.json() as Promise<BrokerAccount>;
}

export async function softDeleteBrokerAccount(
  userId: string,
  token: string,
  accountId: number,
): Promise<void> {
  const res = await fetchWithAutoRefresh(`${basePath(userId)}/${accountId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await ensureOk(res, '계좌 삭제에 실패했습니다');
}

export async function restoreBrokerAccount(
  userId: string,
  token: string,
  accountId: number,
): Promise<BrokerAccount> {
  const res = await fetchWithAutoRefresh(`${basePath(userId)}/${accountId}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  await ensureOk(res, '계좌 복원에 실패했습니다');
  return res.json() as Promise<BrokerAccount>;
}

/**
 * 휴지통 row 의 D-day 계산. `deletedAt + 7일` 까지 남은 일수.
 * 0 또는 음수 = 만료 (UI 카드 숨김).
 */
export function trashedDaysLeft(deletedAt: string | null): number {
  if (!deletedAt) return 0;
  const deletedTs = new Date(deletedAt).getTime();
  if (Number.isNaN(deletedTs)) return 0;
  const expiryTs = deletedTs + 7 * 24 * 60 * 60 * 1000;
  const remainingMs = expiryTs - Date.now();
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
}
