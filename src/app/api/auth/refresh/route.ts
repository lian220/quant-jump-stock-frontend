import { NextRequest, NextResponse } from 'next/server';
import { forwardSetCookies } from '@/lib/proxy-cookies';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

/**
 * Access token 재발급 프록시.
 *
 * 브라우저는 httpOnly refresh cookie 를 same-origin(:3000) 으로 보내고,
 * 이 라우트가 cookie 를 BE 의 /api/v1/auth/refresh 로 forward 한다.
 * BE 는 새 access token JSON + (필요 시) rotation 된 refresh cookie 를 반환한다.
 *
 * Phase 1A 보안 PRE:
 * - rotation 은 미구현 (별도 Task) — BE 는 refresh cookie 재발급하지 않을 수 있음
 * - BE Task 12 미구현 단계에서는 항상 401 이지만, 프록시 자체는 미리 준비됨
 */
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');

    if (!cookieHeader) {
      return NextResponse.json(
        { success: false, message: 'refresh token 이 없습니다.' },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      // Cache-Control: no-store 는 BE 가 응답에 명시해야 함 (Cloudflare 캐시 회피)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({
        success: false,
        message: 'refresh 실패',
      }));
      return forwardSetCookies(response, NextResponse.json(data, { status: response.status }));
    }

    const data = await response.json();
    return forwardSetCookies(response, NextResponse.json(data));
  } catch (error) {
    console.error('Refresh proxy error:', error);
    return NextResponse.json(
      { success: false, message: '토큰 재발급 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
