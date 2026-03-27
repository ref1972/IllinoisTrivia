import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getEventsWithoutCoords, updateEvent } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocode";
import { Event } from "@/lib/types";

export async function POST() {
  try {
    const admin = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const events = getEventsWithoutCoords();
    let fixed = 0;

    for (const event of events) {
      const coords = await geocodeAddress(event.address);
      if (coords) {
        updateEvent(event.id, { latitude: coords.lat, longitude: coords.lng } as Partial<Event>);
        fixed++;
      }
      // Nominatim rate limit: 1 request/second
      await new Promise(resolve => setTimeout(resolve, 1100));
    }

    return NextResponse.json({ total: events.length, fixed });
  } catch (err) {
    console.error("Regeocode error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
