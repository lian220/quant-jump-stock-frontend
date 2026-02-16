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

  const overallGradeKey = resolveGrade(enhanced.overallGrade);
  const overallGradeLabel = resolveGradeLabel(enhanced.overallGrade);
  const summaryText = enhanced.summary || enhanced.overallSummary || '';

  return (
    <div className="space-y-6">
      {/* 종합 등급 */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">종합 등급</p>
              {summaryText && (
                <p className="text-slate-300 text-sm whitespace-pre-line">{summaryText}</p>
              )}
            </div>
            <Badge
              className={`text-4xl font-bold px-6 py-3 ${gradeColors[overallGradeKey] || gradeColors.C}`}
            >
              {overallGradeLabel}
            </Badge>
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

      {/* 용어 사전 (접이식) */}
      {enhanced.glossary.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader
            role="button"
            tabIndex={0}
            aria-expanded={showGlossary}
            className="cursor-pointer"
            onClick={() => setShowGlossary(!showGlossary)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowGlossary(!showGlossary);
              }
            }}
          >
            <CardTitle className="text-white text-lg flex items-center justify-between">
              <span>투자 용어 사전</span>
              <span className="text-slate-400 text-sm font-normal">
                {showGlossary ? '접기' : `${enhanced.glossary.length}개 용어 보기`}
              </span>
            </CardTitle>
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
