"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  updateEventStatus, updateEvent, getEventByIdAdmin,
  setSetting, isCaptchaEnabled, deleteEvent,
  duplicateEvent, insertEventAdmin,
} from "@/lib/db";
import { geocodeAddress } from "@/lib/geocode";
import { notifySubscribers } from "@/lib/email";
import { Event } from "@/lib/types";

function revalidateAll(id?: number) {
  revalidatePath("/");
  revalidatePath("/map");
  revalidatePath("/admin");
  revalidatePath("/past-events");
  if (id) revalidatePath(`/events/${id}`);
}

export async function approveEvent(id: number) {
  await requireAdmin();
  updateEventStatus(id, "approved");
  const event = getEventByIdAdmin(id);
  if (event) {
    if (!event.latitude) {
      const coords = await geocodeAddress(event.address);
      if (coords) updateEvent(id, { latitude: coords.lat, longitude: coords.lng } as Partial<Event>);
    }
    notifySubscribers(event).catch(err => console.error("Failed to notify subscribers:", err));
  }
  revalidateAll(id);
}

export async function rejectEvent(id: number) {
  await requireAdmin();
  updateEventStatus(id, "rejected");
  revalidateAll();
}

export async function bulkApprove(ids: number[]) {
  await requireAdmin();
  for (const id of ids) {
    updateEventStatus(id, "approved");
    const event = getEventByIdAdmin(id);
    if (event) {
      if (!event.latitude) {
        const coords = await geocodeAddress(event.address);
        if (coords) updateEvent(id, { latitude: coords.lat, longitude: coords.lng } as Partial<Event>);
      }
      notifySubscribers(event).catch(err => console.error("Failed to notify subscribers:", err));
    }
  }
  revalidateAll();
}

export async function bulkReject(ids: number[]) {
  await requireAdmin();
  for (const id of ids) updateEventStatus(id, "rejected");
  revalidateAll();
}

export async function removeEvent(id: number) {
  await requireAdmin();
  deleteEvent(id);
  revalidateAll();
}

export async function cloneEvent(id: number) {
  await requireAdmin();
  const newId = duplicateEvent(id);
  revalidateAll();
  redirect(`/admin/edit/${newId}`);
}

export async function createEvent(data: Partial<Event>) {
  await requireAdmin();
  const newId = insertEventAdmin(data);
  if (data.address) {
    const coords = await geocodeAddress(data.address);
    if (coords) updateEvent(newId, { latitude: coords.lat, longitude: coords.lng } as Partial<Event>);
  }
  revalidateAll(newId);
  redirect(`/admin/edit/${newId}`);
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
  if (data.address) {
    const coords = await geocodeAddress(data.address);
    if (coords) updateEvent(id, { latitude: coords.lat, longitude: coords.lng } as Partial<Event>);
  }
  revalidateAll(id);
}
