import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

/** GET /api/subscriptions → 내 구독 목록 조회 */
export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/subscriptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '구독 목록 조회 실패' },
        { status: response.status, headers: NO_CACHE_HEADERS },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return NextResponse.json(
      { error: '백엔드 서버에 연결할 수 없습니다.' },
      { status: 503, headers: NO_CACHE_HEADERS },
    );
  }
}
