import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const authorization = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');

  try {
    const response = await fetch(`${API_URL}/api/v1/notifications?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { Authorization: authorization }),
        ...(cookie && { Cookie: cookie }),
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '알림을 가져올 수 없습니다.' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: '백엔드 서버에 연결할 수 없습니다.' }, { status: 503 });
  }
}
