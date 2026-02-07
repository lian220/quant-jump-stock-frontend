'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getStockDetail, marketLabels, designationLabels } from '@/lib/api/stocks';
import type { StockDetailResponse } from '@/lib/api/stocks';

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
  return (
    <div>
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
              <Button
                onClick={fetchStock}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                다시 시도
              </Button>
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
      {/* 헤더 */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  퀀트점프
                </h1>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                >
                  BETA
                </Badge>
              </Link>
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="/strategies"
                  className="text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  전략 마켓플레이스
                </Link>
                <Link href="/stocks" className="text-emerald-400 font-medium">
                  종목 탐색
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  로그인
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-emerald-600 hover:bg-emerald-700">무료 시작</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

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
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-white">{stock.stockName}</h2>
            {stock.stockNameEn && (
              <span className="text-lg text-slate-400">{stock.stockNameEn}</span>
            )}
          </div>
          <p className="text-xl text-emerald-400 font-mono mb-4">{stock.ticker}</p>
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
      </main>

      {/* 푸터 */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500">
            <p className="mb-2">퀀트점프 - AI 기반 스마트 투자 플랫폼</p>
            <p className="text-sm">&copy; 2025 QuantJump. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
