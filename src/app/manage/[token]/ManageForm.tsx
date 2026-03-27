"use client";

import { useState } from "react";
import { Event } from "@/lib/types";

export default function ManageForm({ event, token }: { event: Event; token: string }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"updated" | "deleted" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: event.name,
    date_time: event.date_time,
    venue: event.venue,
    address: event.address,
    cost: event.cost,
    description: event.description,
    sponsors: event.sponsors || "",
    facebook_url: event.facebook_url || "",
    website: event.website || "",
    contact_name: event.contact_name || "",
    contact_email: event.contact_email || "",
    contact_phone: event.contact_phone || "",
  });

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/manage/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "update", changes: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setDone("updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/manage/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "delete" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setDone("deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done === "updated") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h2 className="text-lg font-semibold text-green-800 mb-2">Update Request Submitted</h2>
        <p className="text-green-700">Your changes have been submitted for review. You'll receive an email once they're approved.</p>
      </div>
    );
  }

  if (done === "deleted") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h2 className="text-lg font-semibold text-green-800 mb-2">Deletion Request Submitted</h2>
        <p className="text-green-700">Your deletion request has been submitted. You'll receive an email once it's been processed.</p>
      </div>
    );
  }

  if (mode === "delete") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Request Event Deletion</h2>
        <p className="text-red-700 mb-4">
          Are you sure you want to request deletion of <strong>{event.name}</strong>? This will be reviewed by an admin before taking effect.
        </p>
        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting..." : "Yes, Request Deletion"}
          </button>
          <button
            onClick={() => setMode("view")}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (mode === "edit") {
    const field = (label: string, key: keyof typeof form, type = "text", required = false) => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          required={required}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
        />
      </div>
    );

    return (
      <form onSubmit={handleUpdate} className="space-y-4">
        {field("Event Name", "name", "text", true)}
        {field("Date & Time", "date_time", "datetime-local", true)}
        {field("Venue", "venue", "text", true)}
        {field("Address", "address", "text", true)}
        {field("Cost", "cost", "text", true)}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            required
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
          />
        </div>
        {field("Sponsors", "sponsors")}
        {field("Facebook URL", "facebook_url", "url")}
        {field("Website", "website", "url")}
        {field("Contact Name", "contact_name")}
        {field("Contact Email", "contact_email", "email")}
        {field("Contact Phone", "contact_phone", "tel")}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#ED1C24] text-white px-5 py-2 rounded font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Update Request"}
          </button>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  // View mode
  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-lg p-5 space-y-2">
        <h2 className="font-semibold text-gray-800 text-lg">{event.name}</h2>
        <p className="text-sm text-gray-600">{new Date(event.date_time).toLocaleString()} &bull; {event.venue}</p>
        <p className="text-sm text-gray-600">{event.address}</p>
        <p className="text-sm text-gray-600">Cost: {event.cost}</p>
        <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{event.description}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setMode("edit")}
          className="bg-[#58595B] text-white px-4 py-2 rounded font-medium hover:bg-gray-700 transition-colors"
        >
          Request Changes
        </button>
        <button
          onClick={() => setMode("delete")}
          className="bg-white border border-red-500 text-red-600 px-4 py-2 rounded font-medium hover:bg-red-50 transition-colors"
        >
          Request Deletion
        </button>
      </div>
    </div>
  );
}
