import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearAuthToken, getAuthToken, setAuthToken } from '@/lib/auth-store';

/**
 * API 클라이언트 (Phase 1A 보안 PRE Phase A).
 *
 * - 서버 사이드: Backend 직접 호출 (Authorization 헤더 없음)
 * - 클라이언트 사이드: Same-Origin Next.js proxy 사용
 *   * Access token 은 메모리(auth-store) 에서 읽어 Authorization 헤더로 전달
 *   * Refresh token 은 httpOnly cookie 로 자동 전송 (withCredentials)
 *   * 401 응답 시 1회 한정 /api/auth/refresh 자동 호출 + 재시도
 *   * 동시 401 다발 시 singleton refresh promise 로 중복 호출 방지
 */

export const serverApi = axios.create({
  baseURL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const clientApi = axios.create({
  baseURL: '', // Same-Origin Next.js proxy
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // refresh cookie 자동 포함
});

export const getApi = () => (typeof window === 'undefined' ? serverApi : clientApi);

// Request Interceptor — auth-store 의 메모리 access token 을 Authorization 헤더로 첨부
clientApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 401 자체 처리하는 엔드포인트 (재발급 / 리다이렉트 대상에서 제외)
const AUTH_SILENT_PATHS = [
  '/api/auth/me',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/refresh',
];

// Singleton refresh promise — 동시 401 시 중복 refresh 방지
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken?: string };
    if (!data.accessToken) return null;
    setAuthToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

function getRefreshPromise(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Response Interceptor — 401 자동 재발급 + 1회 한정 재시도
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

clientApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isSilent = AUTH_SILENT_PATHS.some((p) => url.startsWith(p));

    if (status !== 401 || isSilent || !original || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    const newToken = await getRefreshPromise();
    if (!newToken) {
      clearAuthToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
      return Promise.reject(error);
    }

    // 재시도: 새 access token 으로 Authorization 헤더 교체
    original.headers = original.headers ?? {};
    (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
    return clientApi(original);
  },
);

export default clientApi;

/**
 * raw fetch 사용처 (lib/api/broker-account.ts 등) 가 401 시 자동 재발급 후 1회 재시도하는 헬퍼.
 *
 * axios clientApi 의 interceptor 와 같은 singleton refresh promise 를 공유하므로
 * 동시 401 다발 시 중복 refresh 호출 없음.
 *
 * 사용:
 *   const res = await fetchWithAutoRefresh(url, { headers: { Authorization: `Bearer ${token}` } });
 * 재시도 시 새 access token 으로 Authorization 헤더가 갱신됨. 호출자는 별도 처리 불필요.
 */
export async function fetchWithAutoRefresh(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  const newToken = await getRefreshPromise();
  if (!newToken) return res;

  // 새 access token 으로 Authorization 헤더 교체 (있던 자리면 갱신, 없으면 추가)
  const nextHeaders = new Headers(init.headers ?? {});
  nextHeaders.set('Authorization', `Bearer ${newToken}`);
  return fetch(input, { ...init, headers: nextHeaders });
}
