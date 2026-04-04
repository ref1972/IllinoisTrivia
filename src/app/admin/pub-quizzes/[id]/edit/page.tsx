"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PubQuiz } from "@/lib/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function EditPubQuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<PubQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removingImage, setRemovingImage] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/pub-quizzes/${params.id}`)
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(d => { setQuiz(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  }

  async function handleRemoveImage() {
    if (!confirm("Remove this image?")) return;
    setRemovingImage(true);
    try {
      await fetch(`/api/admin/pub-quizzes/${params.id}/image`, { method: "DELETE" });
      setQuiz(q => q ? { ...q, image: null } : q);
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setRemovingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const form = e.currentTarget;
    const data = new FormData(form);

    // Upload image first if one was selected
    if (imageFile) {
      const uploadData = new FormData();
      uploadData.append("image", imageFile);
      const uploadRes = await fetch(`/api/admin/pub-quizzes/${params.id}/image`, {
        method: "POST",
        body: uploadData,
      });
      if (!uploadRes.ok) {
        const d = await uploadRes.json();
        setError(d.error || "Image upload failed");
        setSaving(false);
        return;
      }
      const { filename } = await uploadRes.json();
      setQuiz(q => q ? { ...q, image: filename } : q);
      setImageFile(null);
      setImagePreview(null);
    }

    // Save the rest of the fields
    const body: Record<string, unknown> = {
      venue: data.get("venue"),
      address: data.get("address"),
      city: data.get("city"),
      event_type: data.get("event_type"),
      day_of_week: data.get("day_of_week") || null,
      event_date: data.get("event_date") || null,
      start_time: data.get("start_time"),
      quiz_company: data.get("quiz_company") || null,
      host: data.get("host") || null,
      description: data.get("description") || null,
      format: data.get("format") || null,
      venue_website: data.get("venue_website") || null,
      website: data.get("website") || null,
      status: data.get("status"),
    };

    const res = await fetch(`/api/admin/pub-quizzes/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setError("Save failed");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/admin/pub-quizzes"), 1000);
    }
    setSaving(false);
  }

  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B1C3A]";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (loading) return <div className="py-16 text-center text-gray-400">Loading…</div>;
  if (!quiz) return <div className="py-16 text-center text-gray-500">Listing not found.</div>;

  const currentImage = imagePreview || (quiz.image ? `/uploads/${quiz.image}` : null);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/pub-quizzes" className="text-[#C83803] hover:underline text-sm">&larr; Back to Pub Quiz Listings</Link>
      <h1 className="text-2xl font-bold text-[#0B1C3A] mt-2 mb-6">Edit Pub Quiz Listing</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded p-3 mb-4">Saved! Redirecting…</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Venue Name</label>
            <input type="text" name="venue" defaultValue={quiz.venue} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input type="text" name="city" defaultValue={quiz.city} required className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Street Address</label>
          <input type="text" name="address" defaultValue={quiz.address} required className={inputClass} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Venue Website</label>
            <input type="url" name="venue_website" defaultValue={quiz.venue_website || ""} className={inputClass} placeholder="https://…" />
          </div>
          <div>
            <label className={labelClass}>Quiz / Event Website</label>
            <input type="url" name="website" defaultValue={quiz.website || ""} className={inputClass} placeholder="https://…" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Event Type</label>
          <select name="event_type" defaultValue={quiz.event_type} className={inputClass}>
            <option value="recurring">Weekly Recurring</option>
            <option value="one_off">One-Off / Theme Night</option>
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Day of the Week</label>
            <select name="day_of_week" defaultValue={quiz.day_of_week || ""} className={inputClass}>
              <option value="">— none —</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Event Date <span className="text-gray-400 font-normal">(one-off only)</span></label>
            <input type="date" name="event_date" defaultValue={quiz.event_date || ""} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Start Time</label>
          <input type="text" name="start_time" defaultValue={quiz.start_time} required className={inputClass} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Quiz Company</label>
            <input type="text" name="quiz_company" defaultValue={quiz.quiz_company || ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Regular Host</label>
            <input type="text" name="host" defaultValue={quiz.host || ""} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description / Notes</label>
          <textarea name="description" defaultValue={quiz.description || ""} rows={3} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Format</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="format" value="pen_paper" defaultChecked={quiz.format === "pen_paper"} className="accent-[#0B1C3A]" />
              <span className="text-sm">Pen &amp; Paper</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="format" value="mobile_app" defaultChecked={quiz.format === "mobile_app"} className="accent-[#0B1C3A]" />
              <span className="text-sm">Mobile App</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="format" value="" defaultChecked={!quiz.format} className="accent-[#0B1C3A]" />
              <span className="text-sm">Not specified</span>
            </label>
          </div>
        </div>

        {/* Image */}
        <div>
          <label className={labelClass}>Event Graphic</label>
          {currentImage && (
            <div className="mb-2 flex items-center gap-3">
              <Image src={currentImage} alt="Current" width={120} height={80} unoptimized className="rounded border object-cover h-20 w-auto" />
              {!imagePreview && (
                <button type="button" onClick={handleRemoveImage} disabled={removingImage} className="text-xs text-red-500 hover:text-red-700">
                  {removingImage ? "Removing…" : "Remove image"}
                </button>
              )}
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#C83803] file:text-white hover:file:bg-red-700 file:cursor-pointer"
          />
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, or GIF. Max 5MB.</p>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={quiz.status} className={inputClass}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {(quiz.latitude || quiz.longitude) && (
          <div className="text-xs text-gray-400">
            Coordinates: {quiz.latitude?.toFixed(5)}, {quiz.longitude?.toFixed(5)}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#C83803] text-white px-6 py-3 rounded font-medium hover:bg-orange-800 transition-colors disabled:opacity-50 min-h-[48px]">
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <Link href="/admin/pub-quizzes" className="px-6 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
