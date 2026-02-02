'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    console.log('Callback received - token:', token ? 'exists' : 'none', 'error:', error);

    if (error) {
      setStatus('error');
      setMessage(`로그인 실패: ${error}`);
      setTimeout(() => router.push('/auth'), 3000);
      return;
    }

    if (token) {
      // 토큰을 localStorage에 저장
      localStorage.setItem('auth_token', token);
      console.log('Token saved to localStorage');

      // 사용자 정보 가져오기
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';
      console.log('Fetching user info from:', apiUrl);

      fetch(`${apiUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then((res) => {
          console.log('Response status:', res.status);
          return res.json();
        })
        .then((data) => {
          console.log('User data:', data);
          if (data.success && data.user) {
            setStatus('success');
            setMessage(`환영합니다, ${data.user.name || data.user.email || data.user.userId}님!`);
            // 메인 페이지로 리다이렉트
            setTimeout(() => router.push('/'), 1500);
          } else {
            throw new Error('사용자 정보를 가져올 수 없습니다');
          }
        })
        .catch((err) => {
          console.error('Auth callback error:', err);
          setStatus('error');
          setMessage('로그인 처리 중 오류가 발생했습니다');
          localStorage.removeItem('auth_token');
          setTimeout(() => router.push('/auth'), 3000);
        });
    } else {
      setStatus('error');
      setMessage('토큰이 없습니다');
      setTimeout(() => router.push('/auth'), 3000);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
        )}
        {status === 'success' && <div className="text-emerald-500 text-5xl mb-4">✓</div>}
        {status === 'error' && <div className="text-red-500 text-5xl mb-4">✗</div>}
        <p
          className={`text-lg ${
            status === 'success'
              ? 'text-emerald-400'
              : status === 'error'
                ? 'text-red-400'
                : 'text-slate-300'
          }`}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">로딩 중...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
