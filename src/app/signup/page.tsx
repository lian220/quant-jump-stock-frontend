'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { getPostLoginRedirect, isOnboardingCompleted } from '@/lib/onboarding';
import { trackEvent } from '@/lib/analytics';

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push(getPostLoginRedirect());
    }
  }, [loading, user, router]);

  useEffect(() => {
    trackEvent('signup_start', {
      source: 'signup_page_view',
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-16">
      <SignUpForm
        onSuccess={() => {
          // 자동 로그인됨 → 온보딩 or 홈으로 이동
          router.push(isOnboardingCompleted() ? '/' : '/onboarding');
        }}
        onSwitchToLogin={() => {
          router.push('/auth');
        }}
      />
    </div>
  );
}
