'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp, signInWithNaver } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(userId.trim(), password);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId.trim() || !email.trim() || !password.trim()) {
      setError('아이디, 이메일, 비밀번호는 필수입니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(userId.trim(), email.trim(), password, name.trim() || undefined);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSignupSuccess(true);
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleNaverLogin = async () => {
    setError(null);
    const result = await signInWithNaver();
    if (result.error) {
      setError(result.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Alpha Foundry
            </h1>
          </Link>
          <p className="text-slate-400 text-sm">AI 기반 스마트 투자 플랫폼</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            {/* 탭 전환 */}
            <div className="flex mb-6 bg-slate-700/30 rounded-lg p-1">
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === 'login'
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                로그인
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSignupSuccess(false);
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === 'signup'
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                회원가입
              </button>
            </div>

            {/* 성공 메시지 */}
            {signupSuccess && mode === 'login' && (
              <Alert className="mb-4 border-emerald-500/50 bg-emerald-500/10">
                <AlertDescription className="text-emerald-400 text-sm">
                  회원가입이 완료되었습니다. 로그인해주세요.
                </AlertDescription>
              </Alert>
            )}

            {/* 에러 메시지 */}
            {error && (
              <Alert className="mb-4 border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-red-400 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* 로그인 폼 */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">아이디</label>
                  <Input
                    type="text"
                    placeholder="아이디를 입력하세요"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">비밀번호</label>
                  <Input
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? '로그인 중...' : '로그인'}
                </Button>
              </form>
            )}

            {/* 회원가입 폼 */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">
                    아이디 <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="아이디를 입력하세요"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">
                    이메일 <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">이름 (선택)</label>
                  <Input
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">
                    비밀번호 <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="6자 이상 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">
                    비밀번호 확인 <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? '가입 처리 중...' : '회원가입'}
                </Button>
              </form>
            )}

            {/* 구분선 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-800/50 px-3 text-sm text-slate-500">또는</span>
              </div>
            </div>

            {/* 네이버 로그인 */}
            <button
              onClick={handleNaverLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#03C75A' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"
                />
              </svg>
              네이버로 로그인
            </button>

            {/* 하단 안내 */}
            <p className="text-center text-xs text-slate-500 mt-6">
              로그인 시{' '}
              <Link href="/terms" className="text-slate-400 hover:text-emerald-400 underline">
                이용약관
              </Link>{' '}
              및{' '}
              <Link href="/privacy" className="text-slate-400 hover:text-emerald-400 underline">
                개인정보처리방침
              </Link>
              에 동의하는 것으로 간주됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
