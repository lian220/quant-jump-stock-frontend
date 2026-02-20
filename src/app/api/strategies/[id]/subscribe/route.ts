import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

/** POST /api/strategies/[id]/subscribe → 전략 구독 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/strategies/${id}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '구독 요청 실패' },
        { status: response.status, headers: NO_CACHE_HEADERS },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Failed to subscribe strategy:', error);
    return NextResponse.json(
      { error: '백엔드 서버에 연결할 수 없습니다.' },
      { status: 503, headers: NO_CACHE_HEADERS },
    );
  }
}

/** DELETE /api/strategies/[id]/subscribe → 전략 구독 취소 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/strategies/${id}/subscribe`, {
      method: 'DELETE',
      headers: {
        Authorization: authorization,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '구독 취소 실패' },
        { status: response.status, headers: NO_CACHE_HEADERS },
      );
    }

    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Failed to unsubscribe strategy:', error);
    return NextResponse.json(
      { error: '백엔드 서버에 연결할 수 없습니다.' },
      { status: 503, headers: NO_CACHE_HEADERS },
    );
  }
}
