'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, AuthUser, LoginResponse, SignUpResponse } from '@/types/auth';
import { clientApi as api } from '@/lib/api-client';
import { saveAuthReturnUrl } from '@/lib/onboarding';
import { clearAuthToken, getAuthToken, setAuthToken } from '@/lib/auth-store';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 토큰 저장/조회 헬퍼 — 메모리 auth-store 위임 (Phase A).
  // 외부 모듈은 @/lib/auth-store 의 getAuthToken/setAuthToken 직접 사용 권장.
  const getToken = getAuthToken;

  // 초기 로드 시: 잔존 localStorage 정리 + refresh cookie 로 access token 재발급 시도
  useEffect(() => {
    const validateSession = async () => {
      // 마이그레이션: 기존 localStorage 잔여 토큰 일괄 삭제 (httpOnly refresh cookie 가 진실의 원천)
      if (typeof window !== 'undefined' && localStorage.getItem('auth_token')) {
        localStorage.removeItem('auth_token');
      }

      // refresh cookie 가 있으면 새 access token 발급 (없으면 401 → 비로그인 상태)
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (refreshRes.ok) {
          const refreshData = (await refreshRes.json()) as { accessToken?: string };
          if (refreshData.accessToken) {
            setAuthToken(refreshData.accessToken);
          }
        }
      } catch (e) {
        console.warn('초기 토큰 재발급 시도 실패 (비로그인 상태로 진행):', e);
      }

      if (!getAuthToken()) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<LoginResponse>('/api/auth/me');

        if (response.data.success && response.data.user) {
          setUser(response.data.user);
        } else {
          clearAuthToken();
          setUser(null);
        }
      } catch (err: unknown) {
        console.error('세션 검증 오류:', err);
        const status =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;

        if (status === 401 || status === 403) {
          // 인증 만료 → 토큰 삭제
          clearAuthToken();
          setUser(null);
          setError(null);
        } else if (status && status >= 500) {
          // 서버 에러 (500) → 토큰 유지, 에러 상태만 설정
          setError('서버에 일시적인 문제가 발생했습니다. 일부 기능이 제한될 수 있습니다.');
        } else {
          // 네트워크 에러 등 → 토큰 유지
          setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
        }
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  const signIn = async (userId: string, password: string) => {
    try {
      setLoading(true);

      const response = await api.post<LoginResponse>('/api/auth/login', {
        userId,
        password,
      });

      const data = response.data;

      if (data.success && data.token && data.user) {
        setAuthToken(data.token);
        setUser(data.user);
        setError(null);
        return {};
      }

      return { error: data.message || '로그인에 실패했습니다' };
    } catch (error: unknown) {
      console.error('로그인 오류:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      return {
        error: errorMessage || '서버 연결에 실패했습니다',
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    userId: string,
    email: string,
    password: string,
    name?: string,
    phone?: string,
  ) => {
    try {
      setLoading(true);

      const response = await api.post<SignUpResponse>('/api/auth/signup', {
        userId,
        email,
        password,
        name,
        phone,
      });

      const data = response.data;

      if (data.success) {
        // 자동 로그인: 토큰과 유저 정보가 있으면 바로 로그인 상태로 설정
        if (data.token && data.user) {
          setAuthToken(data.token);
          setUser(data.user);
          setError(null);
        }
        return {};
      }

      return { error: data.message || '회원가입에 실패했습니다' };
    } catch (error: unknown) {
      console.error('회원가입 오류:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      return {
        error: errorMessage || '서버 연결에 실패했습니다',
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (token) {
        await api.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
    } finally {
      clearAuthToken();
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await api.post('/api/auth/reset-password', { email });
      return {};
    } catch (error: unknown) {
      console.error('비밀번호 재설정 오류:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      return {
        error: errorMessage || '서버 연결에 실패했습니다',
      };
    }
  };

  // 구글 로그인 비활성화
  // const signInWithGoogle = async () => {
  //   try {
  //     localStorage.setItem('auth_callback_url', window.location.href);
  //     window.location.href = `${BACKEND_URL}/api/v1/auth/oauth2/authorize/google`;
  //     return {};
  //   } catch (error) {
  //     console.error('Google 로그인 오류:', error);
  //     return { error: 'Google 로그인에 실패했습니다' };
  //   }
  // };

  const updateProfile = async (data: { displayName?: string }) => {
    try {
      const response = await api.put('/api/user/profile', data);
      if (response.data.success) {
        // 로컬 user 상태 업데이트
        if (data.displayName && user) {
          setUser({ ...user, name: data.displayName });
        }
        return {};
      }
      return { error: response.data.message || '프로필 수정에 실패했습니다' };
    } catch (error: unknown) {
      console.error('프로필 수정 오류:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      return { error: errorMessage || '서버 연결에 실패했습니다' };
    }
  };

  const signInWithNaver = async () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
      if (!clientId) {
        return { error: '네이버 로그인 설정이 올바르지 않습니다' };
      }

      // /auth 페이지 자체가 아닌 경우에만 현재 URL을 returnUrl로 저장
      saveAuthReturnUrl(window.location.href);

      // CSRF 방지용 state 생성 및 저장 (암호학적으로 안전한 난수)
      const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      sessionStorage.setItem('oauth_state', state);

      const redirectUri =
        process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI ||
        `${window.location.origin}/auth/callback/naver`;

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
      });

      window.location.href = `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
      return {};
    } catch (error) {
      console.error('네이버 로그인 오류:', error);
      return { error: '네이버 로그인에 실패했습니다' };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    // signInWithGoogle, // 구글 로그인 비활성화
    signInWithNaver,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
