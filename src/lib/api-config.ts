/**
 * API 설정 중앙 관리
 *
 * 클라이언트 vs 서버 사이드 API URL 전략:
 * - 클라이언트: Next.js API Routes 사용 (Same-Origin, Mixed Content 방지)
 * - 서버: Backend 직접 호출 (프록시 불필요)
 */

/**
 * 서버 사이드 전용 (API Routes, Server Components)
 * Docker 내부 네트워크 또는 외부 IP 사용
 */
export const getServerApiUrl = (): string => {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';
};

/**
 * 클라이언트 사이드 전용 (브라우저)
 * Next.js API Routes를 통한 프록시 사용 (Mixed Content 방지)
 */
export const getClientApiUrl = (): string => {
  return typeof window !== 'undefined' ? '' : getServerApiUrl();
};

/**
 * 범용 API URL
 * 실행 환경에 따라 자동 선택
 */
export const getApiUrl = (): string => {
  return typeof window !== 'undefined' ? getClientApiUrl() : getServerApiUrl();
};

/**
 * API 엔드포인트 빌더
 */
export const apiEndpoints = {
  // Auth
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    resetPassword: '/api/auth/reset-password',
    // googleOAuth: '/api/auth/google', // 구글 로그인 비활성화
    naverOAuth: '/api/auth/naver',
    callback: '/auth/callback',
  },

  // Strategies
  strategies: {
    list: '/api/strategies',
    detail: (id: string | number) => `/api/strategies/${id}`,
    defaultStocks: (id: string | number) => `/api/strategies/${id}/default-stocks`,
  },

  // Stocks
  stocks: {
    list: '/api/stocks',
    detail: (id: string | number) => `/api/stocks/${id}`,
  },

  // Backtest
  backtest: {
    run: '/api/backtest/run',
    detail: (id: string | number) => `/api/backtest/${id}`,
  },

  // Benchmarks
  benchmarks: {
    series: '/api/benchmarks/series',
  },

  // Payments
  payments: {
    confirm: '/api/payments/confirm',
    naverReserve: '/api/payments/naver/reserve',
  },
} as const;

/**
 * Backend 직접 호출이 필요한 경우 (OAuth 리다이렉트 등)
 */
export const getBackendUrl = (): string => {
  if (typeof window !== 'undefined') {
    // 클라이언트: 환경 변수 또는 현재 도메인 기반
    return process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  }
  return getServerApiUrl();
};
