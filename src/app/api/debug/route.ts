import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    API_URL: process.env.API_URL || 'not set',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'not set',
    NODE_ENV: process.env.NODE_ENV || 'not set',
  });
}
