import type { KisAccount, KisAccountRegisterRequest } from '@/types/kis-account';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

function basePath(userId: string): string {
  return `${API_BASE}/api/v1/users/${encodeURIComponent(userId)}/kis-accounts`;
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

export async function getActiveKisAccount(
  userId: string,
  token: string,
): Promise<KisAccount | null> {
  const res = await fetch(basePath(userId), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  await ensureOk(res, 'KIS 계좌 정보를 불러오지 못했습니다');
  return res.json() as Promise<KisAccount>;
}

export async function getTrashedKisAccount(
  userId: string,
  token: string,
): Promise<KisAccount | null> {
  const res = await fetch(`${basePath(userId)}/trashed`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  await ensureOk(res, '휴지통 정보를 불러오지 못했습니다');
  return res.json() as Promise<KisAccount>;
}

export async function registerKisAccount(
  userId: string,
  token: string,
  body: KisAccountRegisterRequest,
): Promise<KisAccount> {
  const res = await fetch(basePath(userId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  await ensureOk(res, '계좌 등록에 실패했습니다');
  return res.json() as Promise<KisAccount>;
}

export async function toggleKisAccount(
  userId: string,
  token: string,
  enabled: boolean,
): Promise<void> {
  const res = await fetch(`${basePath(userId)}/toggle?enabled=${enabled}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  await ensureOk(res, '활성 상태 변경에 실패했습니다');
}

export async function softDeleteKisAccount(userId: string, token: string): Promise<void> {
  const res = await fetch(basePath(userId), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await ensureOk(res, '계좌 삭제에 실패했습니다');
}

export async function restoreKisAccount(userId: string, token: string): Promise<KisAccount> {
  const res = await fetch(`${basePath(userId)}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  await ensureOk(res, '이전 키 복원에 실패했습니다');
  return res.json() as Promise<KisAccount>;
}

// APP_KEY 마스킹 — 앞 4 + 뒤 4 외 ********
export function maskAppKey(appKey: string): string {
  if (!appKey) return '';
  if (appKey.length <= 8) return '*'.repeat(appKey.length);
  return `${appKey.slice(0, 4)}${'*'.repeat(8)}${appKey.slice(-4)}`;
}

// 계좌번호 마스킹 — 12345678-01 → ****5678-01 (뒤 4 + 상품코드만 노출)
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return '';
  const match = accountNumber.match(/^(.+)(-\d{2})$/);
  if (!match) return accountNumber;
  const [, main, suffix] = match;
  if (main.length <= 4) return `${main}${suffix}`;
  return `${'*'.repeat(main.length - 4)}${main.slice(-4)}${suffix}`;
}

// 휴지통 row 의 D-day 계산. deletedAt 으로부터 7일 경과까지의 남은 일수.
export function trashedDaysLeft(deletedAt: string | null): number {
  if (!deletedAt) return 0;
  const deletedTs = new Date(deletedAt).getTime();
  if (Number.isNaN(deletedTs)) return 0;
  const expiryTs = deletedTs + 7 * 24 * 60 * 60 * 1000;
  const remainingMs = expiryTs - Date.now();
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
}
