import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getAllSubscribers } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** RFC 4180: quote every field, double any embedded quotes. */
function csvCell(value: string): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscribers = getAllSubscribers();
  const rows = [
    ['email', 'region', 'signed_up'].map(csvCell).join(','),
    ...subscribers.map(sub => [sub.email, sub.region, sub.created_at].map(csvCell).join(',')),
  ];

  const filename = `illinoistrivia-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(rows.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
