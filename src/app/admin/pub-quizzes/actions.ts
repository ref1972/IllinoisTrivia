"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getPubQuizById, updatePubQuiz, deletePubQuiz } from "@/lib/db";
import { sendPubQuizApprovalEmail } from "@/lib/email";
import { geocodeAddress } from "@/lib/geocode";

async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) redirect("/admin/login");
}

export async function approvePubQuiz(id: number) {
  await requireAdmin();
  updatePubQuiz(id, { status: "approved" });

  const quiz = getPubQuizById(id);
  if (quiz) {
    // Geocode if needed
    if (!quiz.latitude) {
      const coords = await geocodeAddress(`${quiz.address}, ${quiz.city}, IL`);
      if (coords) updatePubQuiz(id, { latitude: coords.lat, longitude: coords.lng });
    }
    // Send approval email with manage link
    if (quiz.submitter_email && quiz.manage_token) {
      await sendPubQuizApprovalEmail({
        venue: quiz.venue,
        city: quiz.city,
        id: quiz.id,
        submitter_email: quiz.submitter_email,
        manage_token: quiz.manage_token,
      });
    }
  }

  revalidatePath("/admin/pub-quizzes");
  revalidatePath("/pub-quiz");
}

export async function rejectPubQuiz(id: number) {
  await requireAdmin();
  updatePubQuiz(id, { status: "rejected" });
  revalidatePath("/admin/pub-quizzes");
}

export async function removePubQuiz(id: number) {
  await requireAdmin();
  deletePubQuiz(id);
  revalidatePath("/admin/pub-quizzes");
  revalidatePath("/pub-quiz");
}

export async function savePubQuizEdit(id: number, data: FormData) {
  await requireAdmin();
  updatePubQuiz(id, {
    venue: data.get("venue") as string,
    address: data.get("address") as string,
    city: data.get("city") as string,
    event_type: (data.get("event_type") as "recurring" | "one_off") || "recurring",
    day_of_week: (data.get("day_of_week") as string) || null,
    event_date: (data.get("event_date") as string) || null,
    start_time: data.get("start_time") as string,
    quiz_company: (data.get("quiz_company") as string) || null,
    host: (data.get("host") as string) || null,
    description: (data.get("description") as string) || null,
    format: (data.get("format") as "pen_paper" | "mobile_app") || null,
    venue_website: (data.get("venue_website") as string) || null,
    website: (data.get("website") as string) || null,
    status: data.get("status") as "pending" | "approved" | "rejected",
  });
  // Re-geocode if address changed
  const quiz = getPubQuizById(id);
  if (quiz && (!quiz.latitude || !quiz.longitude)) {
    const coords = await geocodeAddress(`${quiz.address}, ${quiz.city}, IL`);
    if (coords) updatePubQuiz(id, { latitude: coords.lat, longitude: coords.lng });
  }
  revalidatePath("/admin/pub-quizzes");
  revalidatePath("/pub-quiz");
  redirect("/admin/pub-quizzes");
}
