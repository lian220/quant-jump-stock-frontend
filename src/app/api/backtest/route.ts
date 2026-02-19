import { NextRequest, NextResponse } from 'next/server';

// 서버 사이드: API_URL 우선 (Docker 내부 네트워크), 없으면 로컬 기본값
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

const NO_CACHE_HEADERS = { 'Cache-Control': 'private, no-cache' } as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const cookie = request.headers.get('cookie');
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/v1/backtest?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie && { Cookie: cookie }),
        Authorization: authorization,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '백테스트 목록 조회에 실패했습니다.' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Failed to fetch backtest list:', error);
    const message =
      error instanceof DOMException && error.name === 'TimeoutError'
        ? '백엔드 서버 응답 시간이 초과되었습니다.'
        : '백엔드 서버에 연결할 수 없습니다.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
