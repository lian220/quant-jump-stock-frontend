import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();

  try {
    const response = await fetch(
      `${API_URL}/api/v1/news/by-tags${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: '태그별 뉴스를 가져올 수 없습니다.' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch news by tags:', error);
    return NextResponse.json({ error: '백엔드 서버에 연결할 수 없습니다.' }, { status: 503 });
  }
}
