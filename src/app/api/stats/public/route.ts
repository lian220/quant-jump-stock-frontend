import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/v1/stats/public`, {
      method: 'GET',
      next: { revalidate: 60 }, // 60초 캐시
    });

    if (!response.ok) {
      console.error(`[stats/public] 업스트림 오류: ${response.status} ${response.statusText}`);
      return NextResponse.json({ userCount: 0 }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[stats/public] fetch 실패:', err);
    return NextResponse.json({ userCount: 0 }, { status: 503 });
  }
}
