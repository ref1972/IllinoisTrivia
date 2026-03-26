"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateEventStatus, updateEvent, getEventByIdAdmin, setSetting, isCaptchaEnabled } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocode";
import { Event } from "@/lib/types";

export async function approveEvent(id: number) {
  await requireAdmin();
  updateEventStatus(id, "approved");

  // Geocode the address for the map
  const event = getEventByIdAdmin(id);
  if (event && !event.latitude) {
    const coords = await geocodeAddress(event.address);
    if (coords) {
      updateEvent(id, { latitude: coords.lat, longitude: coords.lng } as Partial<Event>);
    }
  }

  revalidatePath("/");
  revalidatePath("/map");
  revalidatePath("/admin");
}

export async function rejectEvent(id: number) {
  await requireAdmin();
  updateEventStatus(id, "rejected");
  revalidatePath("/admin");
}

export async function toggleCaptcha() {
  await requireAdmin();
  const current = isCaptchaEnabled();
  setSetting("captcha_enabled", current ? "false" : "true");
  revalidatePath("/admin");
  revalidatePath("/submit");
}

export async function saveEvent(id: number, data: Partial<Event>) {
  await requireAdmin();
  updateEvent(id, data);

  // Re-geocode if address changed
  if (data.address) {
    const coords = await geocodeAddress(data.address);
    if (coords) {
      updateEvent(id, { latitude: coords.lat, longitude: coords.lng } as Partial<Event>);
    }
  }

  revalidatePath("/");
  revalidatePath("/map");
  revalidatePath("/admin");
  revalidatePath(`/events/${id}`);
}
