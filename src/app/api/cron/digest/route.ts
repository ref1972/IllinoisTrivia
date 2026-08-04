import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendWeeklyDigest } from '@/lib/email';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get('authorization') ?? '';
  const provided = header.replace(/^Bearer\s+/i, '');

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendWeeklyDigest();
    console.log(`[digest] sent to ${result.recipients} subscriber(s) covering ${result.events} event(s)`);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[digest] failed:', err);
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 });
  }
}
