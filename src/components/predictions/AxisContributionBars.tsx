'use client';

/**
 * XAI 축별 강도 막대 (ADR 0006 §2.9)
 * - 3축(차트/AI/뉴스 = tech/ai/sentiment) "각 신호 강도"를 0~100 자체 척도로 표시
 *   (가중 기여도가 아님 — 기여도는 축마다 상한이 50/30/20이라 "낮아 보이는" 착시를 유발)
 *   강도 = 원점수 / 축 최대값 × 100. 종합점수는 이 강도들의 가중평균.
 * - 결측 여부는 axisContributions 키 유무로 판정 (없으면 *Display>0 fallback)
 * - cognitive overload 금지: 3축 막대 + 한 줄 사유까지만 (§2.9)
 * - scoreCoverage<1.0 또는 결측 축이 있으면 "데이터 커버리지" 1줄 보조 표기 (§5)
 */

import { ScoreBar } from '@/components/dashboard';
import type { BuySignal } from '@/lib/api/predictions';

type AxisSource = Pick<
  BuySignal,
  | 'axisContributions'
  | 'aiScore'
  | 'techScore'
  | 'sentimentScore'
  | 'techScoreDisplay'
  | 'aiScoreDisplay'
  | 'sentimentScoreDisplay'
  | 'scoreCoverage'
  | 'recommendationReason'
>;

interface Props {
  stock: AxisSource;
  /** 한 줄 사유 표시 여부 (기본 true) */
  showReason?: boolean;
  size?: 'sm' | 'md';
}

interface Axis {
  key: 'tech' | 'ai' | 'sentiment';
  label: string;
  value: number | null;
}

/** 축별 원점수 최대값 (scoring_spec.yaml axes.*.max 미러). 강도 정규화용 구조 상수. */
const AXIS_MAX = { ai: 10, tech: 3.5, sentiment: 10 } as const;

/** 각 축 강도(0~100) = 원점수/최대×100. 결측 축(기여도 키 없음/0)은 null. */
function resolveAxes(stock: AxisSource): Axis[] {
  const contrib = stock.axisContributions;
  // 축이 점수 산출에 포함됐는지(present) 판정: 기여도 dict 키 우선, 없으면 *Display>0 fallback
  const isPresent = (key: 'ai' | 'tech' | 'sentiment', displayVal?: number): boolean => {
    if (contrib && Object.keys(contrib).length > 0) return contrib[key] != null;
    return displayVal != null && displayVal > 0;
  };
  const strength = (raw: number | undefined, max: number): number | null =>
    raw == null ? null : Math.max(0, Math.min(100, (raw / max) * 100));

  return [
    {
      key: 'tech',
      label: '차트',
      value: isPresent('tech', stock.techScoreDisplay)
        ? strength(stock.techScore, AXIS_MAX.tech)
        : null,
    },
    {
      key: 'ai',
      label: 'AI',
      value: isPresent('ai', stock.aiScoreDisplay) ? strength(stock.aiScore, AXIS_MAX.ai) : null,
    },
    {
      key: 'sentiment',
      label: '뉴스',
      value: isPresent('sentiment', stock.sentimentScoreDisplay)
        ? strength(stock.sentimentScore, AXIS_MAX.sentiment)
        : null,
    },
  ];
}

/** 커버리지 보조 표기 문구. 표시 불필요하면 null. */
function coverageNote(stock: AxisSource, missingCount: number): string | null {
  const coverage = stock.scoreCoverage;
  if (coverage != null && coverage < 1) {
    return `데이터 커버리지 ${Math.round(coverage * 100)}%`;
  }
  if (missingCount > 0) {
    return '일부 데이터 결측';
  }
  return null;
}

export function AxisContributionBars({ stock, showReason = true, size = 'sm' }: Props) {
  const axes = resolveAxes(stock);
  const present = axes.filter((a) => a.value != null);
  const missingCount = axes.length - present.length;
  const note = coverageNote(stock, missingCount);

  // 표시할 축이 하나도 없으면 렌더링 생략
  if (present.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-slate-500">분석 근거 (각 신호 강도, 0~100)</p>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {axes.map((axis) =>
          axis.value != null ? (
            <ScoreBar
              key={axis.key}
              score={Math.round(axis.value)}
              label={axis.label}
              size={size}
            />
          ) : (
            <div key={axis.key} className="min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500 truncate">{axis.label}</span>
                <span className="text-xs font-bold tabular-nums text-slate-600">–</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700/50 rounded-full" />
            </div>
          ),
        )}
      </div>
      {showReason && stock.recommendationReason && (
        <p className="text-[11px] text-slate-400 leading-snug line-clamp-1">
          💡 {stock.recommendationReason}
        </p>
      )}
      {note && <p className="text-[10px] text-slate-600">{note}</p>}
    </div>
  );
}
