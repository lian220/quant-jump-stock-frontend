'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPostLoginRedirect } from '@/lib/onboarding';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const provider = params.provider;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('소셜 로그인 처리 중...');
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const state = urlParams.get('state');

      // OAuth 오류 응답 처리
      if (error) {
        const ERROR_MESSAGES: Record<string, string> = {
          access_denied: '로그인을 취소했습니다.',
          server_error: '서버 오류가 발생했습니다.',
          temporarily_unavailable: '서비스가 일시적으로 사용 불가합니다.',
        };
        setStatus('error');
        setMessage(`로그인 실패: ${ERROR_MESSAGES[error] ?? '알 수 없는 오류가 발생했습니다.'}`);
        setTimeout(() => router.push('/auth'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('인증 코드가 없습니다');
        setTimeout(() => router.push('/auth'), 3000);
        return;
      }

      // state 검증 (CSRF 방지) - savedState 없어도 실패 처리
      const savedState = sessionStorage.getItem('oauth_state');
      if (!savedState || state !== savedState) {
        setStatus('error');
        setMessage('보안 검증에 실패했습니다. 다시 시도해주세요.');
        sessionStorage.removeItem('oauth_state');
        setTimeout(() => router.push('/auth'), 3000);
        return;
      }
      sessionStorage.removeItem('oauth_state');

      // redirectUri는 현재 페이지 기준으로 동적 생성
      const redirectUri =
        process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI ||
        `${window.location.origin}/auth/callback/${provider}`;

      try {
        // Backend에 code 전달 → JWT 수신
        const response = await fetch(`/api/auth/oauth/${provider}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri }),
        });

        const data = await response.json();

        if (!response.ok || !data.token) {
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        // JWT 저장
        localStorage.setItem('auth_token', data.token);

        // 사용자 정보 확인
        const meResponse = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${data.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!meResponse.ok) throw new Error(`HTTP ${meResponse.status}`);

        const meData = await meResponse.json();

        if (meData.success && meData.user) {
          setStatus('success');
          setMessage(
            `환영합니다, ${meData.user.name || meData.user.email || meData.user.userId}님!`,
          );
          const redirect = await getPostLoginRedirect();
          setTimeout(() => router.push(redirect), 1500);
        } else {
          throw new Error('사용자 정보를 가져올 수 없습니다');
        }
      } catch (err) {
        console.error(`${provider} OAuth 콜백 오류:`, err);
        setStatus('error');
        setMessage('로그인 처리 중 오류가 발생했습니다');
        localStorage.removeItem('auth_token');
        setTimeout(() => router.push('/auth'), 3000);
      }
    };

    handleCallback();
  }, [router, provider]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
        )}
        {status === 'success' && <div className="text-emerald-500 text-5xl mb-4">✓</div>}
        {status === 'error' && <div className="text-red-500 text-5xl mb-4">✗</div>}
        <h1
          className={`text-lg ${
            status === 'success'
              ? 'text-emerald-400'
              : status === 'error'
                ? 'text-red-400'
                : 'text-slate-300'
          }`}
        >
          {message}
        </h1>
      </div>
    </div>
  );
}
