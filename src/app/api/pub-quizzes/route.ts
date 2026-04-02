import { NextRequest, NextResponse } from 'next/server';
import { insertPubQuiz, updatePubQuiz } from '@/lib/db';
import { sendPubQuizSubmissionEmails } from '@/lib/email';
import { geocodeAddress } from '@/lib/geocode';
import { writeFile, mkdir } from 'fs/promises';
import crypto from 'crypto';
import { UPLOAD_DIR } from '@/lib/uploads';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const venue = (formData.get('venue') as string)?.trim();
    const address = (formData.get('address') as string)?.trim();
    const city = (formData.get('city') as string)?.trim();
    const start_time = (formData.get('start_time') as string)?.trim();
    const event_type = (formData.get('event_type') as string) || 'recurring';

    if (!venue || !address || !city || !start_time) {
      return NextResponse.json({ error: 'venue, address, city, and start_time are required' }, { status: 400 });
    }

    if (event_type === 'recurring' && !formData.get('day_of_week')) {
      return NextResponse.json({ error: 'day_of_week is required for recurring events' }, { status: 400 });
    }
    if (event_type === 'one_off' && !formData.get('event_date')) {
      return NextResponse.json({ error: 'event_date is required for one-off events' }, { status: 400 });
    }

    // Handle image upload
    let imageFilename: string | null = null;
    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      if (!ALLOWED_TYPES.includes(imageFile.type)) {
        return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
      }
      if (imageFile.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Image too large. Max 5MB.' }, { status: 400 });
      }
      const ext = imageFile.type.split('/')[1] === 'jpeg' ? 'jpg' : imageFile.type.split('/')[1];
      imageFilename = `${crypto.randomUUID()}.${ext}`;
      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(`${UPLOAD_DIR}/${imageFilename}`, Buffer.from(await imageFile.arrayBuffer()));
    }

    const { id, manage_token } = insertPubQuiz({
      venue,
      address,
      city,
      day_of_week: (formData.get('day_of_week') as string) || null,
      start_time,
      event_type: event_type as 'recurring' | 'one_off',
      event_date: (formData.get('event_date') as string) || null,
      image: imageFilename,
      quiz_company: (formData.get('quiz_company') as string)?.trim() || null,
      host: (formData.get('host') as string)?.trim() || null,
      description: (formData.get('description') as string)?.trim() || null,
      format: (formData.get('format') as 'pen_paper' | 'mobile_app') || null,
      venue_website: (formData.get('venue_website') as string)?.trim() || null,
      website: (formData.get('website') as string)?.trim() || null,
      submitter_name: (formData.get('submitter_name') as string)?.trim() || null,
      submitter_email: (formData.get('submitter_email') as string)?.trim() || null,
    });

    // Geocode in background
    geocodeAddress(`${address}, ${city}, IL`).then(coords => {
      if (coords) updatePubQuiz(id, { latitude: coords.lat, longitude: coords.lng });
    }).catch(() => {});

    await sendPubQuizSubmissionEmails({
      venue,
      city,
      day_of_week: (formData.get('day_of_week') as string) || null,
      start_time,
      submitter_name: (formData.get('submitter_name') as string) || null,
      submitter_email: (formData.get('submitter_email') as string) || null,
    });

    return NextResponse.json({ success: true, manage_token });
  } catch (err) {
    console.error('Pub quiz submission error:', err);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
