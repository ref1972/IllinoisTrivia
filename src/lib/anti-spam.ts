import { NextRequest } from "next/server";
import { isCaptchaEnabled } from "@/lib/db";
import { verifyRecaptcha } from "@/lib/recaptcha";

type RateLimitEntry = { count: number; resetAt: number };

const rateLimits = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest): string {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export function isRateLimited(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const key = `${scope}:${getClientIp(request)}`;
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

export async function passesSpamChecks({
  request,
  honeypot,
  recaptchaToken,
  recaptchaAction,
  rateLimit,
  windowMs,
}: {
  request: NextRequest;
  honeypot: unknown;
  recaptchaToken: unknown;
  recaptchaAction: string;
  rateLimit: number;
  windowMs: number;
}): Promise<"ok" | "spam" | "rate_limited" | "captcha_failed"> {
  if (typeof honeypot === "string" && honeypot.trim()) return "spam";
  if (isRateLimited(request, recaptchaAction, rateLimit, windowMs)) return "rate_limited";

  if (isCaptchaEnabled()) {
    if (typeof recaptchaToken !== "string" || !recaptchaToken) return "captcha_failed";
    if (!await verifyRecaptcha(recaptchaToken, recaptchaAction)) return "captcha_failed";
  }

  return "ok";
}
