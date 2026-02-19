import { NextRequest, NextResponse } from 'next/server';
import { MAX_BACKTEST_DAYS } from '@/constants/backtest';

// 서버 사이드: API_URL 우선 (Docker 내부 네트워크), 없으면 로컬 기본값
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

// 백테스트 기간 검증
function validateBacktestPeriod(
  startDate: string,
  endDate: string,
): { valid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { valid: false, error: '시작일과 종료일을 모두 입력하세요.' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: '올바른 날짜 형식이 아닙니다.' };
  }

  if (end < start) {
    return { valid: false, error: '종료일은 시작일 이후여야 합니다.' };
  }

  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > MAX_BACKTEST_DAYS) {
    return {
      valid: false,
      error: `백테스트 기간은 최대 1년(${MAX_BACKTEST_DAYS}일)까지 가능합니다. 현재: ${Math.ceil(diffDays)}일`,
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  // 런타임 타입 검증
  if (typeof body.startDate !== 'string' || !body.startDate) {
    return NextResponse.json({ error: 'startDate는 문자열이어야 합니다.' }, { status: 400 });
  }
  if (typeof body.endDate !== 'string' || !body.endDate) {
    return NextResponse.json({ error: 'endDate는 문자열이어야 합니다.' }, { status: 400 });
  }

  // 서버사이드 기간 검증
  const periodValidation = validateBacktestPeriod(body.startDate, body.endDate);
  if (!periodValidation.valid) {
    return NextResponse.json({ error: periodValidation.error }, { status: 400 });
  }

  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃
    const response = await fetch(`${API_URL}/api/v1/backtest/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '백테스트 실행에 실패했습니다.' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to run backtest:', error);
    return NextResponse.json({ error: '백엔드 서버에 연결할 수 없습니다.' }, { status: 503 });
  }
}
