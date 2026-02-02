'use client';

import React, { useState } from 'react';
import { useNaverPay } from '@/hooks/useNaverPay';
import { NaverPaymentData, formatNaverAmount, generateNaverOrderId } from '@/lib/naver-pay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface NaverPayButtonProps {
  amount: number;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  userId?: string;
  orderId?: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const NaverPayButton = ({
  amount,
  orderName,
  customerName,
  customerEmail,
  userId,
  orderId,
  onSuccess,
  onError,
  disabled = false,
  className = '',
  children,
}: NaverPayButtonProps) => {
  const { requestPayment, loading, error, isConfigured } = useNaverPay();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      const paymentData: NaverPaymentData = {
        amount,
        orderId: orderId || generateNaverOrderId(),
        orderName,
        customerName,
        customerEmail,
        userId,
      };

      await requestPayment(paymentData);

      // 결제 성공 시 콜백 호출
      if (onSuccess) {
        onSuccess(paymentData.orderId);
      }
    } catch (err: unknown) {
      console.error('네이버페이 결제 처리 오류:', err);
      const error = err as { message?: string };
      if (onError) {
        onError(error.message || '결제 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 에러가 있을 때 onError 콜백 호출
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const isLoading = loading || isProcessing;
  const isDisabled = disabled || isLoading || amount <= 0 || !isConfigured;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-6">
        <div className="space-y-4">
          <Button
            onClick={handlePayment}
            disabled={isDisabled}
            className={`w-full bg-[#03C75A] hover:bg-[#02b351] text-white ${className}`}
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                결제 처리 중...
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm0-8h-6V7h6v2z"
                    fill="currentColor"
                  />
                </svg>
                <span>{children || `네이버페이 ${formatNaverAmount(amount)}`}</span>
              </div>
            )}
          </Button>

          {!isConfigured && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertDescription className="text-yellow-400">
                네이버페이가 설정되지 않았습니다. 환경변수를 확인해주세요.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 결제 정보 표시 */}
          <div className="space-y-3 text-sm border-t border-slate-700 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">상품명</span>
              <span className="font-medium text-white">{orderName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">결제 금액</span>
              <Badge className="font-bold text-lg bg-[#03C75A]/20 text-[#03C75A] border-[#03C75A]/30">
                {formatNaverAmount(amount)}
              </Badge>
            </div>
            {customerName && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">주문자</span>
                <span className="font-medium text-white">{customerName}</span>
              </div>
            )}
          </div>

          {/* 결제 수단 안내 */}
          <div className="text-xs text-slate-500 space-y-1 border-t border-slate-700 pt-4">
            <p>• 네이버페이 포인트 적립 및 사용 가능</p>
            <p>• 네이버 간편결제로 빠르고 안전한 결제</p>
            <p>• SSL 보안 연결로 안전한 거래</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
