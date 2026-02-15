'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getStockDetail, marketLabels, designationLabels } from '@/lib/api/stocks';
import {
  getPredictionsBySymbol,
  getScoreGrade,
  type PredictionHistory,
} from '@/lib/api/predictions';
import { PageSEO } from '@/components/seo';
import type { StockDetailResponse } from '@/lib/api/stocks';
import { Footer } from '@/components/layout/Footer';

const designationColors: Record<string, string> = {
  NORMAL: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CAUTION: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  WARNING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DANGER: 'bg-red-500/20 text-red-400 border-red-500/30',
  DELISTED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const designationAlertColors: Record<string, string> = {
  CAUTION: 'border-yellow-500/50 bg-yellow-500/10',
  WARNING: 'border-orange-500/50 bg-orange-500/10',
  DANGER: 'border-red-500/50 bg-red-500/10',
  DELISTED: 'border-slate-500/50 bg-slate-500/10',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function InfoItem({ label, value }: { label: string; value: string }) {
  const isEmpty = value === '-';
  return (
    <div className={isEmpty ? 'hidden md:block' : ''}>
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-white">{value}</p>
    </div>
  );
}

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [stock, setStock] = useState<StockDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionHistory[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  const fetchStock = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStockDetail(id);
      setStock(data);
    } catch (err) {
      console.error('종목 상세 조회 실패:', err);
      setError('종목 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isNaN(id)) {
      setError('잘못된 종목 ID입니다.');
      setIsLoading(false);
      return;
    }

    fetchStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // AI 분석 이력 가져오기
  useEffect(() => {
    if (!stock?.ticker) return;

    const fetchPredictions = async () => {
      setIsLoadingPredictions(true);
      try {
        const res = await getPredictionsBySymbol(stock.ticker, 20);
        setPredictions(res.predictions ?? []);
      } catch (err) {
        console.warn('AI 분석 이력 조회 실패:', err);
      } finally {
        setIsLoadingPredictions(false);
      }
    };

    fetchPredictions();
  }, [stock?.ticker]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-400">종목 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !stock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 p-8">
          <div className="text-center">
            <p className="text-xl text-red-400 mb-4">⚠️ {error || '종목을 찾을 수 없습니다.'}</p>
            <div className="space-x-4">
              {!isNaN(id) && (
                <Button
                  onClick={fetchStock}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  다시 시도
                </Button>
              )}
              <Link href="/stocks">
                <Button className="bg-emerald-600 hover:bg-emerald-700">종목 목록</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PageSEO
        title={`${stock.stockName} (${stock.ticker}) - Alpha Foundry`}
        description={`${stock.stockName} 종목 상세 정보 - ${marketLabels[stock.market]} 시장`}
      />
      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 */}
        <Button
          variant="ghost"
          onClick={() => router.push('/stocks')}
          className="text-slate-400 hover:text-white mb-6 -ml-2"
        >
          ← 종목 목록으로
        </Button>

        {/* Hero 섹션 */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{stock.stockName}</h1>
                {stock.stockNameEn && (
                  <span className="text-lg text-slate-400">{stock.stockNameEn}</span>
                )}
              </div>
              <p className="text-xl text-emerald-400 font-mono mb-4">{stock.ticker}</p>
            </div>
            {stock.currentPrice != null && (
              <div className="text-right">
                <p className="text-3xl font-bold text-white font-mono">
                  $
                  {stock.currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {stock.changePercent != null && (
                  <p
                    className={`text-sm font-medium ${stock.changePercent > 0 ? 'text-emerald-400' : stock.changePercent < 0 ? 'text-red-400' : 'text-slate-400'}`}
                  >
                    {stock.changePercent > 0 ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                    {stock.changeAmount != null && (
                      <span className="ml-1">
                        ({stock.changeAmount > 0 ? '+' : ''}
                        {stock.changeAmount.toFixed(2)})
                      </span>
                    )}
                  </p>
                )}
                {stock.priceDate && (
                  <p className="text-xs text-slate-500 mt-1">{stock.priceDate} 기준</p>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
              {marketLabels[stock.market]}
            </Badge>
            <Badge className={designationColors[stock.designationStatus] || ''}>
              {designationLabels[stock.designationStatus]}
            </Badge>
            {stock.isEtf && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">ETF</Badge>
            )}
            {!stock.isActive && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">비활성</Badge>
            )}
          </div>
        </div>

        {/* 지정상태 알림 (NORMAL이 아닌 경우) */}
        {stock.designationStatus !== 'NORMAL' && (
          <Alert className={`mb-8 ${designationAlertColors[stock.designationStatus] || ''}`}>
            <AlertDescription className="text-slate-200">
              <span className="font-semibold">
                투자 {designationLabels[stock.designationStatus]} 종목
              </span>
              {stock.designationReason && <span className="ml-2">— {stock.designationReason}</span>}
              {stock.designatedAt && (
                <span className="ml-2 text-slate-400">({formatDate(stock.designatedAt)} 지정)</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 기본 정보 카드 */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem label="거래소" value={stock.exchange || '-'} />
              <InfoItem label="시장" value={marketLabels[stock.market]} />
              <InfoItem label="섹터" value={stock.sector || '-'} />
              <InfoItem label="산업" value={stock.industry || '-'} />
              <InfoItem label="ETF 여부" value={stock.isEtf ? '예' : '아니오'} />
              <InfoItem label="레버리지 티커" value={stock.leverageTicker || '-'} />
            </div>
          </CardContent>
        </Card>

        {/* 시세 정보 카드 */}
        {stock.currentPrice != null && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">시세 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">전일 종가</p>
                  <p className="text-sm text-slate-300 font-mono">
                    {stock.previousClose != null
                      ? `$${stock.previousClose.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">시가</p>
                  <p className="text-sm text-slate-300 font-mono">
                    {stock.open != null
                      ? `$${stock.open.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">고가</p>
                  <p className="text-sm text-slate-300 font-mono">
                    {stock.high != null
                      ? `$${stock.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">저가</p>
                  <p className="text-sm text-slate-300 font-mono">
                    {stock.low != null
                      ? `$${stock.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">거래량</p>
                  <p className="text-sm text-slate-300 font-mono">
                    {stock.volume != null ? stock.volume.toLocaleString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">시가총액</p>
                  <p className="text-sm text-slate-300 font-mono">
                    {stock.marketCap != null ? `$${(stock.marketCap / 1e9).toFixed(1)}B` : '-'}
                  </p>
                </div>
              </div>
              {stock.trailingPE != null && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">PER</span>
                  <span className="text-sm text-slate-300 font-mono ml-2">
                    {stock.trailingPE.toFixed(2)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 상태 정보 카드 */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">상태 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">지정상태</p>
                <Badge className={designationColors[stock.designationStatus] || ''}>
                  {designationLabels[stock.designationStatus]}
                </Badge>
              </div>
              <InfoItem label="지정사유" value={stock.designationReason || '-'} />
              <InfoItem label="지정일" value={formatDate(stock.designatedAt)} />
              <div>
                <p className="text-sm text-slate-400 mb-1">활성상태</p>
                <Badge
                  className={
                    stock.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }
                >
                  {stock.isActive ? '활성' : '비활성'}
                </Badge>
              </div>
              <InfoItem label="등록일" value={formatDate(stock.createdAt)} />
              <InfoItem label="수정일" value={formatDate(stock.updatedAt)} />
            </div>
          </CardContent>
        </Card>

        {/* AI 분석 이력 */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">AI 분석 이력</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPredictions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-3"></div>
                <p className="text-slate-400 text-sm">분석 이력 로딩 중...</p>
              </div>
            ) : predictions.length > 0 ? (
              <>
                {/* Track record 요약 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-700/30 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-emerald-400">{predictions.length}</p>
                    <p className="text-xs text-slate-400">총 분석 횟수</p>
                  </div>
                  <div className="bg-slate-700/30 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-cyan-400">
                      {predictions.filter((p) => p.isRecommended).length}
                    </p>
                    <p className="text-xs text-slate-400">추천 횟수</p>
                  </div>
                  <div className="bg-slate-700/30 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {(
                        predictions.reduce((sum, p) => sum + p.compositeScore, 0) /
                        predictions.length
                      ).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">평균 점수</p>
                  </div>
                </div>

                {/* 타임라인 리스트 */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {predictions.map((p, idx) => {
                    const grade = getScoreGrade(p.compositeScore);
                    return (
                      <div
                        key={`${p.analysisDate}-${idx}`}
                        className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-400 font-mono w-24">
                            {p.analysisDate}
                          </span>
                          <Badge
                            className={`${grade.color} bg-slate-700/30 border-slate-600 text-xs`}
                          >
                            {grade.grade}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold ${grade.color}`}>
                            {p.compositeScore.toFixed(2)}
                          </span>
                          {p.isRecommended && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                              추천
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-center text-slate-500 py-8">
                이 종목에 대한 AI 분석 이력이 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* CTA 카드 - Primary/Secondary 위계 */}
        <div className="space-y-3 mb-6">
          <Link href="/recommendations">
            <Card className="bg-emerald-600/20 border-emerald-500/40 hover:border-emerald-400 transition-colors cursor-pointer">
              <CardContent className="pt-5 pb-5 flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-white">AI 분석 전체 보기</p>
                  <p className="text-xs text-slate-400">오늘의 AI 추천 종목을 확인하세요</p>
                </div>
                <span className="text-emerald-400 text-lg">→</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/strategies">
            <Card className="bg-slate-800/30 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-300">전략 둘러보기</p>
                  <p className="text-xs text-slate-500">검증된 퀀트 전략을 탐색하세요</p>
                </div>
                <span className="text-slate-500 text-sm">→</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
