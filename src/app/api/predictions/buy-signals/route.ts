import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

/**
 * 매수 신호 종목 조회 프록시 API
 * CORS 우회를 위한 Next.js API Route
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();

  const authorization = request.headers.get('authorization');

  try {
    const response = await fetch(
      `${API_URL}/api/v1/predictions/buy-signals${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authorization && { Authorization: authorization }),
        },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '매수 신호를 가져올 수 없습니다.' },
        { status: response.status },
      );
    }

    const data = await response.json();
    if (process.env.NODE_ENV === 'development') {
      console.log('[Proxy] Backend response item count:', data.buySignals?.length ?? 0);
    }
    // Backend 응답 형식을 Frontend 기대 형식으로 변환 (숫자 필드 정규화)
    const NUMERIC_FIELDS = [
      'compositeScore',
      'techScore',
      'aiScore',
      'sentimentScore',
      'currentPrice',
      'targetPrice',
      'upsidePercent',
    ] as const;

    const normalized = (data.buySignals || []).map((signal: Record<string, unknown>) => {
      const result = { ...signal };
      for (const field of NUMERIC_FIELDS) {
        if (result[field] != null) {
          result[field] = Number(result[field]);
        }
      }
      return result;
    });

    return NextResponse.json({ data: normalized });
  } catch (error) {
    console.error('Failed to fetch buy signals from backend:', error);
    const message =
      error instanceof DOMException && error.name === 'TimeoutError'
        ? '백엔드 서버 응답 시간이 초과되었습니다.'
        : '백엔드 서버에 연결할 수 없습니다.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
