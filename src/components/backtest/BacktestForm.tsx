'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type {
  BacktestRunRequest,
  BenchmarkType,
  RebalancePeriod,
  BenchmarkOption,
  RiskSettings,
  PositionSizingMethod,
  SlippageType,
  UniverseType,
} from '@/types/backtest';
import { getAvailableBenchmarks } from '@/lib/api/backtest';
import { MAX_BACKTEST_DAYS, MAX_BENCHMARKS } from '@/constants/backtest';

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
  /** 전략에 저장된 기본 리스크 설정 (JSON string) */
  defaultRiskSettings?: string;
  /** 전략에 저장된 기본 포지션 사이징 설정 (JSON string) */
  defaultPositionSizing?: string;
  /** 전략에 저장된 기본 거래 비용 설정 (JSON string) */
  defaultTradingCosts?: string;
  /** SCRUM-344: 전략이 지원하는 유니버스 타입 목록 */
  supportedUniverseTypes?: UniverseType[];
  /** SCRUM-344: 전략의 추천 유니버스 타입 */
  recommendedUniverseType?: UniverseType;
}

const defaultBenchmarkOptions: BenchmarkOption[] = [
  { value: '^KS11', label: 'KOSPI (^KS11)' },
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

  // 윤년으로 인해 12개월이 366일이 될 수 있으므로 시작일 +1일 보정
  const diffDays = (today.getTime() - result.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > MAX_BACKTEST_DAYS) {
    result.setDate(result.getDate() + Math.ceil(diffDays - MAX_BACKTEST_DAYS));
  }

  return result.toISOString().split('T')[0];
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// 포지션 사이징 옵션
const positionSizingOptions: { value: PositionSizingMethod; label: string }[] = [
  { value: 'FIXED_PERCENTAGE', label: '고정 비율' },
  { value: 'EQUAL_WEIGHT', label: '동일 비중' },
  { value: 'KELLY', label: '켈리 공식' },
  { value: 'VOLATILITY_TARGET', label: '변동성 타겟' },
  { value: 'RISK_PARITY', label: '리스크 패리티' },
];

// 용어 설명 툴팁 컴포넌트
function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="inline-block w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help ml-1 shrink-0" />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs bg-slate-800 text-slate-200 border-slate-600 text-xs leading-relaxed"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

// SCRUM-344: 유니버스 타입 옵션
const universeTypeLabels: Record<UniverseType, string> = {
  MARKET: '전체 시장',
  PORTFOLIO: '전략 기본 종목',
  SECTOR: '섹터별',
  FIXED: '지정 종목',
};

// 슬리피지 모델 옵션
const slippageOptions: { value: SlippageType; label: string }[] = [
  { value: 'NONE', label: '없음' },
  { value: 'FIXED', label: '고정' },
  { value: 'ADAPTIVE', label: '적응형 (거래량 기반)' },
];

export default function BacktestForm({
  strategyId,
  onSubmit,
  isLoading,
  defaultRiskSettings,
  defaultPositionSizing,
  defaultTradingCosts,
  supportedUniverseTypes,
  recommendedUniverseType,
}: BacktestFormProps) {
  const [benchmarkOptions, setBenchmarkOptions] =
    useState<BenchmarkOption[]>(defaultBenchmarkOptions);
  const [additionalBenchmarks, setAdditionalBenchmarks] = useState<string[]>([]);
  const [showBenchmarkCompare, setShowBenchmarkCompare] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // SCRUM-344: 유니버스 타입 선택
  const [universeType, setUniverseType] = useState<UniverseType | undefined>(
    recommendedUniverseType,
  );

  // 리스크 설정 상태
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [stopLossValue, setStopLossValue] = useState(5);
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
  const [takeProfitValue, setTakeProfitValue] = useState(10);
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(false);
  const [trailingStopValue, setTrailingStopValue] = useState(3);

  // 포지션 사이징 상태
  const [positionMethod, setPositionMethod] = useState<PositionSizingMethod>('FIXED_PERCENTAGE');
  const [maxPositionPct, setMaxPositionPct] = useState(20);
  const [maxPositions, setMaxPositions] = useState(10);

  // 거래 비용 상태
  const [commissionRate, setCommissionRate] = useState(0.015);
  const [taxRate, setTaxRate] = useState(0.23);
  const [slippageModel, setSlippageModel] = useState<SlippageType>('FIXED');
  const [baseSlippage, setBaseSlippage] = useState(0.1);

  // 전략 기본 리스크 설정 로드
  useEffect(() => {
    if (defaultRiskSettings && defaultRiskSettings !== '{}') {
      try {
        const rs = JSON.parse(defaultRiskSettings);
        if (rs.stopLoss?.enabled) {
          setStopLossEnabled(true);
          setStopLossValue(rs.stopLoss.value ?? rs.stopLoss.percentage ?? 5);
        }
        if (rs.takeProfit?.enabled) {
          setTakeProfitEnabled(true);
          setTakeProfitValue(rs.takeProfit.value ?? rs.takeProfit.percentage ?? 10);
        }
        if (rs.trailingStop?.enabled) {
          setTrailingStopEnabled(true);
          setTrailingStopValue(rs.trailingStop.value ?? rs.trailingStop.percentage ?? 3);
        }
        setShowAdvanced(true);
      } catch {
        /* 파싱 실패 무시 */
      }
    }
    if (defaultPositionSizing && defaultPositionSizing !== '{}') {
      try {
        const ps = JSON.parse(defaultPositionSizing);
        if (ps.method) setPositionMethod(ps.method);
        if (ps.maxPositionPct != null) setMaxPositionPct(ps.maxPositionPct);
        if (ps.maxPositions != null) setMaxPositions(ps.maxPositions);
        setShowAdvanced(true);
      } catch {
        /* 파싱 실패 무시 */
      }
    }
    if (defaultTradingCosts && defaultTradingCosts !== '{}') {
      try {
        const tc = JSON.parse(defaultTradingCosts);
        if (tc.commissionRate != null) setCommissionRate(tc.commissionRate);
        if (tc.taxRate != null) setTaxRate(tc.taxRate);
        if (tc.slippageModel) setSlippageModel(tc.slippageModel);
        if (tc.baseSlippage != null) setBaseSlippage(tc.baseSlippage);
        setShowAdvanced(true);
      } catch {
        /* 파싱 실패 무시 */
      }
    }
  }, [defaultRiskSettings, defaultPositionSizing, defaultTradingCosts]);

  // 동적 벤치마크 로딩
  useEffect(() => {
    getAvailableBenchmarks()
      .then((options) => {
        if (options && options.length > 0) {
          setBenchmarkOptions(options);
          // 현재 선택된 벤치마크가 새 옵션에 없으면 첫 번째 옵션으로 변경
          const currentBenchmark = watch('benchmark');
          const hasCurrentBenchmark = options.some((opt) => opt.value === currentBenchmark);
          if (!hasCurrentBenchmark) {
            setValue('benchmark', options[0].value);
          }
        }
      })
      .catch(() => {
        // 실패 시 기존 SPY/QQQ fallback 유지
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      benchmark: '^KS11',
      rebalancePeriod: 'MONTHLY',
    },
  });

  const benchmarkValue = watch('benchmark');
  const rebalanceValue = watch('rebalancePeriod');
  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');

  // UX-02: 선택 기간 일수 계산
  const selectedDays = useMemo(() => {
    if (!watchStartDate || !watchEndDate) return 0;
    const start = new Date(watchStartDate);
    const end = new Date(watchEndDate);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [watchStartDate, watchEndDate]);

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
    // SCRUM-337: 다중 벤치마크 목록 구성 (primary + additional, 중복 제거)
    const allBenchmarks = [
      data.benchmark,
      ...additionalBenchmarks.filter((b) => b !== data.benchmark),
    ];

    const request: BacktestRunRequest = {
      strategyId,
      startDate: data.startDate,
      endDate: data.endDate,
      initialCapital: data.initialCapital,
      benchmark: data.benchmark as BenchmarkType,
      benchmarks: allBenchmarks.length > 1 ? allBenchmarks : undefined,
      rebalancePeriod: data.rebalancePeriod as RebalancePeriod,
      // SCRUM-344: 유니버스 타입
      universeType,
    };

    // 고급 설정이 한번이라도 열렸고 값이 설정되어 있으면 리스크 파라미터 추가
    const hasRiskSettings = stopLossEnabled || takeProfitEnabled || trailingStopEnabled;
    const hasCustomPositionSizing =
      positionMethod !== 'FIXED_PERCENTAGE' || maxPositionPct !== 20 || maxPositions !== 10;
    const hasCustomCosts =
      commissionRate !== 0.015 ||
      taxRate !== 0.23 ||
      slippageModel !== 'FIXED' ||
      baseSlippage !== 0.1;
    if (showAdvanced || hasRiskSettings || hasCustomPositionSizing || hasCustomCosts) {
      const riskSettings: RiskSettings = {};
      if (stopLossEnabled) {
        riskSettings.stopLoss = { enabled: true, type: 'PERCENTAGE', value: stopLossValue };
      }
      if (takeProfitEnabled) {
        riskSettings.takeProfit = { enabled: true, type: 'PERCENTAGE', value: takeProfitValue };
      }
      if (trailingStopEnabled) {
        riskSettings.trailingStop = {
          enabled: true,
          type: 'PERCENTAGE',
          value: trailingStopValue,
          activationThreshold: null,
        };
      }
      if (stopLossEnabled || takeProfitEnabled || trailingStopEnabled) {
        request.riskSettings = riskSettings;
      }

      request.positionSizing = {
        method: positionMethod,
        maxPositionPct,
        maxPositions,
        riskPerTrade: null,
      };

      request.tradingCosts = {
        commission: commissionRate / 100,
        tax: taxRate / 100,
        slippageModel: {
          type: slippageModel,
          baseSlippage: baseSlippage / 100,
          volumeImpact: null,
        },
      };
    }

    onSubmit(request);
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
                max={getTodayString()}
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
                max={getTodayString()}
                className="bg-slate-900/50 border-slate-600 text-white"
              />
              {errors.endDate && <p className="text-red-400 text-xs">{errors.endDate.message}</p>}
              {/* UX-02: 선택 기간 일수 카운터 */}
              {selectedDays > 0 && (
                <p
                  className={`text-xs ${selectedDays > MAX_BACKTEST_DAYS ? 'text-red-400' : 'text-slate-500'}`}
                >
                  선택 기간: {selectedDays}일 / 최대 {MAX_BACKTEST_DAYS}일
                </p>
              )}
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
              <Label className="text-slate-300">주요 벤치마크</Label>
              <Select
                value={benchmarkValue}
                onValueChange={(val) => {
                  setValue('benchmark', val);
                  // 주요 벤치마크가 변경되면 추가 벤치마크에서 제거
                  setAdditionalBenchmarks((prev) => prev.filter((b) => b !== val));
                }}
              >
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
              {/* SCRUM-337: 추가 벤치마크 비교 (접기/펼치기) */}
              {benchmarkOptions.length > 1 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowBenchmarkCompare(!showBenchmarkCompare)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                    aria-expanded={showBenchmarkCompare}
                  >
                    <span
                      className={`transform transition-transform ${showBenchmarkCompare ? 'rotate-90' : ''}`}
                    >
                      ▶
                    </span>
                    <span>비교 벤치마크 추가</span>
                    {additionalBenchmarks.length > 0 && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-1.5 py-0.5">
                        {additionalBenchmarks.length}개 선택됨
                      </span>
                    )}
                  </button>
                  {showBenchmarkCompare && (
                    <div className="mt-1.5">
                      <p className="text-xs text-slate-500 mb-1.5">
                        최대 {MAX_BENCHMARKS - 1}개 선택 가능
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {benchmarkOptions
                          .filter((opt) => opt.value !== benchmarkValue)
                          .map((opt) => {
                            const isSelected = additionalBenchmarks.includes(opt.value);
                            const canAdd = additionalBenchmarks.length < MAX_BENCHMARKS - 1;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                disabled={!isSelected && !canAdd}
                                onClick={() => {
                                  setAdditionalBenchmarks((prev) =>
                                    isSelected
                                      ? prev.filter((b) => b !== opt.value)
                                      : [...prev, opt.value],
                                  );
                                }}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'
                                    : canAdd
                                      ? 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                                      : 'border-slate-700 text-slate-600 cursor-not-allowed'
                                }`}
                              >
                                {isSelected ? `✕ ${opt.label}` : `+ ${opt.label}`}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
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

            {/* SCRUM-344: 유니버스 타입 */}
            {supportedUniverseTypes && supportedUniverseTypes.length > 1 && (
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center">
                  백테스트 대상
                  <InfoTip text="백테스트에 사용할 종목 범위를 선택합니다. 전체 시장: 등록된 모든 종목, 전략 기본 종목: 전략에 설정된 포트폴리오 종목" />
                </Label>
                <Select
                  value={universeType || recommendedUniverseType || 'MARKET'}
                  onValueChange={(val) => setUniverseType(val as UniverseType)}
                >
                  <SelectTrigger className="w-full bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue placeholder="대상 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {supportedUniverseTypes.map((ut) => (
                      <SelectItem key={ut} value={ut} className="text-slate-200">
                        {universeTypeLabels[ut]}
                        {ut === recommendedUniverseType && ' (추천)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* 고급 설정 토글 */}
          <div className="border-t border-slate-700 pt-4">
            {/* UX-03: 고급 설정 토글 개선 */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                aria-expanded={showAdvanced}
              >
                <span
                  className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                >
                  ▶
                </span>
                <span>전문가 설정</span>
                <span className="text-xs text-slate-500 font-normal">
                  (선택사항 - 초보자는 기본값 권장)
                </span>
              </button>
              {showAdvanced && (
                <button
                  type="button"
                  onClick={() => {
                    setStopLossEnabled(false);
                    setTakeProfitEnabled(false);
                    setTrailingStopEnabled(false);
                    setPositionMethod('FIXED_PERCENTAGE');
                    setMaxPositionPct(20);
                    setMaxPositions(10);
                    setCommissionRate(0.015);
                    setTaxRate(0.23);
                    setSlippageModel('FIXED');
                    setBaseSlippage(0.1);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  권장값으로 초기화
                </button>
              )}
            </div>

            {showAdvanced && (
              <div className="mt-4 space-y-6">
                {/* 리스크 설정 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center">
                    리스크 설정
                    <InfoTip text="매매 시 손실을 제한하고 수익을 확정하기 위한 자동 매도 규칙입니다." />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 손절 */}
                    <div className="space-y-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stopLossEnabled}
                          onChange={(e) => setStopLossEnabled(e.target.checked)}
                          className="rounded border-slate-600 bg-slate-800 text-emerald-500"
                        />
                        <span className="text-sm text-slate-300 flex items-center">
                          손절 (Stop Loss)
                          <InfoTip text="매입가 대비 설정 비율만큼 하락하면 자동으로 매도하여 손실을 제한합니다." />
                        </span>
                      </label>
                      {stopLossEnabled && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={stopLossValue}
                            onChange={(e) => setStopLossValue(Number(e.target.value))}
                            className="bg-slate-900/50 border-slate-600 text-white w-20"
                            min={0.1}
                            max={50}
                            step={0.1}
                          />
                          <span className="text-xs text-slate-400">% 하락 시 매도</span>
                        </div>
                      )}
                    </div>

                    {/* 익절 */}
                    <div className="space-y-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={takeProfitEnabled}
                          onChange={(e) => setTakeProfitEnabled(e.target.checked)}
                          className="rounded border-slate-600 bg-slate-800 text-emerald-500"
                        />
                        <span className="text-sm text-slate-300 flex items-center">
                          익절 (Take Profit)
                          <InfoTip text="매입가 대비 설정 비율만큼 상승하면 자동으로 매도하여 수익을 확정합니다." />
                        </span>
                      </label>
                      {takeProfitEnabled && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={takeProfitValue}
                            onChange={(e) => setTakeProfitValue(Number(e.target.value))}
                            className="bg-slate-900/50 border-slate-600 text-white w-20"
                            min={0.1}
                            max={100}
                            step={0.1}
                          />
                          <span className="text-xs text-slate-400">% 상승 시 매도</span>
                        </div>
                      )}
                    </div>

                    {/* 트레일링 스탑 */}
                    <div className="space-y-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trailingStopEnabled}
                          onChange={(e) => setTrailingStopEnabled(e.target.checked)}
                          className="rounded border-slate-600 bg-slate-800 text-emerald-500"
                        />
                        <span className="text-sm text-slate-300 flex items-center">
                          트레일링 스탑
                          <InfoTip text="최고가 대비 설정 비율만큼 하락하면 매도합니다. 상승 추세를 추종하면서 수익을 보호합니다." />
                        </span>
                      </label>
                      {trailingStopEnabled && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={trailingStopValue}
                            onChange={(e) => setTrailingStopValue(Number(e.target.value))}
                            className="bg-slate-900/50 border-slate-600 text-white w-20"
                            min={0.1}
                            max={30}
                            step={0.1}
                          />
                          <span className="text-xs text-slate-400">% 고점 대비 하락 시</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 포지션 사이징 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center">
                    포지션 사이징
                    <InfoTip text="한 종목에 투자할 금액 비율을 결정하는 방법입니다. 리스크 분산을 위해 적절한 포지션 크기 관리가 중요합니다." />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400 flex items-center">
                        사이징 방법
                        <InfoTip text="고정 비율: 자본의 일정 비율 투자 / 동일 비중: 모든 종목에 동일 금액 / 켈리 공식: 승률 기반 최적 비율 / 변동성 타겟: 목표 변동성에 맞춰 조절 / 리스크 패리티: 리스크 기여도 균등 배분" />
                      </Label>
                      <Select
                        value={positionMethod}
                        onValueChange={(val) => setPositionMethod(val as PositionSizingMethod)}
                      >
                        <SelectTrigger className="w-full bg-slate-900/50 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {positionSizingOptions.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="text-slate-200"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400 flex items-center">
                        최대 포지션 비율 (%)
                        <InfoTip text="총 자본 대비 한 종목에 투자할 수 있는 최대 비율입니다." />
                      </Label>
                      <Input
                        type="number"
                        value={maxPositionPct}
                        onChange={(e) => setMaxPositionPct(Number(e.target.value))}
                        className="bg-slate-900/50 border-slate-600 text-white"
                        min={1}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400 flex items-center">
                        최대 포지션 수
                        <InfoTip text="동시에 보유할 수 있는 최대 종목 수입니다." />
                      </Label>
                      <Input
                        type="number"
                        value={maxPositions}
                        onChange={(e) => setMaxPositions(Number(e.target.value))}
                        className="bg-slate-900/50 border-slate-600 text-white"
                        min={1}
                        max={50}
                        step={1}
                      />
                    </div>
                  </div>
                </div>

                {/* 거래 비용 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center">
                    거래 비용
                    <InfoTip text="실제 거래 시 발생하는 수수료, 세금, 슬리피지를 반영하여 보다 현실적인 수익률을 계산합니다." />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400 flex items-center">
                        수수료율 (%)
                        <InfoTip text="매매 시 증권사에 지불하는 수수료입니다. 국내 온라인 거래 기준 약 0.015%입니다." />
                      </Label>
                      <Input
                        type="number"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                        className="bg-slate-900/50 border-slate-600 text-white"
                        min={0}
                        max={5}
                        step={0.001}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400 flex items-center">
                        세금율 (%, 매도 시)
                        <InfoTip text="매도 시 부과되는 증권거래세입니다. 코스피 0.18%, 코스닥 0.23%가 일반적입니다." />
                      </Label>
                      <Input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="bg-slate-900/50 border-slate-600 text-white"
                        min={0}
                        max={5}
                        step={0.01}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400 flex items-center">
                        슬리피지 모델
                        <InfoTip text="주문가와 실제 체결가의 차이입니다. 없음: 미적용 / 고정: 일정 비율 / 적응형: 거래량에 따라 변동" />
                      </Label>
                      <Select
                        value={slippageModel}
                        onValueChange={(val) => setSlippageModel(val as SlippageType)}
                      >
                        <SelectTrigger className="w-full bg-slate-900/50 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {slippageOptions.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="text-slate-200"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {slippageModel !== 'NONE' && (
                    <div className="w-48">
                      <Label className="text-xs text-slate-400 flex items-center">
                        기본 슬리피지 (%)
                        <InfoTip text="기본적으로 적용되는 슬리피지 비율입니다. 유동성이 낮은 종목일수록 슬리피지가 클 수 있습니다." />
                      </Label>
                      <Input
                        type="number"
                        value={baseSlippage}
                        onChange={(e) => setBaseSlippage(Number(e.target.value))}
                        className="bg-slate-900/50 border-slate-600 text-white"
                        min={0}
                        max={5}
                        step={0.01}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
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
