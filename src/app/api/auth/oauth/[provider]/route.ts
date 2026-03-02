import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api/config';

const ALLOWED_PROVIDERS = new Set(['naver']);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params;

    if (!ALLOWED_PROVIDERS.has(provider)) {
      return NextResponse.json(
        { success: false, message: '지원하지 않는 OAuth 제공자입니다.' },
        { status: 400 },
      );
    }

    const body = await request.json();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/v1/auth/oauth2/code/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('OAuth code exchange proxy error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: 'OAuth 인증 요청 시간이 초과되었습니다.' },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { success: false, message: 'OAuth 인증 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
