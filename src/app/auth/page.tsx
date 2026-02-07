'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { LoginForm, SignUpForm } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { PageSEO } from '@/components/seo';
import { pageDefaults } from '@/lib/seo/config';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  // 이미 로그인된 경우 홈으로 리디렉션
  React.useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleAuthSuccess = () => {
    router.push('/');
  };

  if (user) {
    return <div>리디렉션 중...</div>;
  }

  return (
    <>
      {/* SEO 메타태그 */}
      <PageSEO
        title={pageDefaults.auth.title}
        description={pageDefaults.auth.description}
        keywords={pageDefaults.auth.keywords}
        ogImage="/images/og/auth.jpg"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center mb-8">
            <Image
              src="/main_logo.png"
              alt="Alpha Foundry Logo"
              width={64}
              height={64}
              className="rounded-2xl mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Alpha Foundry
            </h1>
            <p className="text-slate-400 mt-2">AI 기반 스마트 투자 플랫폼</p>
          </div>
          {isLogin ? (
            <LoginForm onSuccess={handleAuthSuccess} onSwitchToSignUp={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onSuccess={handleAuthSuccess} onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </>
  );
}
