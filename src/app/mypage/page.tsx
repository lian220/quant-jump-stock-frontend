'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { saveAuthReturnUrl } from '@/lib/onboarding';
import { getPreferences, type PreferencesData } from '@/lib/api/preferences';
import { PageSEO } from '@/components/seo';
import { BrokerAccountSection } from '@/components/mypage/BrokerAccountSection';
import { ProfileSection } from '@/components/mypage/ProfileSection';
import { SubscriptionsSection } from '@/components/mypage/SubscriptionsSection';
import { NotificationPrefsSection } from '@/components/mypage/NotificationPrefsSection';
import { InvestmentPreferencesSection } from '@/components/mypage/InvestmentPreferencesSection';
import { RecommendedStrategiesSection } from '@/components/mypage/RecommendedStrategiesSection';
import { AccountManagementSection } from '@/components/mypage/AccountManagementSection';

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState<PreferencesData | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      saveAuthReturnUrl('/mypage');
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    getPreferences()
      .then((prefs) => {
        if (mounted) setPreferences(prefs);
      })
      .finally(() => {
        if (mounted) setPrefsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <PageSEO
        title="마이페이지 - Alpha Foundry"
        description="내 계정 정보, 구독 전략, 투자 성향을 관리하세요."
      />
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white text-center">마이페이지</h1>

        <ProfileSection />
        <BrokerAccountSection userId={user.userId} />
        <SubscriptionsSection />
        <NotificationPrefsSection />
        <InvestmentPreferencesSection preferences={preferences} loading={prefsLoading} />
        {preferences && <RecommendedStrategiesSection preferences={preferences} />}
        <AccountManagementSection />
      </div>
    </div>
  );
}
