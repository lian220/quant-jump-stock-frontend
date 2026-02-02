'use client';

// 환경변수 확인
const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_PAY_CLIENT_ID || '';
const MERCHANT_ID = process.env.NEXT_PUBLIC_NAVER_PAY_MERCHANT_ID || '';
const CHAIN_ID = process.env.NEXT_PUBLIC_NAVER_PAY_CHAIN_ID || '';
const MODE = process.env.NEXT_PUBLIC_NAVER_PAY_MODE || 'development';

// 네이버페이 설정 여부 확인
export const isNaverPayConfigured = !!(CLIENT_ID && MERCHANT_ID && CHAIN_ID);

// 네이버페이 SDK 타입 정의
declare global {
  interface Window {
    naver?: {
      NaverPayButton?: {
        apply: (config: NaverPayButtonConfig) => void;
      };
    };
    Naver?: NaverPaySDK;
  }
}

interface NaverPaySDK {
  Pay: {
    create: (config: NaverPayConfig) => NaverPayInstance;
  };
}

interface NaverPayButtonConfig {
  BUTTON_KEY: string;
  TYPE: 'A' | 'B' | 'C' | 'D' | 'MA' | 'MB';
  COLOR: 1 | 2 | 3;
  COUNT: number;
  ENABLE: 'Y' | 'N';
  BUY_BUTTON_HANDLER?: () => void;
  WISHLIST_BUTTON_HANDLER?: () => void;
}

interface NaverPayConfig {
  mode: 'development' | 'production';
  clientId: string;
  chainId: string;
}

interface NaverPayInstance {
  open: (options: NaverPayOpenOptions) => void;
}

interface NaverPayOpenOptions {
  merchantUserKey: string;
  merchantPayKey: string;
  productName: string;
  totalPayAmount: number;
  taxScopeAmount: number;
  taxExScopeAmount: number;
  returnUrl: string;
}

// 네이버페이 결제 데이터 타입
export interface NaverPaymentData {
  orderId: string;
  orderName: string;
  amount: number;
  userId?: string;
  customerEmail?: string;
  customerName?: string;
}

// 네이버페이 결제 URL 생성 (개발/운영 환경)
export const getNaverPayBaseUrl = () => {
  return MODE === 'production'
    ? 'https://pay.naver.com/o/checkout'
    : 'https://test-pay.naver.com/o/checkout';
};

// 네이버페이 초기화 확인
export const initializeNaverPay = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!isNaverPayConfigured) {
      reject(new Error('네이버페이가 설정되지 않았습니다. 환경변수를 확인해주세요.'));
      return;
    }
    resolve(true);
  });
};

// 주문 ID 생성
export const generateNaverOrderId = (): string => {
  return 'naver_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
};

// 사용자 키 생성
export const generateMerchantUserKey = (userId?: string): string => {
  return userId || 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
};

// 결제 요청 (백엔드 API 호출 방식)
export const requestNaverPayment = async (paymentData: NaverPaymentData): Promise<void> => {
  try {
    await initializeNaverPay();

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const orderId = paymentData.orderId || generateNaverOrderId();

    // 백엔드 API를 통해 네이버페이 결제 예약 생성
    const response = await fetch('/api/payments/naver/reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantPayKey: orderId,
        productName: paymentData.orderName,
        totalPayAmount: paymentData.amount,
        taxScopeAmount: paymentData.amount,
        taxExScopeAmount: 0,
        merchantUserKey: generateMerchantUserKey(paymentData.userId),
        returnUrl: `${baseUrl}/payment/naver-callback`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '결제 예약 생성 실패');
    }

    const data = await response.json();

    // 네이버페이 결제 페이지로 리다이렉트
    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
    } else {
      throw new Error('결제 URL을 받지 못했습니다.');
    }
  } catch (error: unknown) {
    console.error('네이버페이 결제 요청 오류:', error);
    throw error;
  }
};

// 금액 포맷팅
export const formatNaverAmount = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
};

// 결제 상태 번역
export const translateNaverPayStatus = (status: string): string => {
  const translations: Record<string, string> = {
    SUCCESS: '결제 완료',
    FAIL: '결제 실패',
    CANCEL: '결제 취소',
    PENDING: '결제 대기',
  };

  return translations[status] || status;
};

// 에러 메시지 번역
export const translateNaverPayErrorCode = (code: string): string => {
  const errorMessages: Record<string, string> = {
    userCancel: '사용자가 결제를 취소했습니다.',
    paymentTimeExpire: '결제 시간이 만료되었습니다.',
    invalidMerchant: '유효하지 않은 가맹점입니다.',
    invalidProduct: '유효하지 않은 상품 정보입니다.',
    insufficientBalance: '잔액이 부족합니다.',
    systemError: '시스템 오류가 발생했습니다.',
  };

  return errorMessages[code] || '알 수 없는 오류가 발생했습니다.';
};

// URL에서 결제 결과 파라미터 파싱
export const parseNaverPayResult = () => {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const resultCode = urlParams.get('resultCode');
  const paymentId = urlParams.get('paymentId');
  const merchantPayKey = urlParams.get('merchantPayKey');

  if (resultCode) {
    return {
      resultCode,
      paymentId,
      merchantPayKey,
      isSuccess: resultCode === 'Success',
    };
  }

  return null;
};
