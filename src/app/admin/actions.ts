"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  updateEventStatus, updateEvent, getEventByIdAdmin,
  setSetting, isCaptchaEnabled, deleteEvent,
  duplicateEvent, insertEventAdmin,
  getChangeRequestById, updateChangeRequestStatus,
  upsertVenue, getEventsWithoutCoords,
} from "@/lib/db";
import { geocodeAddress } from "@/lib/geocode";
import { notifySubscribers, sendApprovalEmail, sendChangeRequestOutcome } from "@/lib/email";
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
    upsertVenue(event.venue, event.address, event.website);
    notifySubscribers(event).catch(err => console.error("Failed to notify subscribers:", err));
    if (event.contact_email && (event as Event & { manage_token?: string }).manage_token) {
      sendApprovalEmail({
        name: event.name,
        id: event.id,
        contact_email: event.contact_email,
        manage_token: (event as Event & { manage_token?: string }).manage_token!,
      }).catch(err => console.error("Failed to send approval email:", err));
    }
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
  if (data.venue && data.address) upsertVenue(data.venue, data.address, data.website);
  revalidateAll(newId);
  redirect(`/admin/edit/${newId}`);
}

export async function approveChangeRequest(id: number) {
  await requireAdmin();
  const req = getChangeRequestById(id);
  if (!req) return;
  const event = getEventByIdAdmin(req.event_id);
  if (!event) return;

  updateChangeRequestStatus(id, "approved");

  if (req.type === 'delete') {
    deleteEvent(req.event_id);
  } else if (req.type === 'update' && req.changes) {
    const changes = JSON.parse(req.changes) as Partial<Event>;
    updateEvent(req.event_id, changes);
    if (changes.address) {
      const coords = await geocodeAddress(changes.address as string);
      if (coords) updateEvent(req.event_id, { latitude: coords.lat, longitude: coords.lng } as Partial<Event>);
    }
  }

  if (event.contact_email) {
    sendChangeRequestOutcome(event.contact_email, event.name, req.type, true)
      .catch(err => console.error("Failed to send outcome email:", err));
  }
  revalidateAll(req.event_id);
}

export async function rejectChangeRequest(id: number) {
  await requireAdmin();
  const req = getChangeRequestById(id);
  if (!req) return;
  const event = getEventByIdAdmin(req.event_id);
  updateChangeRequestStatus(id, "rejected");
  if (event?.contact_email) {
    sendChangeRequestOutcome(event.contact_email, event.name, req.type, false)
      .catch(err => console.error("Failed to send outcome email:", err));
  }
  revalidateAll();
}

export async function toggleCaptcha() {
  await requireAdmin();
  const current = isCaptchaEnabled();
  setSetting("captcha_enabled", current ? "false" : "true");
  revalidatePath("/admin");
  revalidatePath("/submit");
}

export async function regeocodeMissingEvents() {
  await requireAdmin();
  const events = getEventsWithoutCoords();
  for (const event of events) {
    const coords = await geocodeAddress(event.address);
    if (coords) updateEvent(event.id, { latitude: coords.lat, longitude: coords.lng } as Partial<Event>);
    // Nominatim rate limit: 1 request/second
    await new Promise(resolve => setTimeout(resolve, 1100));
  }
  revalidateAll();
  return events.length;
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
