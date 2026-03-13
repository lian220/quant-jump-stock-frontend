'use client';

/**
 * 점수 시각 인코딩 컴포넌트
 * - 0~100 점수를 컬러 바로 표시
 * - 색상: 빨강(0-39) → 노랑(40-69) → 초록(70-100)
 */

interface ScoreBarProps {
  score: number;
  label?: string;
  maxScore?: number;
  size?: 'sm' | 'md';
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

export function ScoreBar({ score, label, maxScore = 100, size = 'sm' }: ScoreBarProps) {
  const percentage = Math.min(Math.max((score / maxScore) * 100, 0), 100);
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="min-w-0">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500 truncate">{label}</span>
          <span className={`text-xs font-bold tabular-nums ${getScoreTextColor(score)}`}>
            {score}점
          </span>
        </div>
      )}
      <div className={`w-full ${barHeight} bg-slate-700 rounded-full overflow-hidden`}>
        <div
          className={`${barHeight} ${getScoreColor(score)} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/** 인라인 점수 뱃지 (컬러 코딩 포함) */
export function ScoreBadge({ score, label }: { score: number; label?: string }) {
  return (
    <span className={`text-xs font-bold tabular-nums ${getScoreTextColor(score)}`}>
      {label && <span className="text-[10px] text-slate-500 font-normal mr-1">{label}</span>}
      {score}
    </span>
  );
}
