import { NextRequest, NextResponse } from 'next/server';
import { insertEvent, isCaptchaEnabled } from '@/lib/db';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { sendSubmissionEmails } from '@/lib/email';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Verify reCAPTCHA (if enabled)
    if (isCaptchaEnabled()) {
      const recaptchaToken = formData.get('recaptchaToken') as string;
      if (recaptchaToken) {
        const valid = await verifyRecaptcha(recaptchaToken);
        if (!valid) {
          return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
        }
      }
    }

    // Validate required fields
    const required = ['name', 'date_time', 'venue', 'address', 'cost', 'description'];
    for (const field of required) {
      const value = formData.get(field) as string;
      if (!value || value.trim() === '') {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Validate email if provided
    const contactEmail = (formData.get('contact_email') as string)?.trim() || null;
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Handle image upload
    let imageFilename: string | null = null;
    const imageFile = formData.get('image') as File | null;

    if (imageFile && imageFile.size > 0) {
      if (!ALLOWED_TYPES.includes(imageFile.type)) {
        return NextResponse.json({ error: 'Invalid image type. Use JPG, PNG, WebP, or GIF.' }, { status: 400 });
      }
      if (imageFile.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Image too large. Maximum size is 5MB.' }, { status: 400 });
      }

      const ext = imageFile.type.split('/')[1] === 'jpeg' ? 'jpg' : imageFile.type.split('/')[1];
      imageFilename = `${crypto.randomUUID()}.${ext}`;

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await writeFile(path.join(uploadDir, imageFilename), buffer);
    }

    const { id, manage_token } = insertEvent({
      name: (formData.get('name') as string).trim(),
      date_time: formData.get('date_time') as string,
      venue: (formData.get('venue') as string).trim(),
      address: (formData.get('address') as string).trim(),
      cost: (formData.get('cost') as string).trim(),
      description: (formData.get('description') as string).trim(),
      sponsors: (formData.get('sponsors') as string)?.trim() || null,
      facebook_url: (formData.get('facebook_url') as string)?.trim() || null,
      website: (formData.get('website') as string)?.trim() || null,
      contact_name: (formData.get('contact_name') as string)?.trim() || '',
      contact_email: contactEmail || '',
      contact_phone: (formData.get('contact_phone') as string)?.trim() || null,
      image: imageFilename,
      tags: (formData.get('tags') as string)?.trim() || null,
      venue_website: (formData.get('venue_website') as string)?.trim() || null,
    });

    // Send notification emails (don't block the response)
    sendSubmissionEmails({
      name: (formData.get('name') as string).trim(),
      date_time: formData.get('date_time') as string,
      venue: (formData.get('venue') as string).trim(),
      address: (formData.get('address') as string).trim(),
      cost: (formData.get('cost') as string).trim(),
      description: (formData.get('description') as string).trim(),
      contact_name: (formData.get('contact_name') as string)?.trim() || null,
      contact_email: contactEmail,
      manage_token,
    }).catch((err) => console.error('Email send error:', err));

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    console.error('Event submission error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
