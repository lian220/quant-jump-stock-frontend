import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10010';

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/v1/stats/public`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 }, // 60초 캐시
    });

    if (!response.ok) {
      return NextResponse.json({ userCount: 0 }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ userCount: 0 }, { status: 200 });
  }
}
