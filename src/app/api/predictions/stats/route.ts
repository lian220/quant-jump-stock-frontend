import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

/** 백엔드 등급(A~F) → 프론트엔드 등급(EXCELLENT~LOW) 매핑 */
const GRADE_MAP: Record<string, string> = {
  A: 'EXCELLENT',
  B: 'EXCELLENT',
  C: 'GOOD',
  D: 'FAIR',
  F: 'LOW',
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();

  try {
    const response = await fetch(
      `${API_URL}/api/v1/predictions/stats${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '통계 데이터를 가져올 수 없습니다.' },
        { status: response.status },
      );
    }

    const data = await response.json();

    // 백엔드 응답을 프론트엔드 기대 형식으로 변환
    const stats = data.stats || data;

    // 등급 분포 매핑 (B/C/D → EXCELLENT/GOOD/FAIR/LOW)
    const rawDist: Record<string, number> = stats.gradeDistribution || {};
    const mappedDist: Record<string, number> = {};
    for (const [grade, count] of Object.entries(rawDist)) {
      const mapped = GRADE_MAP[grade] || 'LOW';
      mappedDist[mapped] = (mappedDist[mapped] || 0) + count;
    }

    const normalized = {
      totalPredictions: stats.total ?? stats.totalPredictions ?? 0,
      uniqueTickers: stats.uniqueTickers ?? 0,
      avgCompositeScore: Number(stats.averageCompositeScore ?? stats.avgCompositeScore ?? 0),
      gradeDistribution: mappedDist,
      dateRange: stats.dateRange ?? {
        from: data.period?.split(' ~ ')[0] ?? '',
        to: data.period?.split(' ~ ')[1] ?? '',
      },
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Failed to fetch prediction stats:', error);
    const message =
      error instanceof DOMException && error.name === 'TimeoutError'
        ? '백엔드 서버 응답 시간이 초과되었습니다.'
        : '백엔드 서버에 연결할 수 없습니다.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
