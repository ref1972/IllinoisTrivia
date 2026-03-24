import { NextRequest, NextResponse } from 'next/server';
import { insertEvent } from '@/lib/db';
import { verifyRecaptcha } from '@/lib/recaptcha';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify reCAPTCHA
    if (body.recaptchaToken) {
      const valid = await verifyRecaptcha(body.recaptchaToken);
      if (!valid) {
        return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
      }
    }

    // Validate required fields
    const required = ['name', 'date_time', 'venue', 'address', 'cost', 'description', 'contact_name', 'contact_email'];
    for (const field of required) {
      if (!body[field] || typeof body[field] !== 'string' || body[field].trim() === '') {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contact_email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const id = insertEvent({
      name: body.name.trim(),
      date_time: body.date_time,
      venue: body.venue.trim(),
      address: body.address.trim(),
      cost: body.cost.trim(),
      description: body.description.trim(),
      sponsors: body.sponsors?.trim() || null,
      facebook_url: body.facebook_url?.trim() || null,
      website: body.website?.trim() || null,
      contact_name: body.contact_name.trim(),
      contact_email: body.contact_email.trim(),
      contact_phone: body.contact_phone?.trim() || null,
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
