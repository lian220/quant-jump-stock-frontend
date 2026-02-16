import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  try {
    const response = await fetch(`${API_URL}/api/v1/news/subscriptions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return NextResponse.json({ error: '서버 연결 실패' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/news/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('구독 처리 실패:', error);
    return NextResponse.json({ error: '서버 연결 실패' }, { status: 503 });
  }
}
