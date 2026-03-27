import { NextResponse } from 'next/server';
import { readdir, unlink } from 'fs/promises';
import { isAdmin } from '@/lib/auth';
import { getAllEventImageFilenames } from '@/lib/db';
import { UPLOAD_DIR } from '@/lib/uploads';

export async function POST() {
  try {
    const admin = await isAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const usedFilenames = new Set(getAllEventImageFilenames());
    const allFiles = await readdir(UPLOAD_DIR).catch(() => [] as string[]);

    let deleted = 0;
    for (const file of allFiles) {
      if (!usedFilenames.has(file)) {
        await unlink(`${UPLOAD_DIR}/${file}`).catch(() => {});
        deleted++;
      }
    }

    return NextResponse.json({ total: allFiles.length, deleted });
  } catch (err) {
    console.error('Cleanup images error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
