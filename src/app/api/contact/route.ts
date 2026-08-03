import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { passesSpamChecks } from "@/lib/anti-spam";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] as string);
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, message, company, recaptchaToken } = await request.json();

    const spamCheck = await passesSpamChecks({
      request,
      honeypot: company,
      recaptchaToken,
      recaptchaAction: "contact",
      rateLimit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (spamCheck === "spam") return NextResponse.json({ success: true });
    if (spamCheck === "rate_limited") {
      return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
    }
    if (spamCheck === "captcha_failed") {
      return NextResponse.json({ error: "Spam verification failed. Please refresh and try again." }, { status: 400 });
    }

    if (!name || !email || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string"
      || name.length > 200 || email.length > 320 || message.length > 10_000
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid form submission" }, { status: 400 });
    }

    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeMessage = escapeHtml(message.trim());

    await sendEmail({
      to: "friedewald@gmail.com",
      subject: `IllinoisTrivia.com Contact Form: Message from ${name.replace(/[\r\n]/g, " ").trim()}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
        <hr />
        <p>${safeMessage.replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
