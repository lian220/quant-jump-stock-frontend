/**
 * 대시보드 API 클라이언트
 * 로그인 사용자의 대시보드 요약 데이터 조회
 */

import { API_URL } from './config';

function getDashboardUrl(): string {
  const isBrowser = typeof window !== 'undefined';
  return isBrowser ? '/api/dashboard' : `${API_URL}/api/v1/dashboard`;
}

// === 타입 정의 ===

export interface DashboardResponse {
  user: DashboardUser;
  subscriptions: DashboardSubscriptions;
  signals: DashboardSignals;
  market: DashboardMarket;
  aiUsage: DashboardAiUsage;
}

export interface DashboardUser {
  nickname: string | null;
  tier: string;
  joinDate: string;
}

export interface DashboardSubscriptions {
  count: number;
  maxCount: number;
  strategies: DashboardStrategy[];
}

export interface DashboardStrategy {
  id: number;
  name: string;
  description: string | null;
}

export interface DashboardSignals {
  unreadCount: number;
  todayCount: number;
  recent: DashboardNotification[];
}

export interface DashboardNotification {
  id: number;
  type: string;
  title: string;
  createdAt: string;
}

export interface DashboardMarket {
  indices: DashboardIndex[];
}

export interface DashboardIndex {
  symbol: string;
  name: string | null;
  price: number;
  changePercent: number | null;
}

export interface DashboardAiUsage {
  backtestUsed: number;
  backtestLimit: number;
  backtestRemaining: number;
}

// === API 함수 ===

export async function getDashboard(): Promise<DashboardResponse> {
  const url = getDashboardUrl();
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`대시보드 조회 실패: ${response.status}`);
  }

  return response.json();
}
