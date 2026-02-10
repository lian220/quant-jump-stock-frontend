'use client';

import { v4 as uuidv4 } from 'uuid';
import type { PaymentData } from '@/types/payment';

// TossPayments 클라이언트 키 (환경변수에서 가져옴)
const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

// TossPayments 설정 확인
export const isTossPaymentsConfigured = !!clientKey;

// 주문번호 생성 (UUID 기반)
export const generateOrderId = (): string => {
  return `ORDER_${uuidv4()}`;
};

// 고객 키 생성 (UUID 기반, 실제로는 사용자 ID 사용 권장)
export const generateCustomerKey = (): string => {
  return `CUSTOMER_${uuidv4()}`;
};

// TossPayments 결제 요청
export const requestPayment = async (
  paymentData: PaymentData,
  customerKey: string,
): Promise<void> => {
  if (!isTossPaymentsConfigured) {
    throw new Error('TossPayments 클라이언트 키가 설정되지 않았습니다.');
  }

  // 브라우저 환경에서만 실행
  if (typeof window === 'undefined') {
    throw new Error('결제는 브라우저 환경에서만 가능합니다.');
  }

  try {
    // 동적 import로 TossPayments SDK 로드
    // @ts-expect-error - TossPayments SDK는 런타임에 동적으로 로드됩니다
    const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
    const tossPayments = await loadTossPayments(clientKey!);

    // 결제 요청
    await tossPayments.requestPayment({
      method: paymentData.method,
      amount: {
        currency: 'KRW',
        value: paymentData.amount,
      },
      orderId: paymentData.orderId,
      orderName: paymentData.orderName,
      successUrl: paymentData.successUrl || `${window.location.origin}/payment/success`,
      failUrl: paymentData.failUrl || `${window.location.origin}/payment/fail`,
      customerKey,
    });
  } catch (error) {
    console.error('TossPayments SDK 로드 실패:', error);
    throw new Error('결제 시스템을 불러오는데 실패했습니다.');
  }
};

// TossPayments 에러 코드 번역
export const translateErrorCode = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    USER_CANCEL: '사용자가 결제를 취소했습니다.',
    INVALID_CARD_NUMBER: '유효하지 않은 카드 번호입니다.',
    INVALID_EXPIRY: '유효하지 않은 유효기간입니다.',
    INVALID_CARD_COMPANY: '유효하지 않은 카드사입니다.',
    INVALID_PASSWORD: '카드 비밀번호가 올바르지 않습니다.',
    INCORRECT_CARD_INFO: '카드 정보가 올바르지 않습니다.',
    EXCEED_MAX_CARD_INSTALLMENT_PLAN: '할부 개월 수가 초과되었습니다.',
    INVALID_STOPPED_CARD: '정지된 카드입니다.',
    EXCEED_MAX_DAILY_PAYMENT_COUNT: '일일 결제 한도를 초과했습니다.',
    NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: '할부가 지원되지 않는 카드 또는 가맹점입니다.',
    INVALID_CARD_INSTALLMENT_PLAN: '유효하지 않은 할부 개월 수입니다.',
    NOT_SUPPORTED_MONTHLY_INSTALLMENT_PLAN: '할부가 지원되지 않는 카드입니다.',
    EXCEED_MAX_PAYMENT_AMOUNT: '결제 금액이 한도를 초과했습니다.',
    INVALID_CARD_LOST_OR_STOLEN: '분실/도난 카드입니다.',
    RESTRICTED_TRANSFER_ACCOUNT: '계좌 이체가 제한된 계좌입니다.',
    INVALID_ACCOUNT_INFO: '계좌 정보가 올바르지 않습니다.',
    ACCOUNT_HOLDER_MISMATCH: '예금주가 일치하지 않습니다.',
    EXCEED_MAX_AMOUNT: '이체 금액이 한도를 초과했습니다.',
    INVALID_ACCOUNT_NUMBER: '유효하지 않은 계좌번호입니다.',
    TRANSFER_LIMIT_EXCEEDED: '이체 한도를 초과했습니다.',
    UNKNOWN_PAYMENT_ERROR: '알 수 없는 결제 오류가 발생했습니다.',
    NOT_FOUND_PAYMENT: '결제 정보를 찾을 수 없습니다.',
    ALREADY_PROCESSED_PAYMENT: '이미 처리된 결제입니다.',
    PROVIDER_ERROR: '결제 대행사 오류가 발생했습니다.',
    FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING: '결제 시스템 처리 중 오류가 발생했습니다.',
  };

  return errorMessages[errorCode] || `결제 오류가 발생했습니다. (${errorCode})`;
};
