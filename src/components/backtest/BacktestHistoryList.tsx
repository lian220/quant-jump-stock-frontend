'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUniverseLabel } from '@/lib/strategy-helpers';

interface BacktestHistoryItem {
  id: string;
  strategyId: number;
  strategyName: string | null;
  status: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalValue: number | null;
  totalReturn: number | null;
  cagr: number | null;
  mdd: number | null;
  sharpeRatio: number | null;
  universeType: string | null;
  backtestType: string | null;
  benchmark: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface BacktestHistoryListProps {
  strategyId: string;
}

export default function BacktestHistoryList({ strategyId }: BacktestHistoryListProps) {
  const [history, setHistory] = useState<BacktestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const url = `/api/backtest?strategyId=${strategyId}&size=10&sort=createdAt,desc`;
        const token = localStorage.getItem('auth_token');

        const response = await fetch(url, {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          const userCustom = (data.content || []).filter(
            (item: BacktestHistoryItem) => item.backtestType !== 'CANONICAL',
          );
          setHistory(userCustom);
        }
      } catch (err) {
        console.error('백테스트 히스토리 조회 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [strategyId]);

  // 요약 통계 계산 (완료된 백테스트 2건 이상일 때만 표시)
  const summary = useMemo(() => {
    const completed = history.filter((item) => item.status === 'COMPLETED');
    if (completed.length < 2) return null;

    const cagrs = completed.map((i) => i.cagr).filter((v): v is number => v != null);
    const mdds = completed.map((i) => i.mdd).filter((v): v is number => v != null);
    const sharpes = completed.map((i) => i.sharpeRatio).filter((v): v is number => v != null);

    return {
      count: completed.length,
      bestCagr: cagrs.length > 0 ? Math.max(...cagrs) : null,
      worstMdd: mdds.length > 0 ? Math.min(...mdds) : null,
      avgSharpe: sharpes.length > 0 ? sharpes.reduce((a, b) => a + b, 0) / sharpes.length : null,
      cagrRange: cagrs.length > 0 ? ([Math.min(...cagrs), Math.max(...cagrs)] as const) : null,
    };
  }, [history]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-3"></div>
        <p className="text-slate-500 text-sm">백테스트 기록을 불러오는 중...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-10">
          <p className="text-slate-500 text-center">아직 실행한 커스텀 백테스트가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 요약 대시보드 (2건 이상) */}
      {summary && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">백테스트 요약</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              최근 {summary.count}회 커스텀 백테스트 결과 요약
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-400 mb-1">최고 CAGR</p>
                <p className="text-lg font-bold text-emerald-400">
                  {summary.bestCagr != null
                    ? `${summary.bestCagr >= 0 ? '+' : ''}${summary.bestCagr.toFixed(1)}%`
                    : '-'}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-400 mb-1">최저 MDD</p>
                <p className="text-lg font-bold text-red-400">
                  {summary.worstMdd != null ? `${summary.worstMdd.toFixed(1)}%` : '-'}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-400 mb-1">평균 샤프</p>
                <p className="text-lg font-bold text-purple-400">
                  {summary.avgSharpe != null ? summary.avgSharpe.toFixed(2) : '-'}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-400 mb-1">CAGR 범위</p>
                <p className="text-sm font-bold text-cyan-400">
                  {summary.cagrRange
                    ? `${summary.cagrRange[0].toFixed(1)}% ~ ${summary.cagrRange[1].toFixed(1)}%`
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 히스토리 목록 */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">이전 백테스트 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-slate-400">
                      {item.startDate} ~ {item.endDate}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={`text-xs ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : item.status === 'FAILED'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {item.status === 'COMPLETED'
                          ? '완료'
                          : item.status === 'FAILED'
                            ? '실패'
                            : '진행중'}
                      </Badge>
                      {item.universeType && (
                        <span className="text-xs text-slate-500">
                          {getUniverseLabel(item.universeType)}
                        </span>
                      )}
                    </div>
                    {/* 설정 요약: 자본금 · 벤치마크 */}
                    <p className="text-xs text-slate-500 mt-1">
                      {(item.initialCapital / 10000).toLocaleString()}만원
                      {item.benchmark && ` · ${item.benchmark}`}
                    </p>
                  </div>
                </div>
                {item.status === 'COMPLETED' && (
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs text-slate-500">CAGR</p>
                      <p
                        className={`text-sm font-semibold ${
                          (item.cagr ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {item.cagr != null
                          ? `${item.cagr >= 0 ? '+' : ''}${item.cagr.toFixed(1)}%`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">MDD</p>
                      <p className="text-sm font-semibold text-red-400">
                        {item.mdd != null ? `${item.mdd.toFixed(1)}%` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">샤프</p>
                      <p className="text-sm font-semibold text-purple-400">
                        {item.sharpeRatio != null ? item.sharpeRatio.toFixed(2) : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
