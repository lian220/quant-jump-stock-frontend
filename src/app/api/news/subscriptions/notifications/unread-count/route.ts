import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth) return NextResponse.json({ unreadCount: 0 });

  try {
    const response = await fetch(
      `${API_URL}/api/v1/news/subscriptions/notifications/unread-count`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        signal: AbortSignal.timeout(10000),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ unreadCount: 0 });
  }
}
