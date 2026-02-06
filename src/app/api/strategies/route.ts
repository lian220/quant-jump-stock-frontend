import { NextRequest, NextResponse } from 'next/server';

// 서버 사이드: API_URL 우선 (Docker 내부 네트워크), 없으면 로컬 기본값
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();

  try {
    const url = `${API_URL}/api/v1/marketplace/strategies${queryString ? `?${queryString}` : ''}`;

    const authorization = request.headers.get('authorization');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { Authorization: authorization }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '전략 목록을 가져올 수 없습니다.' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch strategies from backend:', error);
    return NextResponse.json({ error: '백엔드 서버에 연결할 수 없습니다.' }, { status: 503 });
  }
}
