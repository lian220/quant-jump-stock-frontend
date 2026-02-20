'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { getPostLoginRedirect, clearOnboardingState } from '@/lib/onboarding';
import { trackEvent } from '@/lib/analytics';

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const justSignedUpRef = useRef(false);

  useEffect(() => {
    if (!loading && user && !justSignedUpRef.current) {
      getPostLoginRedirect().then((redirect) => router.push(redirect));
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

  if (user && !justSignedUpRef.current) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-16">
      <SignUpForm
        onSuccess={() => {
          // 신규 가입 → 이전 유저의 localStorage 초기화 후 항상 온보딩으로
          justSignedUpRef.current = true;
          clearOnboardingState();
          router.push('/onboarding');
        }}
        onSwitchToLogin={() => {
          router.push('/auth');
        }}
      />
    </div>
  );
}
