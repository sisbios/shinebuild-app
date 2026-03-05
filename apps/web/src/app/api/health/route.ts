import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    sha: process.env.GIT_SHA ?? 'dev',
    ts: Date.now(),
    service: 'shinebuild-web',
  });
}
