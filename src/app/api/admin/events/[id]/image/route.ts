import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { updateEvent } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import crypto from 'crypto';
import { UPLOAD_DIR } from '@/lib/uploads';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }

    if (imageFile.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image too large. Max 5MB.' }, { status: 400 });
    }

    const ext = imageFile.type.split('/')[1] === 'jpeg' ? 'jpg' : imageFile.type.split('/')[1];
    const filename = `${crypto.randomUUID()}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await writeFile(`${UPLOAD_DIR}/${filename}`, buffer);

    updateEvent(id, { image: filename } as never);

    return NextResponse.json({ success: true, filename });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
