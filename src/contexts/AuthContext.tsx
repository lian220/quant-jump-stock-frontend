'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, AuthUser, LoginResponse, SignUpResponse } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 백엔드 API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

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
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data: LoginResponse = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            setToken(null);
            setUser(null);
          }
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

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        return { error: data.message || data.error || '로그인에 실패했습니다' };
      }

      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        return {};
      }

      return { error: data.message || data.error || '로그인에 실패했습니다' };
    } catch (error) {
      console.error('로그인 오류:', error);
      return { error: '서버 연결에 실패했습니다' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userId: string, email: string, password: string, name?: string) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, email, password, name }),
      });

      const data: SignUpResponse = await response.json();

      if (!response.ok) {
        return { error: data.message || data.error || '회원가입에 실패했습니다' };
      }

      if (data.success) {
        return {};
      }

      return { error: data.message || data.error || '회원가입에 실패했습니다' };
    } catch (error) {
      console.error('회원가입 오류:', error);
      return { error: '서버 연결에 실패했습니다' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (token) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || '비밀번호 재설정에 실패했습니다' };
      }

      return {};
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      return { error: '서버 연결에 실패했습니다' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // 현재 URL을 콜백 URL로 저장
      const callbackUrl = `${window.location.origin}/auth/callback`;
      localStorage.setItem('auth_callback_url', window.location.href);

      // 백엔드 OAuth 엔드포인트로 리다이렉트
      window.location.href = `${API_BASE_URL}/api/v1/auth/google?redirect_uri=${encodeURIComponent(callbackUrl)}`;
      return {};
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      return { error: 'Google 로그인에 실패했습니다' };
    }
  };

  const signInWithNaver = async () => {
    try {
      // 현재 URL을 콜백 URL로 저장
      const callbackUrl = `${window.location.origin}/auth/callback`;
      localStorage.setItem('auth_callback_url', window.location.href);

      // 백엔드 OAuth 엔드포인트로 리다이렉트
      window.location.href = `${API_BASE_URL}/api/v1/auth/naver?redirect_uri=${encodeURIComponent(callbackUrl)}`;
      return {};
    } catch (error) {
      console.error('네이버 로그인 오류:', error);
      return { error: '네이버 로그인에 실패했습니다' };
    }
  };

  // OAuth 콜백 처리 (URL에서 토큰 추출)
  useEffect(() => {
    const handleOAuthCallback = () => {
      if (typeof window === 'undefined') return;

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth 오류:', error);
        // URL 파라미터 제거
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (token) {
        setToken(token);
        // 사용자 정보 가져오기
        fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json())
          .then((data: LoginResponse) => {
            if (data.success && data.user) {
              setUser(data.user);
            }
          })
          .catch((err) => {
            console.error('사용자 정보 조회 오류:', err);
          });

        // URL 파라미터 제거
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
