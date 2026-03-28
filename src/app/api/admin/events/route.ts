import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { insertEventAdmin, updateEvent, upsertVenue } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocode";
import { Event } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const id = insertEventAdmin(body);

    if (body.address) {
      const coords = await geocodeAddress(body.address);
      if (coords) updateEvent(id, { latitude: coords.lat, longitude: coords.lng } as Partial<Event>);
    }
    if (body.venue && body.address) {
      upsertVenue(body.venue as string, body.address as string, (body.venue_website as string | null) ?? null);
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Admin create event error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
