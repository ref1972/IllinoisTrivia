import { NextRequest, NextResponse } from "next/server";
import { getSubscriberByToken, removeSubscriber } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const sub = getSubscriberByToken(token);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  removeSubscriber(token);
  return NextResponse.json({ success: true });
}
