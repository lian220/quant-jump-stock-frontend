import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const initialCapital = searchParams.get('initialCapital');

  if (!tickers || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'tickers, startDate, endDate는 필수 파라미터입니다.' },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({ tickers, startDate, endDate });
  if (initialCapital) {
    params.append('initialCapital', initialCapital);
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/benchmarks/series?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '벤치마크 데이터를 조회할 수 없습니다.' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch benchmark series from backend:', error);
    return NextResponse.json({ error: '백엔드 서버에 연결할 수 없습니다.' }, { status: 503 });
  }
}
