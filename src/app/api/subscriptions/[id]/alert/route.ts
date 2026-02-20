import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

/** PATCH /api/subscriptions/[id]/alert → 알림 설정 변경 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await fetch(`${API_URL}/api/v1/subscriptions/${id}/alert`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '알림 설정 변경 실패' },
        { status: response.status, headers: NO_CACHE_HEADERS },
      );
    }

    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Failed to update subscription alert:', error);
    return NextResponse.json(
      { error: '백엔드 서버에 연결할 수 없습니다.' },
      { status: 503, headers: NO_CACHE_HEADERS },
    );
  }
}
