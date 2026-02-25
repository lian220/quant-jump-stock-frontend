'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EnhancedBacktestResult, GradeObject, GradeValue } from '@/types/backtest';

interface EnhancedPerformanceCardsProps {
  enhanced: EnhancedBacktestResult;
}

// 등급 → 색상 매핑 (A-F 및 good/caution/danger/bad 모두 지원)
const gradeColors: Record<string, string> = {
  A: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  B: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  C: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  D: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  F: 'text-red-400 bg-red-500/20 border-red-500/30',
  good: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  caution: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  danger: 'text-red-400 bg-red-500/20 border-red-500/30',
  bad: 'text-red-400 bg-red-500/20 border-red-500/30',
};

const gradeDotColors: Record<string, string> = {
  A: 'bg-emerald-400',
  B: 'bg-cyan-400',
  C: 'bg-yellow-400',
  D: 'bg-orange-400',
  F: 'bg-red-400',
  good: 'bg-emerald-400',
  caution: 'bg-yellow-400',
  danger: 'bg-red-400',
  bad: 'bg-red-400',
};

const gradeTextColors: Record<string, string> = {
  A: 'text-emerald-400',
  B: 'text-cyan-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  F: 'text-red-400',
  good: 'text-emerald-400',
  caution: 'text-yellow-400',
  danger: 'text-red-400',
  bad: 'text-red-400',
};

// 등급 표시 레이블 (good → 좋음 등)
const gradeDisplayLabels: Record<string, string> = {
  good: '좋음',
  caution: '주의',
  danger: '위험',
  bad: '나쁨',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  F: 'F',
};

/**
 * overallGrade가 객체 또는 문자열일 수 있으므로 안전하게 추출
 */
function resolveGrade(grade: GradeObject | GradeValue | unknown): GradeValue {
  if (typeof grade === 'object' && grade !== null && 'grade' in grade) {
    return (grade as GradeObject).grade;
  }
  if (typeof grade === 'string') return grade as GradeValue;
  return 'C';
}

function resolveGradeLabel(grade: GradeObject | GradeValue | unknown): string {
  if (typeof grade === 'object' && grade !== null && 'label' in grade) {
    return (grade as GradeObject).label;
  }
  if (typeof grade === 'string') return gradeDisplayLabels[grade] || grade;
  return '-';
}

export default function EnhancedPerformanceCards({ enhanced }: EnhancedPerformanceCardsProps) {
  const [showGlossary, setShowGlossary] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  const overallGradeKey = resolveGrade(enhanced.overallGrade);
  const overallGradeLabel = resolveGradeLabel(enhanced.overallGrade);
  const summaryText = enhanced.summary || enhanced.overallSummary || '';

  return (
    <div className="space-y-6">
      {/* 종합 등급 */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-slate-400">종합 등급</p>
            <Badge
              className={`text-xl font-bold px-5 py-2 ${gradeColors[overallGradeKey] || gradeColors.C}`}
            >
              {overallGradeLabel}
            </Badge>
            {summaryText && (
              <p className="text-slate-300 text-sm whitespace-pre-line max-w-2xl leading-relaxed mt-1">
                {summaryText}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 지표별 등급 */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">지표별 성과 등급</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enhanced.gradedMetrics.map((metric) => {
              const metricGrade = resolveGrade(metric.grade);
              const metricGradeLabel =
                metric.gradeLabel || gradeDisplayLabels[metricGrade] || metricGrade;
              const displayName = metric.nameKo || metric.name;
              const displayValue =
                metric.formattedValue ||
                (typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value);

              return (
                <div
                  key={metric.name}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{metric.description}</p>
                    {displayValue !== null && displayValue !== undefined && (
                      <p className="text-xs text-slate-300 font-mono mt-1">{displayValue}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span
                      className={`w-3 h-3 rounded-full ${gradeDotColors[metricGrade] || gradeDotColors.C}`}
                    />
                    <span
                      className={`text-sm font-bold ${gradeTextColors[metricGrade] || gradeTextColors.C}`}
                    >
                      {metricGradeLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* FIN-04: 등급 산출 방법 */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <button
            type="button"
            aria-expanded={showMethodology}
            className="w-full flex items-center justify-between cursor-pointer"
            onClick={() => setShowMethodology(!showMethodology)}
          >
            <CardTitle className="text-white text-lg">등급 산출 방법</CardTitle>
            <span className="text-slate-400 text-sm font-normal">
              {showMethodology ? '접기' : '보기'}
            </span>
          </button>
        </CardHeader>
        {showMethodology && (
          <CardContent>
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <p>
                종합 등급은 아래 지표의 가중 평균으로 산출됩니다. 각 지표는 A~F 등급으로 개별 평가된
                후, 가중치를 적용하여 최종 등급이 결정됩니다.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 bg-slate-700/30 rounded">
                  <span className="text-slate-300 font-medium">연평균 수익률</span>
                  <span className="float-right text-emerald-400">30%</span>
                </div>
                <div className="p-2 bg-slate-700/30 rounded">
                  <span className="text-slate-300 font-medium">안정성 지수</span>
                  <span className="float-right text-emerald-400">25%</span>
                </div>
                <div className="p-2 bg-slate-700/30 rounded">
                  <span className="text-slate-300 font-medium">최대 손실폭</span>
                  <span className="float-right text-emerald-400">25%</span>
                </div>
                <div className="p-2 bg-slate-700/30 rounded">
                  <span className="text-slate-300 font-medium">승률</span>
                  <span className="float-right text-emerald-400">20%</span>
                </div>
              </div>
              <p className="text-slate-500 mt-1">
                등급 기준: A (상위 10%) / B (상위 30%) / C (상위 60%) / D (상위 90%) / F (하위 10%)
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* UX-10: 용어 사전 (접이식) - native button으로 접근성 개선 */}
      {enhanced.glossary.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <button
              type="button"
              aria-expanded={showGlossary}
              className="w-full flex items-center justify-between cursor-pointer"
              onClick={() => setShowGlossary(!showGlossary)}
            >
              <CardTitle className="text-white text-lg">투자 용어 사전</CardTitle>
              <span className="text-slate-400 text-sm font-normal">
                {showGlossary ? '접기' : `${enhanced.glossary.length}개 용어 보기`}
              </span>
            </button>
          </CardHeader>
          {showGlossary && (
            <CardContent>
              <div className="space-y-3">
                {enhanced.glossary.map((item) => (
                  <div key={item.term} className="p-3 bg-slate-700/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{item.termKo || item.term}</p>
                      {item.termKo && (
                        <Badge className="bg-slate-600/50 text-slate-400 border-slate-500/30 text-[10px]">
                          {item.term}
                        </Badge>
                      )}
                      {!item.termKo && item.category && (
                        <Badge className="bg-slate-600/50 text-slate-400 border-slate-500/30 text-[10px]">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{item.definition}</p>
                    {item.example && <p className="text-xs text-slate-500 mt-1">{item.example}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
