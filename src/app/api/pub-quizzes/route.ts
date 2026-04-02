import { NextRequest, NextResponse } from 'next/server';
import { insertPubQuiz, updatePubQuiz } from '@/lib/db';
import { sendPubQuizSubmissionEmails } from '@/lib/email';
import { geocodeAddress } from '@/lib/geocode';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const required = ['venue', 'address', 'city', 'day_of_week', 'start_time'];
    for (const field of required) {
      if (!body[field]?.trim()) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const { id, manage_token } = insertPubQuiz({
      venue: body.venue.trim(),
      address: body.address.trim(),
      city: body.city.trim(),
      day_of_week: body.day_of_week,
      start_time: body.start_time.trim(),
      quiz_company: body.quiz_company?.trim() || null,
      host: body.host?.trim() || null,
      description: body.description?.trim() || null,
      format: body.format || null,
      venue_website: body.venue_website?.trim() || null,
      website: body.website?.trim() || null,
      submitter_name: body.submitter_name?.trim() || null,
      submitter_email: body.submitter_email?.trim() || null,
    });

    // Geocode in background — don't block the response
    geocodeAddress(`${body.address}, ${body.city}, IL`).then(coords => {
      if (coords) updatePubQuiz(id, { latitude: coords.lat, longitude: coords.lng });
    }).catch(() => {});

    await sendPubQuizSubmissionEmails({
      venue: body.venue,
      city: body.city,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      submitter_name: body.submitter_name || null,
      submitter_email: body.submitter_email || null,
    });

    return NextResponse.json({ success: true, manage_token });
  } catch (err) {
    console.error('Pub quiz submission error:', err);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
