import { NextRequest, NextResponse } from 'next/server';

// 서버 사이드: API_URL 우선 (Docker 내부 네트워크), 없으면 로컬 기본값
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const response = await fetch(`${API_URL}/api/v1/marketplace/strategies/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '전략을 찾을 수 없습니다.' },
        { status: response.status, headers: NO_CACHE_HEADERS },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Failed to fetch strategy from backend:', error);
    return NextResponse.json(
      { error: '백엔드 서버에 연결할 수 없습니다.' },
      { status: 503, headers: NO_CACHE_HEADERS },
    );
  }
}
