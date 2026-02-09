'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    const code = searchParams.get('code');
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    console.log(
      'Callback received - code:',
      code ? 'exists' : 'none',
      'token:',
      token ? 'exists' : 'none',
      'error:',
      error,
    );

    if (error) {
      setStatus('error');
      setMessage(`로그인 실패: ${error}`);
      setTimeout(() => router.push('/auth'), 3000);
      return;
    }

    // OAuth code를 받은 경우 (Client-side OAuth)
    if (code) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';
      console.log('Exchanging code for token with:', apiUrl);

      fetch(`${apiUrl}/api/v1/auth/naver/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
        .then((res) => {
          console.log('Token exchange response status:', res.status);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log('Token exchange data:', data);
          if (data.success && data.token && data.user) {
            localStorage.setItem('auth_token', data.token);
            setStatus('success');
            setMessage(`환영합니다, ${data.user.name || data.user.email || data.user.userId}님!`);
            setTimeout(() => router.push('/'), 1500);
          } else {
            throw new Error(data.message || '로그인 처리 실패');
          }
        })
        .catch((err) => {
          console.error('OAuth code exchange error:', err);
          setStatus('error');
          setMessage(`로그인 처리 중 오류: ${err.message}`);
          setTimeout(() => router.push('/auth'), 3000);
        });
      return;
    }

    // 토큰을 직접 받은 경우 (Server-side OAuth - 하위 호환성)
    if (token) {
      localStorage.setItem('auth_token', token);
      console.log('Token saved to localStorage');

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
      return;
    }

    // code도 token도 없는 경우
    setStatus('error');
    setMessage('인증 정보가 없습니다');
    setTimeout(() => router.push('/auth'), 3000);
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
