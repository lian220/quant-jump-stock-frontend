'use client';

import React, { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { BacktestRunRequest, BenchmarkType, RebalancePeriod } from '@/types/backtest';
import { MAX_BACKTEST_DAYS } from '@/constants/backtest';

const backtestFormSchema = z
  .object({
    startDate: z.string().min(1, '시작일을 입력하세요'),
    endDate: z.string().min(1, '종료일을 입력하세요'),
    initialCapital: z.number().min(1000000, '최소 100만원 이상 입력하세요'),
    benchmark: z.string().min(1, '벤치마크를 선택하세요'),
    rebalancePeriod: z.string().min(1, '리밸런싱 주기를 선택하세요'),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: '종료일은 시작일 이후여야 합니다',
    path: ['endDate'],
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= MAX_BACKTEST_DAYS;
    },
    {
      message: `백테스트 기간은 최대 1년(${MAX_BACKTEST_DAYS}일)까지 가능합니다`,
      path: ['endDate'],
    },
  );

type BacktestFormValues = z.infer<typeof backtestFormSchema>;

interface BacktestFormProps {
  strategyId: string;
  onSubmit: (data: BacktestRunRequest) => void;
  isLoading: boolean;
}

const benchmarkOptions: { value: BenchmarkType; label: string }[] = [
  { value: 'SPY', label: 'S&P 500 (SPY)' },
  { value: 'QQQ', label: 'NASDAQ 100 (QQQ)' },
];

const rebalanceOptions: { value: RebalancePeriod; label: string }[] = [
  { value: 'DAILY', label: '매일' },
  { value: 'WEEKLY', label: '매주' },
  { value: 'MONTHLY', label: '매월' },
  { value: 'QUARTERLY', label: '분기별' },
];

// 빠른 기간 선택 옵션
const periodPresets = [
  { label: '1개월', months: 1 },
  { label: '3개월', months: 3 },
  { label: '6개월', months: 6 },
  { label: '1년', months: 12 },
] as const;

// 오늘 기준 N개월 전 날짜를 yyyy-MM-dd로 반환 (월 롤오버 방지)
function getDateMonthsAgo(months: number): string {
  const today = new Date();
  const targetYear = today.getFullYear();
  const targetMonth = today.getMonth() - months;
  const day = today.getDate();

  // 월 경계를 넘는 경우 연도 조정
  const adjustedYear = targetYear + Math.floor(targetMonth / 12);
  const adjustedMonth = ((targetMonth % 12) + 12) % 12;

  // 타겟 월의 마지막 날짜
  const lastDayOfTargetMonth = new Date(adjustedYear, adjustedMonth + 1, 0).getDate();
  // 현재 일자가 타겟 월에 없으면 마지막 날로 클램핑
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  const result = new Date(adjustedYear, adjustedMonth, clampedDay);
  return result.toISOString().split('T')[0];
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export default function BacktestForm({ strategyId, onSubmit, isLoading }: BacktestFormProps) {
  // SSR 하이드레이션 불일치 방지: 컴포넌트 내부에서 날짜 계산
  const defaultDates = useMemo(
    () => ({
      startDate: getDateMonthsAgo(12),
      endDate: getTodayString(),
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BacktestFormValues>({
    resolver: zodResolver(backtestFormSchema),
    defaultValues: {
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      initialCapital: 10000000,
      benchmark: 'SPY',
      rebalancePeriod: 'MONTHLY',
    },
  });

  const benchmarkValue = watch('benchmark');
  const rebalanceValue = watch('rebalancePeriod');

  // 빠른 기간 선택 핸들러
  const handlePeriodPreset = useCallback(
    (months: number) => {
      const endDate = getTodayString();
      const startDate = getDateMonthsAgo(months);
      setValue('startDate', startDate, { shouldValidate: true });
      setValue('endDate', endDate, { shouldValidate: true });
    },
    [setValue],
  );

  const handleFormSubmit = (data: BacktestFormValues) => {
    onSubmit({
      strategyId,
      startDate: data.startDate,
      endDate: data.endDate,
      initialCapital: data.initialCapital,
      benchmark: data.benchmark as BenchmarkType,
      rebalancePeriod: data.rebalancePeriod as RebalancePeriod,
    });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">백테스트 설정</CardTitle>
        <CardDescription className="text-slate-400">
          백테스트 조건을 설정하고 실행하세요 (최대 1년)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* 빠른 기간 선택 */}
          <div className="space-y-2">
            <Label className="text-slate-300">빠른 기간 선택</Label>
            <div className="flex flex-wrap gap-2">
              {periodPresets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePeriodPreset(preset.months)}
                  className="border-slate-600 text-slate-300 hover:bg-emerald-600/20 hover:text-emerald-400 hover:border-emerald-500/50"
                >
                  최근 {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 시작일 */}
            <div className="space-y-2">
              <Label className="text-slate-300">시작일</Label>
              <Input
                type="date"
                {...register('startDate')}
                className="bg-slate-900/50 border-slate-600 text-white"
              />
              {errors.startDate && (
                <p className="text-red-400 text-xs">{errors.startDate.message}</p>
              )}
            </div>

            {/* 종료일 */}
            <div className="space-y-2">
              <Label className="text-slate-300">종료일</Label>
              <Input
                type="date"
                {...register('endDate')}
                className="bg-slate-900/50 border-slate-600 text-white"
              />
              {errors.endDate && <p className="text-red-400 text-xs">{errors.endDate.message}</p>}
            </div>

            {/* 초기 자본금 */}
            <div className="space-y-2">
              <Label className="text-slate-300">초기 자본금 (원)</Label>
              <Input
                type="number"
                {...register('initialCapital', { valueAsNumber: true })}
                className="bg-slate-900/50 border-slate-600 text-white"
                step={1000000}
              />
              {errors.initialCapital && (
                <p className="text-red-400 text-xs">{errors.initialCapital.message}</p>
              )}
            </div>

            {/* 벤치마크 */}
            <div className="space-y-2">
              <Label className="text-slate-300">벤치마크</Label>
              <Select value={benchmarkValue} onValueChange={(val) => setValue('benchmark', val)}>
                <SelectTrigger className="w-full bg-slate-900/50 border-slate-600 text-white">
                  <SelectValue placeholder="벤치마크 선택" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {benchmarkOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-slate-200">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.benchmark && (
                <p className="text-red-400 text-xs">{errors.benchmark.message}</p>
              )}
            </div>

            {/* 리밸런싱 주기 */}
            <div className="space-y-2">
              <Label className="text-slate-300">리밸런싱 주기</Label>
              <Select
                value={rebalanceValue}
                onValueChange={(val) => setValue('rebalancePeriod', val)}
              >
                <SelectTrigger className="w-full bg-slate-900/50 border-slate-600 text-white">
                  <SelectValue placeholder="주기 선택" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {rebalanceOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-slate-200">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rebalancePeriod && (
                <p className="text-red-400 text-xs">{errors.rebalancePeriod.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                백테스트 실행 중...
              </span>
            ) : (
              '백테스트 실행'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
