'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const router = useRouter();
  const { user, loading: authLoading, signIn, signInWithNaver } = useAuth();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(userId, password);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
    // 성공 시 useEffect에서 리다이렉트 처리
  };

  const handleNaverLogin = async () => {
    setError('');
    const result = await signInWithNaver();
    if (result.error) {
      setError(result.error);
    }
  };

  // 로딩 중
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  // 이미 로그인된 경우 빈 화면 (리다이렉트 대기)
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-blue-500" />
          <h1 className="mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
            Alpha Foundry
          </h1>
          <p className="text-slate-400">AI 기반 스마트 투자 플랫폼</p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-2xl font-bold text-white">로그인</h2>
            <p className="text-sm text-slate-400">계정에 로그인하여 투자 분석을 시작하세요</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-md bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* ID Input */}
            <div className="mb-4">
              <label className="mb-2 block text-sm text-slate-300">아이디</label>
              <input
                type="text"
                placeholder="아이디를 입력하세요"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-md border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
              />
            </div>

            {/* Password Input */}
            <div className="mb-6">
              <label className="mb-2 block text-sm text-slate-300">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-md border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-800 px-2 text-sm text-slate-500">또는</span>
            </div>
          </div>

          {/* Naver Login Button */}
          <button
            onClick={handleNaverLogin}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#03C75A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#02b350] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"
              />
            </svg>
            네이버로 로그인
          </button>

          {/* Sign Up Link */}
          <p className="mt-4 text-center text-sm text-slate-400">
            계정이 없으신가요?{' '}
            <a href="#" className="font-medium text-emerald-400 hover:text-emerald-300">
              회원가입
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
