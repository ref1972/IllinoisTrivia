import { NextResponse } from 'next/server';
import { isCaptchaEnabled } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    captcha_enabled: isCaptchaEnabled(),
  });
}
