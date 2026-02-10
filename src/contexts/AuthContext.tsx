'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, AuthUser, LoginResponse, SignUpResponse } from '@/types/auth';
import { clientApi as api } from '@/lib/api-client';

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

  // 토큰 저장/조회 헬퍼
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  };

  const setToken = (token: string | null) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  };

  // 초기 로드 시 토큰 검증
  useEffect(() => {
    const validateSession = async () => {
      const token = getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<LoginResponse>('/api/auth/me');

        if (response.data.success && response.data.user) {
          setUser(response.data.user);
        } else {
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('세션 검증 오류:', error);
        setToken(null);
        setUser(null);
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
        setToken(data.token);
        setUser(data.user);
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

  const signUp = async (userId: string, email: string, password: string, name?: string) => {
    try {
      setLoading(true);

      const response = await api.post<SignUpResponse>('/api/auth/signup', {
        userId,
        email,
        password,
        name,
      });

      const data = response.data;

      if (data.success) {
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
      setToken(null);
      setUser(null);
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

  const signInWithGoogle = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';
      localStorage.setItem('auth_callback_url', window.location.href);
      window.location.href = `${backendUrl}/api/v1/auth/oauth2/authorize/google`;
      return {};
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      return { error: 'Google 로그인에 실패했습니다' };
    }
  };

  const signInWithNaver = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';
      localStorage.setItem('auth_callback_url', window.location.href);
      window.location.href = `${backendUrl}/api/v1/auth/oauth2/authorize/naver`;
      return {};
    } catch (error) {
      console.error('네이버 로그인 오류:', error);
      return { error: '네이버 로그인에 실패했습니다' };
    }
  };

  // OAuth 콜백 처리 (/auth/callback 페이지에서는 callback 페이지가 직접 처리)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (typeof window === 'undefined') return;

      // /auth/callback 페이지에서는 callback 페이지가 직접 처리하므로 중복 방지
      if (window.location.pathname === '/auth/callback') return;

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth 오류:', error);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (token) {
        setToken(token);

        try {
          const response = await api.get<LoginResponse>('/api/auth/me');

          if (response.data.success && response.data.user) {
            setUser(response.data.user);
          }
        } catch (err) {
          console.error('사용자 정보 조회 오류:', err);
        }

        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleOAuthCallback();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    signInWithNaver,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
