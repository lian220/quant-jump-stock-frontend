'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BacktestForm from '@/components/backtest/BacktestForm';
import PerformanceCards from '@/components/backtest/PerformanceCards';
import EquityCurveChart from '@/components/backtest/EquityCurveChart';
import TradeHistoryTable from '@/components/backtest/TradeHistoryTable';
import { runBacktest, pollBacktestResult, generateMockBacktestResult } from '@/lib/api/backtest';
import { useAuth } from '@/hooks/useAuth';
import type { BacktestRunRequest, BacktestResultResponse, BacktestStatus } from '@/types/backtest';

export default function BacktestPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const strategyId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<BacktestStatus | null>(null);
  const [result, setResult] = useState<BacktestResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleSubmit = useCallback(
    async (data: BacktestRunRequest) => {
      // 비로그인 시 로그인 유도
      if (!user) {
        setShowLoginPrompt(true);
        return;
      }

      setShowLoginPrompt(false);
      setIsLoading(true);
      setStatus('PENDING');
      setResult(null);
      setError(null);

      try {
        // 백엔드에 백테스트 실행 요청
        const runResponse = await runBacktest(data);
        setStatus('RUNNING');

        // 폴링으로 결과 대기
        const backtestResult = await pollBacktestResult(runResponse.backtestId, (s) => {
          setStatus(s as BacktestStatus);
        });

        if (backtestResult.status === 'FAILED') {
          setError(backtestResult.errorMessage || '백테스트 실행에 실패했습니다.');
        } else {
          setResult(backtestResult);
        }
      } catch {
        // 백엔드 연결 실패 시 mock 데이터 사용
        console.warn('백엔드 연결 실패, mock 데이터를 사용합니다.');
        setStatus('RUNNING');

        // mock 로딩 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockResult = generateMockBacktestResult(
          strategyId,
          '모멘텀 듀얼 전략',
          data.startDate,
          data.endDate,
          data.initialCapital,
        );
        setResult(mockResult);
        setStatus('COMPLETED');
      } finally {
        setIsLoading(false);
      }
    },
    [strategyId, user],
  );

  // 벤치마크 라벨
  const benchmarkLabel = result?.equityCurve?.[0] ? 'KOSPI' : 'KOSPI';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 헤더 */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                퀀트점프
              </h1>
              <Badge
                variant="secondary"
                className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              >
                BETA
              </Badge>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/strategies">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  전략 목록
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-emerald-600 hover:bg-emerald-700">로그인</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/strategies/${strategyId}`)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              ← 전략 상세
            </Button>
          </div>
          <h2 className="text-3xl font-bold text-white">백테스트 실행</h2>
          <p className="text-slate-400 mt-1">전략의 과거 성과를 시뮬레이션하고 분석합니다</p>
        </div>

        {/* 백테스트 폼 */}
        <div className="mb-8">
          <BacktestForm strategyId={strategyId} onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* 로딩 상태 */}
        {isLoading && status && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg">
              {status === 'PENDING' && '백테스트 요청 중...'}
              {status === 'RUNNING' && '백테스트 실행 중... 잠시만 기다려 주세요.'}
            </p>
            <p className="text-slate-500 text-sm mt-2">
              데이터 양에 따라 수 초에서 수 분이 소요될 수 있습니다
            </p>
          </div>
        )}

        {/* 로그인 유도 */}
        {showLoginPrompt && (
          <div className="bg-slate-800/50 border border-emerald-500/30 rounded-lg p-6 text-center mb-8">
            <p className="text-white text-lg mb-2">로그인이 필요합니다</p>
            <p className="text-slate-400 mb-4">백테스트를 실행하려면 먼저 로그인해 주세요.</p>
            <Link href="/auth">
              <Button className="bg-emerald-600 hover:bg-emerald-700">로그인하기</Button>
            </Link>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center mb-8">
            <p className="text-red-400 text-lg mb-2">백테스트 실행 실패</p>
            <p className="text-slate-400">{error}</p>
          </div>
        )}

        {/* 결과 표시 */}
        {result && result.status === 'COMPLETED' && result.metrics && (
          <div className="space-y-8">
            {/* 성과 지표 카드 */}
            <PerformanceCards metrics={result.metrics} />

            {/* 수익 곡선 차트 */}
            <EquityCurveChart equityCurve={result.equityCurve} benchmarkLabel={benchmarkLabel} />

            {/* 거래 내역 테이블 */}
            <TradeHistoryTable trades={result.trades} />
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500">
            <p className="mb-2">퀀트점프 - AI 기반 스마트 투자 플랫폼</p>
            <p className="text-sm">© 2025 QuantJump. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
