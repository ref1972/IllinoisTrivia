"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateVenue, deleteVenue, upsertVenue } from "@/lib/db";

export async function createVenue(data: { name: string; address: string; website?: string }) {
  await requireAdmin();
  upsertVenue(data.name, data.address, data.website);
  revalidatePath("/admin/venues");
}

export async function editVenue(id: number, data: { name: string; address: string; website?: string }) {
  await requireAdmin();
  updateVenue(id, data);
  revalidatePath("/admin/venues");
}

export async function removeVenue(id: number) {
  await requireAdmin();
  deleteVenue(id);
  revalidatePath("/admin/venues");
}
