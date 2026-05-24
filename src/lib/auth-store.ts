'use client';

import { useSyncExternalStore } from 'react';

/**
 * Module-level access token store.
 *
 * Phase 1A 보안 PRE Phase A (Task 12 본 구현 후속):
 * - access token 을 메모리(이 모듈)에만 보관. localStorage 미사용 → XSS 노출 면적 축소
 * - axios interceptor 등 React 트리 밖 코드에서도 hook 없이 접근 가능 (`getAuthToken`/`setAuthToken`)
 * - React 컴포넌트는 `useAuthToken()` 으로 reactivity 확보 (useSyncExternalStore)
 * - 새로고침 시: AuthProvider 가 마운트 시 /api/auth/refresh 호출 → setAuthToken
 *
 * Zustand 등 외부 의존성 없이 React 19 내장 API 만으로 구현.
 */
let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function getAuthToken(): string | null {
  return accessToken;
}

export function setAuthToken(token: string | null): void {
  if (accessToken === token) return;
  accessToken = token;
  listeners.forEach((fn) => fn());
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * React hook — access token 변경 시 컴포넌트 리렌더링.
 * SSR 안전: 서버에서는 null 반환.
 */
export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getAuthToken, () => null);
}
