'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function NaverPayCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'fail'>('loading');
  const [paymentInfo, setPaymentInfo] = useState<{
    resultCode: string | null;
    paymentId: string | null;
    merchantPayKey: string | null;
    resultMessage: string | null;
  }>({
    resultCode: null,
    paymentId: null,
    merchantPayKey: null,
    resultMessage: null,
  });

  useEffect(() => {
    const resultCode = searchParams.get('resultCode');
    const paymentId = searchParams.get('paymentId');
    const merchantPayKey = searchParams.get('merchantPayKey');
    const resultMessage = searchParams.get('resultMessage');

    setPaymentInfo({
      resultCode,
      paymentId,
      merchantPayKey,
      resultMessage,
    });

    if (resultCode === 'Success') {
      setStatus('success');
    } else {
      setStatus('fail');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mx-auto mb-4" />
            <p className="text-white">결제 결과를 확인하고 있습니다...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="max-w-md mx-auto px-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            {status === 'success' ? (
              <>
                <CheckCircle className="h-16 w-16 text-[#03C75A] mx-auto mb-4" />
                <CardTitle className="text-2xl text-white">결제 완료</CardTitle>
                <p className="text-slate-400">네이버페이 결제가 성공적으로 완료되었습니다.</p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <CardTitle className="text-2xl text-white">결제 실패</CardTitle>
                <p className="text-slate-400">결제 처리 중 문제가 발생했습니다.</p>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 bg-slate-700/30 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-slate-400">결제 상태</span>
                <Badge
                  className={
                    status === 'success'
                      ? 'bg-[#03C75A]/20 text-[#03C75A] border-[#03C75A]/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }
                >
                  {status === 'success' ? '성공' : '실패'}
                </Badge>
              </div>
              {paymentInfo.paymentId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">결제 ID</span>
                  <span className="text-white font-mono text-sm">{paymentInfo.paymentId}</span>
                </div>
              )}
              {paymentInfo.merchantPayKey && (
                <div className="flex justify-between">
                  <span className="text-slate-400">주문번호</span>
                  <span className="text-white font-mono text-sm">{paymentInfo.merchantPayKey}</span>
                </div>
              )}
              {paymentInfo.resultMessage && status === 'fail' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">오류 메시지</span>
                  <span className="text-red-400 text-sm">{paymentInfo.resultMessage}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  홈으로
                </Button>
              </Link>
              <Link href="/payment" className="flex-1">
                <Button className="w-full bg-[#03C75A] hover:bg-[#02b351]">
                  {status === 'success' ? '추가 결제' : '다시 시도'}
                </Button>
              </Link>
            </div>

            {status === 'success' && (
              <p className="text-xs text-slate-500 text-center">
                결제 내역은 마이페이지에서 확인하실 수 있습니다.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-white">결제 결과를 확인하고 있습니다...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NaverPayCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NaverPayCallbackContent />
    </Suspense>
  );
}
