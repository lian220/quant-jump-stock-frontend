import { NextResponse } from 'next/server';

/**
 * BE 응답의 Set-Cookie 헤더를 NextResponse 로 forward 한다.
 *
 * 주의:
 * - 단순 `.get('set-cookie')`는 다중 Set-Cookie 가 있을 때 마지막 값만 반환되므로
 *   반드시 `.getSetCookie()`(Next.js 15 / Node 22)로 모든 값을 가져온다.
 * - `append`를 써야 다중 cookie 가 모두 보존된다.
 * - BE 가 발급한 HttpOnly/Secure/SameSite/Domain 속성을 그대로 전달하기 위해
 *   문자열을 변조하지 않는다.
 */
export function forwardSetCookies(beResponse: Response, nextRes: NextResponse): NextResponse {
  const cookies = beResponse.headers.getSetCookie?.() ?? [];
  for (const cookie of cookies) {
    nextRes.headers.append('set-cookie', cookie);
  }
  return nextRes;
}

/**
 * 브라우저 요청의 Cookie 헤더를 BE 로 forward 할 수 있는 형태로 반환.
 * 빈 문자열이면 undefined 반환 (헤더 자체를 생략).
 */
export function forwardRequestCookies(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  return cookieHeader;
}
