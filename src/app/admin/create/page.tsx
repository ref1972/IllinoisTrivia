"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminCreatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name"),
      date_time: formData.get("date_time"),
      venue: formData.get("venue"),
      address: formData.get("address"),
      cost: formData.get("cost"),
      description: formData.get("description"),
      sponsors: formData.get("sponsors") || null,
      facebook_url: formData.get("facebook_url") || null,
      website: formData.get("website") || null,
      is_workshop: formData.get("is_workshop") ? 1 : 0,
      contact_name: formData.get("contact_name") || null,
      contact_email: formData.get("contact_email") || null,
      contact_phone: formData.get("contact_phone") || null,
      status: formData.get("status") || "approved",
    };

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }

      const data = await res.json();
      router.push(`/admin/edit/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#58595B] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div>
      <button onClick={() => router.push("/admin")} className="text-[#ED1C24] hover:underline text-sm mb-6 inline-block">
        &larr; Back to admin
      </button>
      <h1 className="text-3xl font-bold text-[#58595B] mb-6">Create Event</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        <div>
          <label className={labelClass} htmlFor="name">Event Name *</label>
          <input type="text" id="name" name="name" required className={inputClass} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="date_time">Date & Time *</label>
            <input type="datetime-local" id="date_time" name="date_time" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="cost">Cost *</label>
            <input type="text" id="cost" name="cost" required className={inputClass} placeholder="e.g. $25 per person" />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="venue">Venue Name *</label>
          <input type="text" id="venue" name="venue" required className={inputClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="address">Address *</label>
          <input type="text" id="address" name="address" required className={inputClass} placeholder="123 Main St, Chicago, IL 60601" />
        </div>

        <div>
          <label className={labelClass} htmlFor="description">Description *</label>
          <textarea id="description" name="description" required rows={4} className={inputClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="sponsors">Presenting Sponsors</label>
          <input type="text" id="sponsors" name="sponsors" className={inputClass} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="facebook_url">Facebook Event Page</label>
            <input type="url" id="facebook_url" name="facebook_url" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="website">Website</label>
            <input type="url" id="website" name="website" className={inputClass} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="contact_name">Contact Name</label>
            <input type="text" id="contact_name" name="contact_name" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="contact_email">Contact Email</label>
            <input type="email" id="contact_email" name="contact_email" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="contact_phone">Contact Phone</label>
            <input type="tel" id="contact_phone" name="contact_phone" className={inputClass} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className={labelClass} htmlFor="status">Status</label>
            <select id="status" name="status" className={inputClass} defaultValue="approved">
              <option value="approved">Approved (live)</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_workshop" className="w-4 h-4 text-amber-500 border-gray-300 rounded" />
              <span className="text-sm font-medium text-gray-700">Trivia Workshop (Featured Event)</span>
            </label>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#ED1C24] text-white px-8 py-3 rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
