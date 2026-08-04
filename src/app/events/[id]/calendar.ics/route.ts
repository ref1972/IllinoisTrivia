import { NextResponse } from 'next/server';
import { getEventById } from '@/lib/db';
import { eventToIcs } from '@/lib/ics';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const event = getEventById(id);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const ics = eventToIcs(event, 'https://illinoistrivia.com');
  if (!ics) {
    return NextResponse.json({ error: 'Event has no usable date' }, { status: 422 });
  }

  const filename = `${event.name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'event'}.ics`;

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
