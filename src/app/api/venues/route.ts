import { NextRequest, NextResponse } from 'next/server';
import { searchVenues } from '@/lib/db';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const venues = searchVenues(q);
  return NextResponse.json(venues);
}
