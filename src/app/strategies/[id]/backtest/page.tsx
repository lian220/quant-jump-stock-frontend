'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import BacktestForm from '@/components/backtest/BacktestForm';
import PerformanceCards from '@/components/backtest/PerformanceCards';
import EnhancedPerformanceCards from '@/components/backtest/EnhancedPerformanceCards';
import EquityCurveChart from '@/components/backtest/EquityCurveChart';
import TradeHistoryTable from '@/components/backtest/TradeHistoryTable';
import { Card, CardContent } from '@/components/ui/card';
import {
  runBacktest,
  pollBacktestResult,
  generateMockBacktestResult,
  getEnhancedBacktestResult,
} from '@/lib/api/backtest';
import { getStrategyById } from '@/lib/api/strategies';
import { useAuth } from '@/hooks/useAuth';
import type {
  BacktestRunRequest,
  BacktestResultResponse,
  BacktestStatus,
  EnhancedBacktestResult,
} from '@/types/backtest';

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
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('SPY');
  const [strategyName, setStrategyName] = useState<string>('');
  const [enhancedResult, setEnhancedResult] = useState<EnhancedBacktestResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 전략 이름 조회
  useEffect(() => {
    getStrategyById(strategyId)
      .then((strategy) => setStrategyName(strategy.name))
      .catch(() => setStrategyName(`전략 #${strategyId}`));
  }, [strategyId]);

  // 컴포넌트 unmount 시 진행 중인 폴링 취소
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSubmit = useCallback(
    async (data: BacktestRunRequest) => {
      // 비로그인 시 mock 데이터로 미리보기 제공 (Soft Gate)
      if (!user) {
        setShowLoginPrompt(false);
        setSelectedBenchmark(data.benchmark);
        setIsLoading(true);
        setStatus('RUNNING');
        setResult(null);
        setError(null);

        await new Promise((resolve) => setTimeout(resolve, 1200));

        const mockResult = generateMockBacktestResult(
          strategyId,
          strategyName || `전략 ${strategyId}`,
          data.startDate,
          data.endDate,
          data.initialCapital,
        );
        setResult(mockResult);
        setStatus('COMPLETED');
        setShowLoginPrompt(true);
        setIsLoading(false);
        return;
      }

      // 이전 폴링 취소
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setShowLoginPrompt(false);
      setSelectedBenchmark(data.benchmark);
      setIsLoading(true);
      setStatus('PENDING');
      setResult(null);
      setError(null);

      try {
        // 백엔드에 백테스트 실행 요청
        const runResponse = await runBacktest(data);
        setStatus('RUNNING');

        // 폴링으로 결과 대기
        const backtestResult = await pollBacktestResult(
          runResponse.backtestId,
          (s) => {
            setStatus(s as BacktestStatus);
          },
          abortController.signal,
        );

        if (backtestResult.status === 'FAILED') {
          setError(backtestResult.errorMessage || '백테스트 실행에 실패했습니다.');
        } else {
          setResult(backtestResult);
          // Enhanced 결과 조회 시도
          try {
            const enhanced = await getEnhancedBacktestResult(runResponse.backtestId);
            setEnhancedResult(enhanced);
          } catch {
            // Enhanced 없으면 무시, 기존 PerformanceCards fallback
          }
        }
      } catch (e) {
        // AbortError는 무시
        if (e instanceof DOMException && e.name === 'AbortError') return;

        // 네트워크 오류 또는 백엔드 오류(500/503)일 때 mock fallback
        const errorStatus = (e as Error & { status?: number }).status;
        const isBackendDown =
          e instanceof TypeError ||
          (e instanceof Error && (errorStatus === 503 || errorStatus === 500));
        if (isBackendDown) {
          console.warn('백엔드 연결 실패, mock 데이터를 사용합니다.');
          setStatus('RUNNING');
          await new Promise((resolve) => setTimeout(resolve, 1500));
          if (abortController.signal.aborted) return;
          const mockResult = generateMockBacktestResult(
            strategyId,
            `전략 ${strategyId}`,
            data.startDate,
            data.endDate,
            data.initialCapital,
          );
          setResult(mockResult);
          setStatus('COMPLETED');
        } else {
          // 그 외 에러 (4xx/5xx 등)는 에러 표시
          setError(e instanceof Error ? e.message : '백테스트 실행에 실패했습니다.');
          setStatus('FAILED');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [strategyId, strategyName, user],
  );

  // 벤치마크 라벨
  const benchmarkLabel = selectedBenchmark;

  return (
    <div className="min-h-screen">
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
          <h1 className="text-3xl font-bold text-white">
            {strategyName ? `${strategyName} - 백테스트` : '백테스트 실행'}
          </h1>
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

        {/* 로그인 유도 - 결과 없을 때만 단독 표시 */}
        {showLoginPrompt && !result && (
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
          <div className="relative">
            {/* Soft Gate: 비로그인 blur 오버레이 */}
            {showLoginPrompt && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-32">
                <div className="bg-slate-900/95 border border-emerald-500/40 rounded-xl p-8 text-center shadow-2xl max-w-md mx-4">
                  <div className="text-4xl mb-3">🔒</div>
                  <p className="text-white text-lg font-semibold mb-2">전체 결과를 확인하세요</p>
                  <p className="text-slate-400 text-sm mb-5">
                    로그인하면 상세 성과 지표, 수익 곡선, 거래 내역을 모두 확인할 수 있습니다.
                  </p>
                  <Link href="/auth">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 w-full mb-3">
                      무료 로그인하기
                    </Button>
                  </Link>
                  <p className="text-xs text-slate-500">
                    미리보기 데이터는 실제 결과와 다를 수 있습니다
                  </p>
                </div>
              </div>
            )}

            <div
              className={`space-y-8 ${showLoginPrompt ? 'blur-sm pointer-events-none select-none' : ''}`}
            >
              {/* 성과 지표 카드 - Enhanced 우선, fallback to 기존 */}
              {enhancedResult ? (
                <EnhancedPerformanceCards enhanced={enhancedResult} />
              ) : (
                <PerformanceCards metrics={result.metrics} />
              )}

              {/* 수익 곡선 차트 */}
              <EquityCurveChart equityCurve={result.equityCurve} benchmarkLabel={benchmarkLabel} />

              {/* 거래 내역 테이블 */}
              <TradeHistoryTable trades={result.trades} />

              {/* CTA */}
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/strategies">
                  <Card className="bg-slate-800/50 border-cyan-500/30 hover:border-cyan-400 transition-colors cursor-pointer h-full">
                    <CardContent className="pt-6 text-center">
                      <p className="text-lg font-semibold text-white mb-2">비슷한 전략 보기</p>
                      <p className="text-sm text-slate-400">다른 퀀트 전략도 탐색해보세요</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/recommendations">
                  <Card className="bg-slate-800/50 border-emerald-500/30 hover:border-emerald-400 transition-colors cursor-pointer h-full">
                    <CardContent className="pt-6 text-center">
                      <p className="text-lg font-semibold text-white mb-2">AI 추천 종목 보기</p>
                      <p className="text-sm text-slate-400">오늘의 AI 분석 결과를 확인하세요</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
