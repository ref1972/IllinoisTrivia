"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { updateEventStatus, updateEvent } from "@/lib/db";
import { Event } from "@/lib/types";

async function requireAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token || !verifySessionToken(token)) {
    throw new Error("Unauthorized");
  }
}

export async function approveEvent(id: number) {
  await requireAdmin();
  updateEventStatus(id, "approved");
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function rejectEvent(id: number) {
  await requireAdmin();
  updateEventStatus(id, "rejected");
  revalidatePath("/admin");
}

export async function saveEvent(id: number, data: Partial<Event>) {
  await requireAdmin();
  updateEvent(id, data);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/events/${id}`);
}
