"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateEventStatus, updateEvent } from "@/lib/db";
import { Event } from "@/lib/types";

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
