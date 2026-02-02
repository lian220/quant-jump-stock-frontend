import { NextRequest, NextResponse } from 'next/server';

// 환경변수
const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_PAY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.NAVER_PAY_CLIENT_SECRET || '';
const CHAIN_ID = process.env.NEXT_PUBLIC_NAVER_PAY_CHAIN_ID || '';
const MODE = process.env.NEXT_PUBLIC_NAVER_PAY_MODE || 'development';

// API 베이스 URL
const getApiBaseUrl = () => {
  return MODE === 'production'
    ? 'https://apis.naver.com/naverpay-partner/naverpay'
    : 'https://dev.apis.naver.com/naverpay-partner/naverpay';
};

interface ReserveRequest {
  merchantPayKey: string;
  productName: string;
  totalPayAmount: number;
  taxScopeAmount: number;
  taxExScopeAmount: number;
  merchantUserKey: string;
  returnUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    // 설정 확인
    if (!CLIENT_ID || !CLIENT_SECRET || !CHAIN_ID) {
      return NextResponse.json(
        { error: '네이버페이 설정이 완료되지 않았습니다.' },
        { status: 500 },
      );
    }

    const body: ReserveRequest = await request.json();

    // 필수 필드 검증
    if (!body.merchantPayKey || !body.productName || !body.totalPayAmount) {
      return NextResponse.json({ error: '필수 결제 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 네이버페이 결제 예약 API 호출
    const apiUrl = `${getApiBaseUrl()}/payments/v2/reserve`;

    const reserveData = {
      modelVersion: '2',
      merchantPayKey: body.merchantPayKey,
      productName: body.productName,
      productCount: 1,
      totalPayAmount: body.totalPayAmount,
      taxScopeAmount: body.taxScopeAmount,
      taxExScopeAmount: body.taxExScopeAmount,
      returnUrl: body.returnUrl,
      merchantUserKey: body.merchantUserKey,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': CLIENT_ID,
        'X-Naver-Client-Secret': CLIENT_SECRET,
        'X-NaverPay-Chain-Id': CHAIN_ID,
      },
      body: JSON.stringify(reserveData),
    });

    const data = await response.json();

    if (data.code !== 'Success' && data.code !== 'PA0000') {
      console.error('네이버페이 예약 실패:', data);
      return NextResponse.json(
        { error: data.message || '결제 예약 실패', code: data.code },
        { status: 400 },
      );
    }

    // 결제 페이지 URL 생성
    const paymentBaseUrl =
      MODE === 'production'
        ? 'https://order.pay.naver.com/checkout'
        : 'https://test-order.pay.naver.com/checkout';

    const paymentUrl = `${paymentBaseUrl}?reserveId=${data.body?.reserveId}`;

    return NextResponse.json({
      success: true,
      reserveId: data.body?.reserveId,
      paymentUrl,
    });
  } catch (error) {
    console.error('네이버페이 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
