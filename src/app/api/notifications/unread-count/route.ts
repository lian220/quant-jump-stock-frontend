import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api/config';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');

  try {
    const response = await fetch(`${API_URL}/api/v1/notifications/unread-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { Authorization: authorization }),
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '미읽음 카운트를 가져올 수 없습니다.' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: '백엔드 서버에 연결할 수 없습니다.' }, { status: 503 });
  }
}
