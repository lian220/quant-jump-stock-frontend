import { NextRequest, NextResponse } from 'next/server';

// 서버 사이드: API_URL 우선
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params;
    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/auth/oauth2/code/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('OAuth code exchange proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'OAuth 인증 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
