import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { addSubscriber, getSubscriberByToken } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email, region } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const token = randomBytes(32).toString("hex");
    addSubscriber(email, region || "All Illinois", token);

    const unsubscribeUrl = `https://illinoistrivia.com/unsubscribe?token=${token}`;

    // Send confirmation email (non-blocking)
    sendEmail({
      to: email,
      subject: "You're subscribed to IllinoisTrivia.com event alerts",
      html: `
        <h2>You&apos;re subscribed!</h2>
        <p>You&apos;ll receive email notifications when new trivia night fundraising events are added${region && region !== "All Illinois" ? ` in the <strong>${region}</strong> area` : " across Illinois"}.</p>
        <p style="margin-top: 24px; color: #999; font-size: 12px;">
          To unsubscribe at any time, <a href="${unsubscribeUrl}">click here</a>.
        </p>
      `,
    }).catch(err => console.error("Failed to send subscribe confirmation:", err));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const sub = getSubscriberByToken(token);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ email: sub.email });
}
