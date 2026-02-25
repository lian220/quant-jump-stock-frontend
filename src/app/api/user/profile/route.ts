import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function PUT(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        { success: false, message: '인증 토큰이 필요합니다.' },
        { status: 401 },
      );
    }

    const body = await request.json();

    // /api/auth/me에서 userId를 가져오기
    const meRes = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    });

    if (!meRes.ok) {
      return NextResponse.json(
        { success: false, message: '사용자 인증에 실패했습니다.' },
        { status: 401 },
      );
    }

    const meData = await meRes.json();
    const userId = meData.user?.userId ?? meData.data?.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 정보를 찾을 수 없습니다.' },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_URL}/api/v1/users/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      return NextResponse.json(data ?? { success: false, message: '프로필 수정에 실패했습니다.' }, {
        status: response.status,
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Profile update proxy error:', error);
    return NextResponse.json(
      { success: false, message: '프로필 수정 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
