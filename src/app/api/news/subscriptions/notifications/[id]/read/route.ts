import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = request.headers.get('Authorization');
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;

  try {
    const response = await fetch(`${API_URL}/api/v1/news/subscriptions/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to mark as read:', error);
    return NextResponse.json({ error: '서버 연결 실패' }, { status: 503 });
  }
}
