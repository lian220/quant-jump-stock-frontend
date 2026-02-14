import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = request.headers.get('authorization');

  try {
    const response = await fetch(`${API_URL}/api/v1/backtest/${encodeURIComponent(id)}/enhanced`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { Authorization: authorization }),
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '강화 백테스트 결과를 가져올 수 없습니다.' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to fetch enhanced backtest for ${id}:`, error);
    const message =
      error instanceof DOMException && error.name === 'TimeoutError'
        ? '백엔드 서버 응답 시간이 초과되었습니다.'
        : '백엔드 서버에 연결할 수 없습니다.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
