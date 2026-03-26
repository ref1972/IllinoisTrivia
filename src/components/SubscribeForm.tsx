"use client";

import { useState } from "react";

const IL_REGIONS = [
  "All Illinois",
  "Chicago",
  "Chicago Suburbs (North)",
  "Chicago Suburbs (South)",
  "Chicago Suburbs (West)",
  "Rockford",
  "Peoria",
  "Springfield",
  "Champaign-Urbana",
  "Bloomington-Normal",
  "Decatur",
  "Quad Cities",
  "Joliet",
  "Aurora",
  "Other",
];

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("All Illinois");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, region }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("success");
      setMessage(data.alreadySubscribed
        ? "You're already subscribed! We'll keep you posted."
        : "You're subscribed! We'll notify you when new events are added.");
      setEmail("");
    } else {
      setStatus("error");
      setMessage(data.error || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-lg font-bold text-[#58595B] mb-1">Get Event Alerts</h2>
      <p className="text-sm text-gray-600 mb-4">
        Subscribe to be notified when new trivia night events are added in your area.
      </p>

      {status === "success" ? (
        <p className="text-green-700 bg-green-50 border border-green-200 rounded p-3 text-sm">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#58595B]"
          />
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#58595B]"
          >
            {IL_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {status === "error" && (
            <p className="text-red-600 text-sm">{message}</p>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-[#ED1C24] text-white py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
      )}
    </div>
  );
}
