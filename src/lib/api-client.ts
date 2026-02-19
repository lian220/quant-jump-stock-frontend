import axios from 'axios';

/**
 * API 클라이언트 (표준 방식)
 *
 * 서버 사이드: Backend 직접 호출
 * 클라이언트 사이드: Same-Origin (프록시 자동 처리)
 */

// 서버 사이드 전용 API 클라이언트
export const serverApi = axios.create({
  baseURL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 클라이언트 사이드 전용 API 클라이언트 (Same-Origin)
export const clientApi = axios.create({
  baseURL: '', // Same-Origin (Next.js API Routes 사용)
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 범용 API 클라이언트 (자동 선택) - 함수로 변경하여 런타임에 평가
export const getApi = () => (typeof window === 'undefined' ? serverApi : clientApi);

// Request Interceptor (토큰 자동 추가) - clientApi에 적용
clientApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 401 리다이렉트에서 제외할 경로 (자체적으로 401을 처리하는 엔드포인트)
const AUTH_SILENT_PATHS = ['/api/auth/me', '/api/auth/login', '/api/auth/signup'];

// Response Interceptor (에러 처리) - clientApi에 적용
clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestPath = error.config?.url || '';
      const isSilent = AUTH_SILENT_PATHS.some((p) => requestPath.startsWith(p));

      // 세션 검증·로그인 요청의 401은 호출자가 직접 처리 (AuthContext)
      // 그 외 API 401만 로그인 페이지로 리다이렉트
      if (!isSilent && typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        localStorage.removeItem('auth_token');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  },
);

// 기본 export는 clientApi로 (브라우저에서 주로 사용)
export default clientApi;
