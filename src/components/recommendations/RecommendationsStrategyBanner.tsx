'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Strategy } from '@/types/strategy';

interface Props {
  popularStrategies: Strategy[];
}

export function RecommendationsStrategyBanner({ popularStrategies }: Props) {
  if (popularStrategies.length === 0) return null;

  return (
    <section className="mt-8 sm:mt-12">
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-semibold text-white mb-1">
                어떤 종목을 사야 할지 아직 모르겠다면?
              </p>
              <p className="text-xs text-slate-400">
                과거 데이터로 검증된 투자 전략 {popularStrategies.length}개를 둘러보세요 ·{' '}
                {popularStrategies.map((s) => s.name).join(', ')}
              </p>
            </div>
            <Link href="/strategies" className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
              >
                전략 보기 →
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
