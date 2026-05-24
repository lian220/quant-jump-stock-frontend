import { NextRequest, NextResponse } from 'next/server';
import { forwardSetCookies } from '@/lib/proxy-cookies';

// 서버 사이드: API_URL 우선
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // BE 가 발급한 refresh cookie 등 Set-Cookie 헤더를 브라우저로 forward
    return forwardSetCookies(response, NextResponse.json(data, { status: response.status }));
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { success: false, message: '로그인 요청 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
