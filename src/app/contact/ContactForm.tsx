"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    if (res.ok) {
      setStatus("success");
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#58595B]";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-6 text-center">
        <p className="font-semibold text-lg mb-1">Message sent!</p>
        <p className="text-sm">Thanks for reaching out. We&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>
      )}
      <div>
        <label className={labelClass} htmlFor="name">Name *</label>
        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="email">Email *</label>
        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="message">Message *</label>
        <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} required rows={5} className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-[#ED1C24] text-white py-2 rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
