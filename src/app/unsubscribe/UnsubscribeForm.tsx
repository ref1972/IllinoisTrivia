"use client";

import { useState } from "react";
import Link from "next/link";

export default function UnsubscribeForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleUnsubscribe() {
    if (!token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link.");
      return;
    }

    setStatus("loading");

    const res = await fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setMessage("This unsubscribe link is invalid or has already been used.");
    }
  }

  if (!token) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 text-center text-sm">
        Invalid unsubscribe link. Please use the link from your email.
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
        <p className="text-gray-700 mb-4">You have been unsubscribed from IllinoisTrivia.com event alerts.</p>
        <Link href="/" className="text-[#ED1C24] hover:underline text-sm">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
      <p className="text-gray-600 mb-6 text-sm">
        Click below to unsubscribe from IllinoisTrivia.com event alerts.
      </p>
      {status === "error" && (
        <p className="text-red-600 text-sm mb-4">{message}</p>
      )}
      <button
        onClick={handleUnsubscribe}
        disabled={status === "loading"}
        className="bg-[#58595B] text-white px-6 py-2 rounded font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Processing..." : "Unsubscribe"}
      </button>
    </div>
  );
}
