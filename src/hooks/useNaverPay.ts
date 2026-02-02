'use client';

import { useState, useCallback } from 'react';
import {
  NaverPaymentData,
  requestNaverPayment,
  generateNaverOrderId,
  translateNaverPayErrorCode,
  isNaverPayConfigured,
} from '@/lib/naver-pay';

export const useNaverPay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 결제 요청 함수
  const handleRequestPayment = useCallback(async (data: NaverPaymentData) => {
    if (!isNaverPayConfigured) {
      setError('네이버페이가 설정되지 않았습니다. 환경변수를 확인해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 주문번호가 없으면 생성
      const paymentData: NaverPaymentData = {
        ...data,
        orderId: data.orderId || generateNaverOrderId(),
      };

      // 네이버페이 결제창 호출
      await requestNaverPayment(paymentData);

      // 성공 시 returnUrl로 리다이렉트되므로 여기는 실행되지 않음
    } catch (err: unknown) {
      console.error('네이버페이 결제 요청 실패:', err);

      let errorMessage = '결제 요청 중 오류가 발생했습니다.';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'code' in err) {
        const errorCode = (err as { code: string }).code;
        errorMessage = translateNaverPayErrorCode(errorCode);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    requestPayment: handleRequestPayment,
    loading,
    error,
    clearError,
    isConfigured: isNaverPayConfigured,
  };
};
