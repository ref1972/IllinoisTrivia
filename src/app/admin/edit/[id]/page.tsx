"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Event } from "@/lib/types";

export default function AdminEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/events/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load event");
        return res.json();
      })
      .then((data) => { setEvent(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [params.id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const imageFile = formData.get("image") as File | null;
    const hasNewImage = imageFile && imageFile.size > 0;

    if (hasNewImage) {
      // Upload image via FormData
      const uploadData = new FormData();
      uploadData.append("image", imageFile);
      uploadData.append("eventId", params.id);

      try {
        const uploadRes = await fetch(`/api/admin/events/${params.id}/image`, {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || "Image upload failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Image upload failed");
        setSaving(false);
        return;
      }
    }

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
      status: formData.get("status"),
    };

    try {
      const res = await fetch(`/api/admin/events/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      setSuccess(true);
      setTimeout(() => router.push("/admin"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading event...</p>;
  }

  if (!event) {
    return <p className="text-red-600">Event not found.</p>;
  }

  const inputClass =
    "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#58595B] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div>
      <button
        onClick={() => router.push("/admin")}
        className="text-[#ED1C24] hover:underline text-sm mb-6 inline-block"
      >
        &larr; Back to admin
      </button>

      <h1 className="text-3xl font-bold text-[#58595B] mb-6">Edit Event</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded p-3 mb-4">
          Event saved! Redirecting...
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border p-6 space-y-4"
      >
        <div>
          <label className={labelClass} htmlFor="name">Event Name *</label>
          <input type="text" id="name" name="name" required className={inputClass} defaultValue={event.name} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="date_time">Date & Time *</label>
            <input type="datetime-local" id="date_time" name="date_time" required className={inputClass} defaultValue={event.date_time} />
          </div>
          <div>
            <label className={labelClass} htmlFor="cost">Cost *</label>
            <input type="text" id="cost" name="cost" required className={inputClass} defaultValue={event.cost} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="venue">Venue Name *</label>
          <input type="text" id="venue" name="venue" required className={inputClass} defaultValue={event.venue} />
        </div>

        <div>
          <label className={labelClass} htmlFor="address">Address *</label>
          <input type="text" id="address" name="address" required className={inputClass} defaultValue={event.address} />
        </div>

        <div>
          <label className={labelClass} htmlFor="description">Description *</label>
          <textarea id="description" name="description" required rows={4} className={inputClass} defaultValue={event.description} />
        </div>

        <div>
          <label className={labelClass} htmlFor="sponsors">Presenting Sponsors</label>
          <input type="text" id="sponsors" name="sponsors" className={inputClass} defaultValue={event.sponsors || ""} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="facebook_url">Facebook Event Page</label>
            <input type="url" id="facebook_url" name="facebook_url" className={inputClass} defaultValue={event.facebook_url || ""} />
          </div>
          <div>
            <label className={labelClass} htmlFor="website">Website</label>
            <input type="url" id="website" name="website" className={inputClass} defaultValue={event.website || ""} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="image">Event Graphic</label>
          {event.image && (
            <div className="mb-2">
              <Image
                src={`/uploads/${event.image}`}
                alt="Current event graphic"
                width={300}
                height={150}
                className="rounded border object-cover"
              />
              <p className="text-xs text-gray-400 mt-1">Current image. Upload a new one to replace it.</p>
            </div>
          )}
          <input
            type="file"
            id="image"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#58595B] file:text-white hover:file:bg-gray-700 file:cursor-pointer file:transition-colors"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="contact_name">Contact Name</label>
            <input type="text" id="contact_name" name="contact_name" className={inputClass} defaultValue={event.contact_name || ""} />
          </div>
          <div>
            <label className={labelClass} htmlFor="contact_email">Contact Email</label>
            <input type="email" id="contact_email" name="contact_email" className={inputClass} defaultValue={event.contact_email || ""} />
          </div>
          <div>
            <label className={labelClass} htmlFor="contact_phone">Contact Phone</label>
            <input type="tel" id="contact_phone" name="contact_phone" className={inputClass} defaultValue={event.contact_phone || ""} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className={labelClass} htmlFor="status">Status</label>
            <select id="status" name="status" className={inputClass} defaultValue={event.status}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_workshop"
                defaultChecked={event.is_workshop === 1}
                className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Trivia Workshop (Featured Event)
              </span>
            </label>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#58595B] text-white px-8 py-3 rounded font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
