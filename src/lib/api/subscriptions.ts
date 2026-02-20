const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

function getAuthHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function getJsonHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
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
  const res = await fetch(`${API_URL}/api/v1/strategies/${strategyId}/subscribe`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `구독 요청 실패 (${res.status})`);
  }
  return res.json();
}

export async function unsubscribeStrategy(strategyId: number, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/strategies/${strategyId}/subscribe`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `구독 취소 실패 (${res.status})`);
  }
}

export async function getMySubscriptions(token: string): Promise<MySubscriptionsResponse> {
  const res = await fetch(`${API_URL}/api/v1/subscriptions`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '구독 목록 조회 실패');
  }
  return res.json();
}

export async function updateSubscriptionAlert(
  subscriptionId: number,
  alertEnabled: boolean,
  token: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/subscriptions/${subscriptionId}/alert`, {
    method: 'PATCH',
    headers: getJsonHeaders(token),
    body: JSON.stringify({ alertEnabled }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '알림 설정 변경 실패');
  }
}
