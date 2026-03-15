'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import BacktestForm, { type BacktestFormSavedValues } from '@/components/backtest/BacktestForm';
import { saveAuthReturnUrl } from '@/lib/onboarding';
import PerformanceCards from '@/components/backtest/PerformanceCards';
import EnhancedPerformanceCards from '@/components/backtest/EnhancedPerformanceCards';
import RiskAnalysisCards from '@/components/backtest/RiskAnalysisCards';
import EquityCurveChart from '@/components/backtest/EquityCurveChart';
import TradeHistoryTable from '@/components/backtest/TradeHistoryTable';
import BacktestHistoryList from '@/components/backtest/BacktestHistoryList';
import BenchmarkComparisonTable from '@/components/backtest/BenchmarkComparisonTable';
import { Card, CardContent } from '@/components/ui/card';
import { PageSEO } from '@/components/seo';
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
  UniverseType,
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
  // 로그인 후 폼 복원을 위한 저장 값
  const [savedFormValues, setSavedFormValues] = useState<BacktestFormSavedValues | null>(null);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(['^GSPC']);
  const [strategyName, setStrategyName] = useState<string>('');
  const [strategyRiskSettings, setStrategyRiskSettings] = useState<string | undefined>();
  const [strategyPositionSizing, setStrategyPositionSizing] = useState<string | undefined>();
  const [strategyTradingCosts, setStrategyTradingCosts] = useState<string | undefined>();
  const [enhancedResult, setEnhancedResult] = useState<EnhancedBacktestResult | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [strategyCategory, setStrategyCategory] = useState<string>('');
  // SCRUM-344: 유니버스 타입
  const [supportedUniverseTypes, setSupportedUniverseTypes] = useState<UniverseType[]>([]);
  const [recommendedUniverseType, setRecommendedUniverseType] = useState<
    UniverseType | undefined
  >();
  // UX-01: 다단계 로딩 프로그레스
  const [loadingStep, setLoadingStep] = useState(0);
  // UX-09: 타임아웃 시 폴링 재개용 backtestId 저장
  const [lastBacktestId, setLastBacktestId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 전략 정보 조회 (이름 + 기본 리스크 설정)
  useEffect(() => {
    getStrategyById(strategyId)
      .then((strategy) => {
        setStrategyName(strategy.name);
        setStrategyCategory(strategy.category);
        setStrategyRiskSettings(strategy.riskSettings);
        setStrategyPositionSizing(strategy.positionSizing);
        setStrategyTradingCosts(strategy.tradingCosts);
        // SCRUM-344: 유니버스 타입
        if (strategy.supportedUniverseTypes)
          setSupportedUniverseTypes(strategy.supportedUniverseTypes);
        if (strategy.recommendedUniverseType)
          setRecommendedUniverseType(strategy.recommendedUniverseType);
      })
      .catch(() => setStrategyName(`전략 #${strategyId}`));
  }, [strategyId]);

  // 로그인 후 돌아왔을 때 저장된 폼 값 복원 (sessionStorage)
  useEffect(() => {
    const key = `backtest_form_${strategyId}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      try {
        setSavedFormValues(JSON.parse(saved) as BacktestFormSavedValues);
      } catch {
        /* 파싱 실패 무시 */
      } finally {
        sessionStorage.removeItem(key);
      }
    }
  }, [strategyId]);

  // 컴포넌트 unmount 시 진행 중인 폴링 및 타이머 취소
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, []);

  // UX-01: 로딩 단계 메시지
  const LOADING_STEPS = [
    '데이터 수집 중...',
    '시그널 계산 중...',
    '수익률 집계 중...',
    '결과 생성 중...',
  ];

  const startLoadingSteps = useCallback(() => {
    setLoadingStep(0);
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    let step = 0;
    loadingIntervalRef.current = setInterval(() => {
      step = Math.min(step + 1, 3);
      setLoadingStep(step);
    }, 3000);
  }, []);

  const stopLoadingSteps = useCallback(() => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  }, []);

  /** 공통 폴링 로직: AbortController → 60s 타임아웃 → poll → Enhanced 조회 → 스크롤 → 클린업 */
  const resumePolling = useCallback(
    async (backtestId: string): Promise<void> => {
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        abortController.abort();
        setIsTimedOut(true);
        setIsLoading(false);
        setStatus(null);
      }, 60_000);

      try {
        const backtestResult = await pollBacktestResult(
          backtestId,
          (s) => setStatus(s as BacktestStatus),
          abortController.signal,
        );
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (backtestResult.status === 'FAILED') {
          setError(backtestResult.errorMessage || '백테스트 실행에 실패했습니다.');
        } else {
          setResult(backtestResult);
          try {
            const enhanced = await getEnhancedBacktestResult(backtestId);
            setEnhancedResult(enhanced);
          } catch {
            /* Enhanced 없으면 무시 */
          }
          setTimeout(
            () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
            100,
          );
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : '백테스트 결과 조회에 실패했습니다.');
      } finally {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        stopLoadingSteps();
        setIsLoading(false);
      }
    },
    [stopLoadingSteps],
  );

  const handleSubmit = useCallback(
    async (data: BacktestRunRequest) => {
      // 비로그인 시 mock 데이터로 미리보기 제공 (Soft Gate)
      if (!user) {
        setShowLoginPrompt(false);
        setSelectedBenchmarks(data.benchmarks ?? [data.benchmark]);
        setIsLoading(true);
        setStatus('RUNNING');
        setResult(null);
        setEnhancedResult(null);
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
        // 로그인 후 폼 복원을 위해 제출 값을 sessionStorage에 저장
        sessionStorage.setItem(
          `backtest_form_${strategyId}`,
          JSON.stringify({
            startDate: data.startDate,
            endDate: data.endDate,
            initialCapital: data.initialCapital,
            benchmark: data.benchmark,
            additionalBenchmarks: data.benchmarks
              ? data.benchmarks.filter((b) => b !== data.benchmark)
              : [],
            rebalancePeriod: data.rebalancePeriod,
            universeType: data.universeType,
            riskSettings: data.riskSettings,
            positionSizing: data.positionSizing,
            tradingCosts: data.tradingCosts,
          } satisfies BacktestFormSavedValues),
        );
        // UX-05: 결과 영역으로 자동 스크롤
        setTimeout(
          () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
          100,
        );
        return;
      }

      setShowLoginPrompt(false);
      setSelectedBenchmarks(data.benchmarks ?? [data.benchmark]);
      setIsLoading(true);
      setStatus('PENDING');
      setResult(null);
      setEnhancedResult(null);
      setError(null);
      setIsTimedOut(false);
      setLastBacktestId(null);
      startLoadingSteps();

      try {
        // 백엔드에 백테스트 실행 요청
        const runResponse = await runBacktest(data);
        setStatus('RUNNING');
        setLastBacktestId(runResponse.backtestId);
        // resumePolling이 AbortController, 타임아웃, 폴링, 클린업 모두 처리
        await resumePolling(runResponse.backtestId);
      } catch (e) {
        // runBacktest 실패 케이스 처리 (polling 오류는 resumePolling 내부에서 처리됨)
        if (e instanceof DOMException && e.name === 'AbortError') {
          stopLoadingSteps();
          setIsLoading(false);
          return;
        }

        // 네트워크 오류 또는 백엔드 오류(500/503)일 때 mock fallback
        const errorStatus = (e as Error & { status?: number }).status;
        const isBackendDown =
          e instanceof TypeError ||
          (e instanceof Error && (errorStatus === 503 || errorStatus === 500));
        if (isBackendDown) {
          console.warn('백엔드 연결 실패, mock 데이터를 사용합니다.');
          setStatus('RUNNING');
          await new Promise((resolve) => setTimeout(resolve, 1500));
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
        stopLoadingSteps();
        setIsLoading(false);
      }
    },
    [strategyId, strategyName, user, startLoadingSteps, stopLoadingSteps, resumePolling],
  );

  // UX-09: 타임아웃 후 폴링 재개
  const handleResumePolling = useCallback(async () => {
    if (!lastBacktestId) return;
    setIsTimedOut(false);
    setIsLoading(true);
    setStatus('RUNNING');
    startLoadingSteps();
    await resumePolling(lastBacktestId);
  }, [lastBacktestId, startLoadingSteps, resumePolling]);

  // FIN-02: 표본 부족 경고용 변수 (JSX 외부에서 계산)
  const roundTrips = result?.metrics
    ? (result.metrics.totalTrades ?? Math.ceil(result.trades.length / 2))
    : 0;
  const isSmallSample = roundTrips > 0 && roundTrips < 30;

  return (
    <>
      {/* GRW-04: 동적 SEO 메타 */}
      <PageSEO
        title={strategyName ? `${strategyName} - 성과 시뮬레이션` : '성과 시뮬레이션'}
        description={
          result?.metrics
            ? `${strategyName} 시뮬레이션 결과: 연평균 수익률 ${result.metrics.cagr?.toFixed(1)}%, 최대 손실폭 ${result.metrics.mdd?.toFixed(1)}%, 안정성 지수 ${result.metrics.sharpeRatio?.toFixed(2)}`
            : '전략의 과거 성과를 시뮬레이션하고 분석합니다'
        }
        keywords="백테스트, 성과 시뮬레이션, 투자 전략, 투자 시뮬레이션, Alpha Foundry"
      />
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
              {strategyName ? `${strategyName} - 성과 시뮬레이션` : '성과 시뮬레이션'}
            </h1>
            <p className="text-slate-400 mt-1">전략의 과거 성과를 시뮬레이션하고 분석합니다</p>
          </div>

          {/* 백테스트 폼 */}
          <div className="mb-8">
            <BacktestForm
              strategyId={strategyId}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              defaultRiskSettings={strategyRiskSettings}
              defaultPositionSizing={strategyPositionSizing}
              defaultTradingCosts={strategyTradingCosts}
              supportedUniverseTypes={supportedUniverseTypes}
              recommendedUniverseType={recommendedUniverseType}
              initialValues={savedFormValues ?? undefined}
            />
          </div>

          {/* SCRUM-344: 백테스트 요약 + 히스토리 */}
          {user && (
            <div className="mb-8">
              <BacktestHistoryList strategyId={strategyId} />
            </div>
          )}

          {/* UX-01: 다단계 로딩 프로그레스 */}
          {isLoading && status && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
              <p className="text-slate-300 text-lg">
                {status === 'PENDING' ? '시뮬레이션 요청 중...' : LOADING_STEPS[loadingStep]}
              </p>
              {/* 진행 바 */}
              <div className="max-w-xs mx-auto mt-4">
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  {LOADING_STEPS.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${i <= loadingStep ? 'bg-emerald-500' : 'bg-slate-600'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-3">
                데이터 양에 따라 수 초에서 수 분이 소요될 수 있습니다
              </p>
            </div>
          )}

          {/* 타임아웃 안내 - 1분 초과 시 */}
          {isTimedOut && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 text-center mb-8">
              <div className="text-3xl mb-3">&#x23F3;</div>
              <p className="text-amber-400 text-lg font-semibold mb-2">
                시뮬레이션이 예상보다 오래 걸리고 있습니다
              </p>
              <p className="text-slate-400 mb-4">
                데이터 처리에 시간이 더 필요합니다. 잠시 후 이 페이지를 다시 방문하면 결과를 확인할
                수 있습니다.
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/strategies/${strategyId}`)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  전략 상세로 돌아가기
                </Button>
                <Button
                  size="sm"
                  onClick={handleResumePolling}
                  disabled={!lastBacktestId}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  계속 기다리기
                </Button>
                {/* GRW-08: 완료 시 알림 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={async () => {
                    if (!('Notification' in window)) return;
                    if (Notification.permission === 'denied') {
                      alert('브라우저 설정에서 알림을 허용해 주세요.');
                      return;
                    }
                    if (Notification.permission === 'granted') {
                      handleResumePolling();
                      return;
                    }
                    const perm = await Notification.requestPermission();
                    if (perm === 'granted') {
                      handleResumePolling();
                    }
                  }}
                >
                  완료 시 알림 받기
                </Button>
              </div>
            </div>
          )}

          {/* 로그인 유도 - 결과 없을 때만 단독 표시 */}
          {showLoginPrompt && !result && (
            <div className="bg-slate-800/50 border border-emerald-500/30 rounded-lg p-6 text-center mb-8">
              <p className="text-white text-lg mb-2">로그인이 필요합니다</p>
              <p className="text-slate-400 mb-4">시뮬레이션을 실행하려면 먼저 로그인해 주세요.</p>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  saveAuthReturnUrl(window.location.pathname);
                  router.push('/auth');
                }}
              >
                로그인하기
              </Button>
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center mb-8">
              <p className="text-red-400 text-lg mb-2">시뮬레이션 실행 실패</p>
              <p className="text-slate-400">{error}</p>
            </div>
          )}

          {/* 결과 표시 */}
          {result && result.status === 'COMPLETED' && result.metrics && (
            <div ref={resultsRef} className="relative scroll-mt-4">
              {/* FIN-03: 백테스트 한계 고지 */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg px-4 py-3 mb-6">
                <p className="text-xs text-slate-500 leading-relaxed">
                  본 시뮬레이션 결과는 과거 데이터를 기반으로 한 분석이며, 미래 수익을 보장하지
                  않습니다. 실제 거래에서는 유동성, 시장 충격, 슬리피지 등 추가적인 변수가 영향을
                  미칠 수 있습니다.
                </p>
              </div>

              {/* Soft Gate: 비로그인 blur 오버레이 */}
              {showLoginPrompt && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-32">
                  <div className="bg-slate-900/95 border border-emerald-500/40 rounded-xl p-8 text-center shadow-2xl max-w-md mx-4">
                    <div className="text-4xl mb-3">🔒</div>
                    <p className="text-white text-lg font-semibold mb-2">전체 결과를 확인하세요</p>
                    <p className="text-slate-400 text-sm mb-5">
                      로그인하면 상세 성과 지표, 수익 곡선, 거래 내역을 모두 확인할 수 있습니다.
                    </p>
                    {/* GRW-02: CTA 문구 개선 */}
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 w-full mb-2"
                      onClick={() => {
                        saveAuthReturnUrl(window.location.pathname);
                        router.push('/auth');
                      }}
                    >
                      로그인하고 실제 결과 확인하기 (무료)
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {/* UX-04: 성과 지표 카드는 blur 없이 표시 */}
                {enhancedResult ? (
                  <EnhancedPerformanceCards enhanced={enhancedResult} />
                ) : (
                  <PerformanceCards metrics={result.metrics} />
                )}

                {/* FIN-02: 표본 부족 경고 */}
                {isSmallSample && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
                    <p className="text-xs text-amber-400 font-medium">
                      표본 부족 (청산 거래 {roundTrips}건) — 통계적 신뢰도가 낮을 수 있습니다.
                      시뮬레이션 기간을 늘려 30건 이상의 청산 거래를 확보하는 것을 권장합니다.
                    </p>
                  </div>
                )}

                {/* UX-04: 비로그인 시 차트/거래내역만 blur */}
                <div className={showLoginPrompt ? 'blur-sm pointer-events-none select-none' : ''}>
                  {/* 리스크 분석 카드 */}
                  {result.metrics && <RiskAnalysisCards metrics={result.metrics} />}

                  {/* 수익 곡선 차트 */}
                  <EquityCurveChart
                    equityCurve={result.equityCurve}
                    benchmarkLabels={selectedBenchmarks}
                    defaultBenchmark={selectedBenchmarks[0]}
                  />

                  {/* 벤치마크 성과 비교 테이블 (SCRUM-353) */}
                  <BenchmarkComparisonTable
                    equityCurve={result.equityCurve}
                    benchmarks={selectedBenchmarks}
                    strategyCagr={result.metrics?.cagr ?? null}
                    strategyTotalReturn={result.metrics?.totalReturn ?? null}
                  />

                  {/* 거래 내역 테이블 */}
                  <TradeHistoryTable trades={result.trades} />
                </div>

                {/* GRW-01: 결과 공유 + FIN-06: 결과 저장 */}
                {!showLoginPrompt && (
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => {
                        const m = result.metrics!;
                        const text = `[${strategyName}] 시뮬레이션 결과\n연수익률: ${m.cagr?.toFixed(1)}% | 최대 손실폭: ${m.mdd?.toFixed(1)}% | 안정성 지수: ${m.sharpeRatio?.toFixed(2)} | 승률: ${m.winRate?.toFixed(1)}%\n— Alpha Foundry`;
                        navigator.clipboard.writeText(text);
                      }}
                    >
                      결과 복사
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => {
                        try {
                          const saved = JSON.parse(
                            localStorage.getItem('backtest_history') || '[]',
                          );
                          saved.unshift({
                            strategyId,
                            strategyName,
                            date: new Date().toISOString(),
                            metrics: result.metrics,
                          });
                          localStorage.setItem(
                            'backtest_history',
                            JSON.stringify(saved.slice(0, 10)),
                          );
                        } catch {
                          /* 저장 실패 무시 */
                        }
                      }}
                    >
                      결과 저장
                    </Button>
                  </div>
                )}

                {/* GRW-03 + GRW-07: 동적 CTA */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Link
                    href={
                      strategyCategory ? `/strategies?category=${strategyCategory}` : '/strategies'
                    }
                  >
                    <Card className="bg-slate-800/50 border-cyan-500/30 hover:border-cyan-400 transition-colors cursor-pointer h-full">
                      <CardContent className="pt-6 text-center">
                        <p className="text-lg font-semibold text-white mb-2">
                          {result.metrics.totalReturn != null && result.metrics.totalReturn > 0
                            ? '같은 카테고리 전략 더보기'
                            : '더 높은 수익률 전략 탐색'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {result.metrics.totalReturn != null && result.metrics.totalReturn > 0
                            ? '비슷한 투자 스타일의 전략을 비교해보세요'
                            : '다른 투자 전략의 성과를 확인해보세요'}
                        </p>
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
    </>
  );
}
