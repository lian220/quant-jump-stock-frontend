'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPostLoginRedirect } from '@/lib/onboarding';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('로그인 처리 중...');
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      const ERROR_MESSAGES: Record<string, string> = {
        invalid_token: '유효하지 않은 토큰입니다.',
        token_expired: '토큰이 만료되었습니다.',
        unauthorized: '인증에 실패했습니다.',
        access_denied: '접근이 거부되었습니다.',
        server_error: '서버 오류가 발생했습니다.',
        oauth_error: 'OAuth 인증 중 오류가 발생했습니다.',
      };
      setStatus('error');
      setMessage(`로그인 실패: ${ERROR_MESSAGES[error] ?? '알 수 없는 오류가 발생했습니다.'}`);
      setTimeout(() => router.push('/auth'), 3000);
      return;
    }

    if (token) {
      localStorage.setItem('auth_token', token);

      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data.success && data.user) {
            setStatus('success');
            setMessage(`환영합니다, ${data.user.name || data.user.email || data.user.userId}님!`);
            setTimeout(() => router.push(getPostLoginRedirect()), 1500);
          } else {
            throw new Error('사용자 정보를 가져올 수 없습니다');
          }
        })
        .catch((err) => {
          console.error('인증 콜백 오류:', err);
          setStatus('error');
          setMessage('로그인 처리 중 오류가 발생했습니다');
          localStorage.removeItem('auth_token');
          setTimeout(() => router.push('/auth'), 3000);
        });
      return;
    }

    // URL에 토큰이 없으면 localStorage 확인 (AuthContext가 먼저 처리한 경우)
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setStatus('success');
      setMessage('로그인 성공! 잠시 후 이동합니다...');
      setTimeout(() => router.push(getPostLoginRedirect()), 1500);
      return;
    }

    setStatus('error');
    setMessage('인증 정보가 없습니다');
    setTimeout(() => router.push('/auth'), 3000);
  }, [router]);

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
