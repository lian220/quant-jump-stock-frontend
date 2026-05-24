import { NextRequest, NextResponse } from 'next/server';
import { forwardSetCookies } from '@/lib/proxy-cookies';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

/**
 * 로그아웃 프록시.
 * - Authorization 헤더 + refresh cookie 둘 다 가능 (BE 가 둘 중 하나로 식별)
 * - BE 가 응답하는 refresh cookie 만료(Max-Age=0) Set-Cookie 헤더를 브라우저로 forward
 */
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // 메모리 access token 부재 + refresh cookie 만 있는 경우에도 로그아웃 가능해야 함.
    // 둘 다 없으면 진짜 로그아웃 대상이 없으므로 401 대신 success 응답.
    if (!authorization && !cookieHeader) {
      return NextResponse.json({ success: true, message: '이미 로그아웃 상태입니다.' });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authorization) headers['Authorization'] = authorization;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const response = await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers,
    });

    const data = await response.json().catch(() => ({ success: response.ok }));

    return forwardSetCookies(response, NextResponse.json(data, { status: response.status }));
  } catch (error) {
    console.error('Logout proxy error:', error);
    return NextResponse.json(
      { success: false, message: '로그아웃 요청 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
