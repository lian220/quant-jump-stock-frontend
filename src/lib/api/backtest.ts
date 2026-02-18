import type {
  BacktestRunRequest,
  BacktestRunResponse,
  BacktestResultResponse,
  BacktestMetrics,
  BacktestEquityPoint,
  BacktestTradeResponse,
  EnhancedBacktestResult,
  BenchmarkOption,
} from '@/types/backtest';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

/**
 * 백테스트 실행 요청
 */
export async function runBacktest(req: BacktestRunRequest): Promise<BacktestRunResponse> {
  const response = await fetch('/api/backtest/run', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || errorData.error || '백테스트 실행에 실패했습니다.',
    );
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * 백테스트 결과 조회
 */
export async function getBacktestResult(
  id: string,
  signal?: AbortSignal,
): Promise<BacktestResultResponse> {
  const response = await fetch(`/api/backtest/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
    signal,
  });

  // 500 응답이라도 FAILED 상태의 백테스트 결과일 수 있으므로 body 파싱 시도
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (data.status === 'FAILED') {
      return data as BacktestResultResponse;
    }
    const error = new Error(data.message || data.error || '백테스트 결과 조회에 실패했습니다.');
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * 백테스트 결과 폴링
 * 5초 간격으로 COMPLETED 또는 FAILED가 될 때까지 폴링
 */
export async function pollBacktestResult(
  id: string,
  onProgress?: (status: string) => void,
  signal?: AbortSignal,
): Promise<BacktestResultResponse> {
  const POLL_INTERVAL = 5000; // 2초 → 5초로 변경하여 서버 부하 감소
  const MAX_ATTEMPTS = 60; // 최대 5분 (5초 * 60 = 300초)

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('폴링이 취소되었습니다.', 'AbortError');
    }

    try {
      const result = await getBacktestResult(id, signal);

      if (onProgress) {
        onProgress(result.status);
      }

      if (result.status === 'COMPLETED' || result.status === 'FAILED') {
        return result;
      }
    } catch (e) {
      // AbortError는 그대로 throw
      if (e instanceof DOMException && e.name === 'AbortError') throw e;
      // 404만 계속 폴링 (결과가 아직 없는 경우), 그 외 모든 오류(네트워크 포함) 즉시 throw
      const status = (e as Error & { status?: number }).status;
      if (status !== 404) throw e;
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, POLL_INTERVAL);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('폴링이 취소되었습니다.', 'AbortError'));
        },
        { once: true },
      );
    });
  }

  throw new Error('백테스트 시간이 초과되었습니다.');
}

/**
 * 강화 백테스트 결과 조회
 */
export async function getEnhancedBacktestResult(id: string): Promise<EnhancedBacktestResult> {
  const response = await fetch(`/api/backtest/${id}/enhanced`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`강화 백테스트 결과 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 사용 가능한 벤치마크 목록 조회
 */
export async function getAvailableBenchmarks(): Promise<BenchmarkOption[]> {
  const response = await fetch('/api/backtest/benchmarks', {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`벤치마크 목록 조회 실패: ${response.status}`);
  }

  const data: { ticker: string; name: string; type?: string }[] = await response.json();

  return data.map((item) => ({
    value: item.ticker,
    label: `${item.name} (${item.ticker})`,
  }));
}

/**
 * Mock 백테스트 결과 생성 (백엔드 미연결 시 사용)
 */
export function generateMockBacktestResult(
  strategyId: string,
  strategyName: string,
  startDate: string,
  endDate: string,
  initialCapital: number,
): BacktestResultResponse {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 수익 곡선 생성
  const equityCurve: BacktestEquityPoint[] = [];
  let strategyValue = initialCapital;
  let benchmarkValue = initialCapital;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
    // 주간 수익률
    const strategyReturn = 1 + (Math.random() * 0.04 - 0.01);
    const benchmarkReturn = 1 + (Math.random() * 0.025 - 0.008);

    // 가끔 큰 하락
    if (Math.random() < 0.05) {
      strategyValue *= 1 - Math.random() * 0.08;
      benchmarkValue *= 1 - Math.random() * 0.1;
    } else {
      strategyValue *= strategyReturn;
      benchmarkValue *= benchmarkReturn;
    }

    equityCurve.push({
      date: d.toISOString().split('T')[0],
      value: Math.round(strategyValue),
      benchmark: Math.round(benchmarkValue),
    });
  }

  // 거래 내역 생성
  const tickers = [
    '삼성전자',
    'SK하이닉스',
    'NAVER',
    '카카오',
    'LG에너지솔루션',
    '현대차',
    '셀트리온',
    'KB금융',
    'POSCO홀딩스',
    '삼성SDI',
  ];
  const trades: BacktestTradeResponse[] = [];

  for (let i = 0; i < 48; i++) {
    const tradeDate = new Date(start);
    tradeDate.setDate(
      tradeDate.getDate() +
        Math.floor(Math.random() * ((end.getTime() - start.getTime()) / 86400000)),
    );
    const ticker = tickers[Math.floor(Math.random() * tickers.length)];
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const price = Math.round(50000 + Math.random() * 300000);
    const quantity = Math.floor(1 + Math.random() * 20);
    const amount = price * quantity;
    const pnl = side === 'SELL' ? Math.round((Math.random() * 2 - 0.6) * amount * 0.1) : 0;
    const pnlPercent = side === 'SELL' ? Math.round((pnl / amount) * 1000) / 10 : 0;

    trades.push({
      tradeDate: tradeDate.toISOString().split('T')[0],
      ticker,
      side: side as 'BUY' | 'SELL',
      quantity,
      price,
      amount,
      pnl,
      pnlPercent,
      exitReason: null,
      executionPrice: null,
      slippageAmount: null,
      taxAmount: null,
    });
  }

  // 날짜순 정렬
  trades.sort((a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime());

  // 성과 지표 계산
  const finalReturn = ((strategyValue - initialCapital) / initialCapital) * 100;
  const years = (end.getTime() - start.getTime()) / (365.25 * 86400000);
  const cagr = (Math.pow(strategyValue / initialCapital, 1 / years) - 1) * 100;

  // MDD 계산
  let peak = initialCapital;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const drawdown = ((peak - point.value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  const sellTrades = trades.filter((t) => t.side === 'SELL');
  const winTrades = sellTrades.filter((t) => (t.pnl ?? 0) > 0);
  const losingTrades = sellTrades.filter((t) => (t.pnl ?? 0) < 0);

  const metrics: BacktestMetrics = {
    cagr: Math.round(cagr * 100) / 100,
    mdd: -Math.round(maxDrawdown * 100) / 100,
    sharpeRatio: Math.round((cagr / (maxDrawdown || 1)) * 100) / 100,
    sortinoRatio: null,
    winRate:
      sellTrades.length > 0 ? Math.round((winTrades.length / sellTrades.length) * 10000) / 100 : 0,
    totalReturn: Math.round(finalReturn * 100) / 100,
    volatility: null,
    totalTrades: trades.length,
    winningTrades: winTrades.length,
    losingTrades: losingTrades.length,
    avgWin: null,
    avgLoss: null,
    benchmarkReturn: null,
    alpha: null,
    beta: null,
    totalCommission: null,
    totalSlippage: null,
    totalTax: null,
    netProfitAfterCosts: null,
    profitFactor: Math.round((1 + Math.random() * 2) * 100) / 100,
    expectancy: null,
    kellyPercentage: null,
    totalTradesStoppedOut: null,
    totalTradesTakenProfit: null,
    avgHoldingPeriod: null,
    bestTrade: null,
    worstTrade: null,
    maxConsecutiveWins: null,
    maxConsecutiveLosses: null,
    riskRewardRatio: null,
    calmarRatio: null,
    stopLossCount: null,
    takeProfitCount: null,
    trailingStopCount: null,
  };

  return {
    id: `mock-bt-${Date.now()}`,
    strategyId,
    strategyName,
    status: 'COMPLETED',
    metrics,
    equityCurve,
    benchmarkCurve: equityCurve.map((p) => ({
      ...p,
      value: p.benchmark ?? 0,
    })),
    trades,
  };
}
