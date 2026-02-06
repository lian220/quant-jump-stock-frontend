// 전략 지표 파싱, 등급 산정, 투자 시뮬레이션 계산

export type MetricGrade = 'good' | 'warning' | 'danger';

export interface GradeResult {
  grade: MetricGrade;
  label: string;
  color: string;
  glowColor: string;
}

// 문자열 지표에서 숫자 추출 ("+156.3%" → 156.3, "-18.5%" → -18.5, "1.85" → 1.85)
export function parseMetricValue(value: string): number | null {
  if (!value || value === 'N/A') return null;
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  const parsed = parseFloat(cleaned);
  // 첫 번째 유의미 문자가 '-'이면 음수로 처리
  if (/^\s*-/.test(value) && parsed > 0) return -parsed;
  return isNaN(parsed) ? null : parsed;
}

// 지표별 등급 산정
export function gradeMetric(metricKey: string, value: number): GradeResult {
  const grades: Record<string, { good: (v: number) => boolean; warning: (v: number) => boolean }> =
    {
      totalReturn: {
        good: (v) => v >= 100,
        warning: (v) => v >= 30,
      },
      cagr: {
        good: (v) => v >= 20,
        warning: (v) => v >= 10,
      },
      mdd: {
        // MDD는 음수: -10%면 good, -20%이면 warning, -30%이면 danger
        good: (v) => v > -15,
        warning: (v) => v > -25,
      },
      sharpeRatio: {
        good: (v) => v >= 1.5,
        warning: (v) => v >= 0.8,
      },
      winRate: {
        good: (v) => v >= 60,
        warning: (v) => v >= 45,
      },
    };

  const thresholds = grades[metricKey];
  if (!thresholds) {
    return {
      grade: 'warning',
      label: '보통',
      color: 'bg-yellow-400',
      glowColor: 'shadow-yellow-400/50',
    };
  }

  if (thresholds.good(value)) {
    return {
      grade: 'good',
      label: '우수',
      color: 'bg-emerald-400',
      glowColor: 'shadow-emerald-400/50',
    };
  }
  if (thresholds.warning(value)) {
    return {
      grade: 'warning',
      label: '보통',
      color: 'bg-yellow-400',
      glowColor: 'shadow-yellow-400/50',
    };
  }
  return {
    grade: 'danger',
    label: '주의',
    color: 'bg-red-400',
    glowColor: 'shadow-red-400/50',
  };
}

// 투자 시뮬레이션 결과
export interface InvestmentOutcome {
  initialAmount: number;
  finalAmount: number;
  profit: number;
  isPositive: boolean;
  annualReturn: number;
  mddPercent: number;
  mddAmount: number;
  years: number;
}

// 투자 시뮬레이션 계산
export function calculateInvestmentOutcome(
  totalReturnStr: string,
  annualReturnStr: string,
  mddStr: string,
  backtestPeriod: string,
  initialAmount: number = 10000000,
): InvestmentOutcome {
  const totalReturn = parseMetricValue(totalReturnStr) ?? 0;
  const annualReturn = parseMetricValue(annualReturnStr) ?? 0;
  const mddPercent = parseMetricValue(mddStr) ?? 0;

  // 기간 계산 (예: "2020-2024" → 4년)
  const periodMatch = backtestPeriod.match(/(\d{4})\s*[-~]\s*(\d{4})/);
  const years = periodMatch ? Math.max(1, parseInt(periodMatch[2]) - parseInt(periodMatch[1])) : 4;

  const finalAmount = Math.round(initialAmount * (1 + totalReturn / 100));
  const profit = finalAmount - initialAmount;
  const mddAmount = Math.round((initialAmount * Math.abs(mddPercent)) / 100);

  return {
    initialAmount,
    finalAmount,
    profit,
    isPositive: profit >= 0,
    annualReturn,
    mddPercent,
    mddAmount,
    years,
  };
}

// 한국식 금액 포맷 (만원 단위)
export function formatKoreanCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (absAmount >= 100000000) {
    const eok = Math.floor(absAmount / 100000000);
    const man = Math.floor((absAmount % 100000000) / 10000);
    return man > 0 ? `${sign}${eok}억 ${man.toLocaleString()}만` : `${sign}${eok}억`;
  }
  if (absAmount >= 10000) {
    return `${sign}${Math.floor(absAmount / 10000).toLocaleString()}만`;
  }
  return `${sign}${absAmount.toLocaleString()}`;
}
