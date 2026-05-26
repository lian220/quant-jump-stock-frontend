'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStrategies } from '@/lib/api/strategies';
import type { PreferencesData } from '@/lib/api/preferences';
import type { Strategy, RiskLevel } from '@/types/strategy';
import { getRiskColor, getRiskLabel, getCategoryLabel } from '@/lib/strategy-helpers';

interface Props {
  preferences: PreferencesData;
}

export function RecommendedStrategiesSection({ preferences }: Props) {
  const [recommendedStrategies, setRecommendedStrategies] = useState<Strategy[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState(false);

  useEffect(() => {
    if (!preferences.onboardingCompleted) return;
    const firstCategory = preferences.investmentCategories?.[0];
    if (!firstCategory) return;

    setStrategiesLoading(true);
    const sortMap: Record<string, 'cagr' | 'subscribers'> = {
      high: 'cagr',
      low: 'subscribers',
      medium: 'subscribers',
    };
    const sortBy = sortMap[preferences.riskTolerance ?? 'medium'] ?? 'subscribers';

    getStrategies({ category: firstCategory, sortBy, page: 0, size: 4 })
      .then((res) => {
        const risk = preferences.riskTolerance as RiskLevel | undefined;
        if (risk) {
          const matched = res.strategies.filter((s) => s.riskLevel === risk);
          const others = res.strategies.filter((s) => s.riskLevel !== risk);
          setRecommendedStrategies([...matched, ...others].slice(0, 4));
        } else {
          setRecommendedStrategies(res.strategies.slice(0, 4));
        }
      })
      .catch((err) => console.error('추천 전략 로드 실패:', err))
      .finally(() => setStrategiesLoading(false));
  }, [preferences]);

  if (!preferences.onboardingCompleted) return null;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-white">내 성향 맞춤 전략</CardTitle>
        <Link
          href={`/strategies?category=${preferences.investmentCategories?.[0] ?? ''}&risk=${preferences.riskTolerance ?? ''}`}
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-400 hover:text-emerald-300 text-xs"
          >
            더보기
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {strategiesLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-slate-700/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recommendedStrategies.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">아직 추천할 전략이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {recommendedStrategies.map((strategy) => (
              <Link key={strategy.id} href={`/strategies/${strategy.id}`} className="block">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{strategy.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                        {getCategoryLabel(strategy.category)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs border-slate-600 ${getRiskColor(strategy.riskLevel)}`}
                      >
                        {getRiskLabel(strategy.riskLevel)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-emerald-400 text-sm font-semibold">
                      {strategy.annualReturn}
                    </p>
                    <p className="text-slate-500 text-xs">연수익률</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
