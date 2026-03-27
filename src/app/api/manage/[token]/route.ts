import { NextRequest, NextResponse } from 'next/server';
import { getEventByManageToken, insertChangeRequest, getPendingChangeRequests } from '@/lib/db';
import { sendChangeRequestNotification } from '@/lib/email';

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const event = getEventByManageToken(params.token);
    if (!event) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });

    // Only allow requests for approved events
    if (event.status !== 'approved') {
      return NextResponse.json({ error: 'Event is not active' }, { status: 400 });
    }

    // Check for already-pending request
    const pending = getPendingChangeRequests();
    const alreadyPending = pending.some(r => r.event_id === event.id);
    if (alreadyPending) {
      return NextResponse.json({ error: 'A change request is already pending for this event' }, { status: 409 });
    }

    const body = await request.json() as { type: 'update' | 'delete'; changes?: Record<string, unknown> };
    const { type, changes } = body;

    if (type !== 'update' && type !== 'delete') {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    if (type === 'update') {
      if (!changes || typeof changes !== 'object') {
        return NextResponse.json({ error: 'Changes are required for update requests' }, { status: 400 });
      }
      const allowed = ['name', 'date_time', 'venue', 'address', 'cost', 'description', 'sponsors', 'facebook_url', 'website', 'contact_name', 'contact_email', 'contact_phone'];
      const filtered = Object.fromEntries(Object.entries(changes).filter(([k]) => allowed.includes(k)));
      insertChangeRequest(event.id, 'update', filtered);
      sendChangeRequestNotification({ name: event.name, id: event.id }, 'update', filtered)
        .catch(err => console.error('Failed to send change request notification:', err));
    } else {
      insertChangeRequest(event.id, 'delete', null);
      sendChangeRequestNotification({ name: event.name, id: event.id }, 'delete', null)
        .catch(err => console.error('Failed to send change request notification:', err));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Change request error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
