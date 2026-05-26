'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CATEGORY_OPTIONS, MARKET_OPTIONS, RISK_OPTIONS } from '@/lib/onboarding';
import type { PreferencesData } from '@/lib/api/preferences';

interface Props {
  preferences: PreferencesData | null;
  loading: boolean;
}

export function InvestmentPreferencesSection({ preferences, loading }: Props) {
  const categoryLabels = (preferences?.investmentCategories ?? [])
    .map((v) => CATEGORY_OPTIONS.find((o) => o.value === v))
    .filter(Boolean)
    .map((o) => `${o!.icon} ${o!.label}`);

  const marketLabels = (preferences?.markets ?? [])
    .map((v) => MARKET_OPTIONS.find((o) => o.value === v))
    .filter(Boolean)
    .map((o) => `${o!.icon} ${o!.label}`);

  const riskLabel = RISK_OPTIONS.find((o) => o.value === preferences?.riskTolerance);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-white">내 투자 성향</CardTitle>
        {preferences?.onboardingCompleted && (
          <Link href="/onboarding">
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-400 hover:text-emerald-300 text-xs"
            >
              다시 설정
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-slate-400 text-sm">로딩 중...</p>
        ) : preferences && preferences.onboardingCompleted ? (
          <div className="space-y-4">
            <div className="flex justify-between items-start py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">투자 스타일</span>
              <span className="text-white text-sm font-medium text-right">
                {categoryLabels.join(', ') || '-'}
              </span>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">관심 시장</span>
              <span className="text-white text-sm font-medium text-right">
                {marketLabels.join(', ') || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 text-sm">위험 성향</span>
              <span className="text-white text-sm font-medium">
                {riskLabel ? `${riskLabel.icon} ${riskLabel.label}` : '-'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm mb-3">투자 성향을 설정해보세요</p>
            <Link href="/onboarding">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
              >
                성향 설정하기
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
