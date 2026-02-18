'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clearTrackedEvents, getFunnelBaselineMetrics, getTrackedEvents } from '@/lib/analytics';

const stepLabels: Record<string, string> = {
  landing_cta_click: '랜딩 CTA 클릭',
  auth_view: '인증 화면 진입',
  signup_start: '가입 시작',
  signup_complete: '가입 완료',
  first_analysis_view: '첫 가치 행동(분석 화면 진입)',
};

function formatRate(value: number | null) {
  if (value === null) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

export default function FunnelDashboardPage() {
  const [version, setVersion] = useState(0);

  const { metrics, totalEvents } = useMemo(() => {
    const allEvents = getTrackedEvents();
    return {
      metrics: getFunnelBaselineMetrics(),
      totalEvents: allEvents.length,
    };
  }, [version]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-3">
            Growth KPI Baseline
          </Badge>
          <h1 className="text-3xl font-bold text-white mb-2">퍼널 기준선 대시보드</h1>
          <p className="text-slate-400">
            로컬 계측 이벤트 기준으로 랜딩→가입→첫 가치 행동 퍼널 전환율을 확인합니다.
          </p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">측정 기준</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300 space-y-1">
            <p>1) 랜딩→인증 진입률 = auth_view / landing_cta_click</p>
            <p>2) 인증 진입→가입 완료율 = signup_complete / auth_view</p>
            <p>3) 가입 후 첫 가치행동 도달률 = first_analysis_view / signup_complete</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-lg">퍼널 스텝별 현황</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setVersion((prev) => prev + 1)}>
                새로고침
              </Button>
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => {
                  clearTrackedEvents();
                  setVersion((prev) => prev + 1);
                }}
              >
                이벤트 초기화
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-4">
              저장 이벤트 수: {totalEvents.toLocaleString()}건
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left py-2 font-medium">스텝</th>
                    <th className="text-right py-2 font-medium">이벤트 수</th>
                    <th className="text-right py-2 font-medium">직전 대비 전환율</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr key={metric.step} className="border-b border-slate-800">
                      <td className="py-3 text-slate-200">
                        {stepLabels[metric.step] ?? metric.step}
                      </td>
                      <td className="py-3 text-right text-emerald-400 font-semibold">
                        {metric.count.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-cyan-400">
                        {formatRate(metric.conversionRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
