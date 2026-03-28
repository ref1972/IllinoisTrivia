import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { isAdmin } from '@/lib/auth';
import { getEventByIdAdmin, updateEvent, upsertVenue } from '@/lib/db';
import { UPLOAD_DIR } from '@/lib/uploads';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const event = getEventByIdAdmin(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (err) {
    console.error('Admin GET event error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();

    // If image is being cleared, delete the file from disk
    if ('image' in body && body.image === null) {
      const current = getEventByIdAdmin(id);
      if (current?.image) {
        await unlink(`${UPLOAD_DIR}/${current.image}`).catch(() => {});
      }
    }

    updateEvent(id, body);
    if (body.venue && body.address) {
      upsertVenue(body.venue as string, body.address as string, (body.venue_website as string | null) ?? null);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin PATCH event error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
