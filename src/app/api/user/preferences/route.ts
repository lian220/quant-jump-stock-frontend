import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      return NextResponse.json(
        { success: false, message: '인증 토큰이 필요합니다.' },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_URL}/api/v1/user/preferences`, {
      method: 'GET',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      if (!data) {
        data = { success: false, message: '성향 조회에 실패했습니다.' };
      }
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Preferences GET proxy error:', error);
    return NextResponse.json(
      { success: false, message: '성향 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

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

    const response = await fetch(`${API_URL}/api/v1/user/preferences`, {
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
      if (!data) {
        data = { success: false, message: '성향 저장에 실패했습니다.' };
      }
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Preferences PUT proxy error:', error);
    return NextResponse.json(
      { success: false, message: '성향 저장 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
