/**
 * SWR 기반 데이터 훅 모음
 *
 * 캐시 전략:
 * - 실시간 데이터 (뉴스, 주가, 구독): SWR 기본 + 짧은 dedupe
 * - 일간 데이터 (predictions): 5분 dedupe
 * - 정적 데이터 (전략 상세, 벤치마크): 긴 dedupe
 */
import useSWR, { type SWRConfiguration } from 'swr';
import {
  getBuySignals,
  getPredictionStats,
  getLatestPredictions,
  type GetBuySignalsParams,
  type BuySignalsResponse,
  type PredictionStatsResponse,
  type LatestPredictionsResponse,
} from '@/lib/api/predictions';
import {
  getStrategies,
  getStrategyById,
  getStrategyDefaultStocks,
  getBenchmarkSeries,
} from '@/lib/api/strategies';
import type { StrategyListParams, DefaultStockListResponse } from '@/types/api';
import type { Strategy, StrategyDetail, BenchmarkResponse } from '@/types/strategy';

// ─── Predictions ───

/** AI 매수 신호 (하루 1회 갱신, 5분 캐시) */
export function useBuySignals(params?: GetBuySignalsParams) {
  const key = params ? ['buy-signals', JSON.stringify(params)] : ['buy-signals'];
  return useSWR<BuySignalsResponse>(key, () => getBuySignals(params), {
    dedupingInterval: 5 * 60 * 1000, // 5분
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
}

/** 예측 통계 (하루 1회 갱신, 1시간 캐시) */
export function usePredictionStats(days: number = 30) {
  return useSWR<PredictionStatsResponse>(
    ['prediction-stats', days],
    () => getPredictionStats(days),
    {
      dedupingInterval: 60 * 60 * 1000, // 1시간
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );
}

/** 최신 예측 날짜 (하루 1회 갱신, 1시간 캐시) */
export function useLatestPredictions() {
  return useSWR<LatestPredictionsResponse>('latest-predictions', () => getLatestPredictions(), {
    dedupingInterval: 60 * 60 * 1000, // 1시간
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
}

// ─── Strategies ───

type StrategiesResult = {
  strategies: Strategy[];
  totalPages: number;
  totalItems: number;
};

/** 전략 목록 (거의 안 바뀜, 5분 캐시) */
export function useStrategies(params?: StrategyListParams, config?: SWRConfiguration) {
  const key = params ? ['strategies', JSON.stringify(params)] : null;
  return useSWR<StrategiesResult>(key, () => getStrategies(params!), {
    dedupingInterval: 5 * 60 * 1000, // 5분
    revalidateOnFocus: false,
    keepPreviousData: true,
    ...config,
  });
}

/** 전략 상세 (거의 안 바뀜, 30분 캐시) */
export function useStrategy(id: string | null) {
  return useSWR<StrategyDetail>(id ? ['strategy', id] : null, () => getStrategyById(id!), {
    dedupingInterval: 30 * 60 * 1000, // 30분
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
}

/** 전략 기본 종목 (고정 데이터, 30분 캐시) */
export function useStrategyDefaultStocks(id: string | null) {
  return useSWR<DefaultStockListResponse>(
    id ? ['strategy-default-stocks', id] : null,
    () => getStrategyDefaultStocks(id!),
    {
      dedupingInterval: 30 * 60 * 1000, // 30분
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );
}

// ─── Benchmarks ───

/** 벤치마크 시리즈 (과거 데이터, 1시간 캐시) */
export function useBenchmarkSeries(
  params: { tickers: string[]; startDate: string; endDate: string; initialCapital?: number } | null,
) {
  const key = params ? ['benchmark-series', JSON.stringify(params)] : null;
  return useSWR<BenchmarkResponse>(key, () => getBenchmarkSeries(params!), {
    dedupingInterval: 60 * 60 * 1000, // 1시간
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
}
