'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCategoryLabel } from '@/lib/strategy-helpers';
import type { Strategy } from '@/types/strategy';

interface Props {
  featuredStrategies: Strategy[];
  isLoading: boolean;
}

export function HomeStrategiesPreview({ featuredStrategies, isLoading }: Props) {
  return (
    <div className="mb-8 md:mb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 md:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">
            인기 투자 전략
          </h2>
          <p className="text-sm text-slate-400">
            과거 데이터로 미리 테스트된 투자 방법을 구독하세요
          </p>
        </div>
        <Link href="/strategies">
          <Button
            variant="outline"
            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 h-10 w-full sm:w-auto"
          >
            모든 전략 보기 →
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-slate-700 rounded mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : featuredStrategies.length > 0 ? (
        <div className="strategy-grid grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {featuredStrategies.map((strategy) => (
            <Link key={strategy.id} href={`/strategies/${strategy.id}`}>
              <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-all h-full">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      className={`
                        ${strategy.category === 'value' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : ''}
                        ${strategy.category === 'momentum' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
                        ${strategy.category === 'asset_allocation' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                        ${strategy.category === 'quant_composite' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : ''}
                        ${strategy.category === 'seasonal' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : ''}
                        ${strategy.category === 'ml_prediction' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : ''}
                      `}
                    >
                      {getCategoryLabel(strategy.category)}
                    </Badge>
                    {strategy.isPremium && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        프리미엄
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-white">{strategy.name}</CardTitle>
                  <CardDescription className="text-slate-400 line-clamp-2">
                    {strategy.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-slate-400">연평균 수익률</p>
                      <p
                        className={`font-semibold ${
                          parseFloat(String(strategy.annualReturn)) < 0
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {strategy.annualReturn}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">안정성</p>
                      <p className="text-cyan-400 font-semibold">
                        {strategy.sharpeRatio === 'N/A' || strategy.sharpeRatio == null
                          ? '측정 중'
                          : Number(strategy.sharpeRatio) >= 2
                            ? '높음'
                            : Number(strategy.sharpeRatio) >= 1
                              ? '보통'
                              : '낮음'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">구독자</p>
                      <p className="text-slate-300 font-semibold">
                        {strategy.subscribers.toLocaleString()}명
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">평점</p>
                      <p className="text-yellow-400 font-semibold">⭐ {strategy.rating}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6 text-center text-slate-400">
            전략을 불러오는데 실패했습니다
          </CardContent>
        </Card>
      )}
    </div>
  );
}
