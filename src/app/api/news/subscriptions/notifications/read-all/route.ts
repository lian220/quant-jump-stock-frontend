import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function PATCH(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  try {
    const response = await fetch(`${API_URL}/api/v1/news/subscriptions/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return new NextResponse(null, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('전체 읽음 처리 실패:', error);
    return NextResponse.json({ error: '서버 연결 실패' }, { status: 503 });
  }
}
