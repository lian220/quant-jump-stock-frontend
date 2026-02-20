const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

function getAuthHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function getJsonHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** 브라우저 → 프록시, 서버 → 직접 호출 */
function getSubscriptionsUrl(): string {
  const isBrowser = typeof window !== 'undefined';
  return isBrowser ? '/api/subscriptions' : `${API_URL}/api/v1/subscriptions`;
}

function getStrategySubscribeUrl(strategyId: number): string {
  const isBrowser = typeof window !== 'undefined';
  return isBrowser
    ? `/api/strategies/${strategyId}/subscribe`
    : `${API_URL}/api/v1/strategies/${strategyId}/subscribe`;
}

// --- 타입 ---

export interface SubscribeResponse {
  subscriptionId: number;
  strategyId: number;
  strategyName: string;
  tier: string;
  subscribedAt: string;
  message: string;
}

export interface SubscriptionSummary {
  subscriptionId: number;
  strategyId: number;
  strategyName: string;
  strategyCategory: string;
  isPremium: boolean;
  subscribedAt: string;
  alertEnabled: boolean;
  status: string;
}

export interface MySubscriptionsResponse {
  subscriptions: SubscriptionSummary[];
  total: number;
  activeCount: number;
}

// --- API 함수 ---

export async function subscribeStrategy(
  strategyId: number,
  token: string,
): Promise<SubscribeResponse> {
  const res = await fetch(getStrategySubscribeUrl(strategyId), {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `구독 요청 실패 (${res.status})`);
  }
  return res.json();
}

export async function unsubscribeStrategy(strategyId: number, token: string): Promise<void> {
  const res = await fetch(getStrategySubscribeUrl(strategyId), {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `구독 취소 실패 (${res.status})`);
  }
}

export async function getMySubscriptions(token: string): Promise<MySubscriptionsResponse> {
  const res = await fetch(getSubscriptionsUrl(), {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || '구독 목록 조회 실패');
  }
  return res.json();
}

export async function updateSubscriptionAlert(
  subscriptionId: number,
  alertEnabled: boolean,
  token: string,
): Promise<void> {
  const isBrowser = typeof window !== 'undefined';
  const url = isBrowser
    ? `/api/subscriptions/${subscriptionId}/alert`
    : `${API_URL}/api/v1/subscriptions/${subscriptionId}/alert`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: getJsonHeaders(token),
    body: JSON.stringify({ alertEnabled }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || '알림 설정 변경 실패');
  }
}
