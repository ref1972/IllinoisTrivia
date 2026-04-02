"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PubQuizSubmitPage() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [eventType, setEventType] = useState<"recurring" | "one_off">("recurring");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/pub-quizzes", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Submission failed");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B1C3A] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-green-800 mb-2">Listing Submitted!</h2>
          <p className="text-green-700 mb-4">
            Your pub quiz listing is pending review and will appear once approved. If you provided your email, you&apos;ll receive a confirmation and a private link to request future updates.
          </p>
          <Link href="/pub-quiz" className="text-[#C83803] hover:underline text-sm font-medium">
            &larr; Back to Pub Quiz Finder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/pub-quiz" className="text-[#C83803] hover:underline text-sm">&larr; Back to Pub Quiz Finder</Link>
      <h1 className="text-3xl font-bold text-[#0B1C3A] mt-2 mb-1">Add a Pub Quiz Listing</h1>
      <p className="text-gray-600 mb-6">Submit a bar trivia night. Listings are reviewed before being published.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-4">

        {/* Event type toggle */}
        <div>
          <label className={labelClass}>Type *</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden w-fit">
            <button
              type="button"
              onClick={() => setEventType("recurring")}
              className={`px-5 py-2 text-sm font-medium transition-colors ${eventType === "recurring" ? "bg-[#0B1C3A] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              Weekly Recurring
            </button>
            <button
              type="button"
              onClick={() => setEventType("one_off")}
              className={`px-5 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${eventType === "one_off" ? "bg-[#0B1C3A] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              One-Off / Theme Night
            </button>
          </div>
          <input type="hidden" name="event_type" value={eventType} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="venue">Venue Name *</label>
            <input type="text" id="venue" name="venue" required className={inputClass} placeholder="e.g. McGee's Tap Room" />
          </div>
          <div>
            <label className={labelClass} htmlFor="city">City *</label>
            <input type="text" id="city" name="city" required className={inputClass} placeholder="e.g. Springfield" />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="address">Street Address *</label>
          <input type="text" id="address" name="address" required className={inputClass} placeholder="e.g. 123 Main St" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {eventType === "recurring" ? (
            <div>
              <label className={labelClass} htmlFor="day_of_week">Day of the Week *</label>
              <select id="day_of_week" name="day_of_week" required className={inputClass}>
                <option value="">Select a day…</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className={labelClass} htmlFor="event_date">Date *</label>
              <input type="date" id="event_date" name="event_date" required className={inputClass} />
            </div>
          )}
          <div>
            <label className={labelClass} htmlFor="start_time">Start Time *</label>
            <input type="text" id="start_time" name="start_time" required className={inputClass} placeholder="e.g. 7:00 PM" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="quiz_company">Quiz Company</label>
            <input type="text" id="quiz_company" name="quiz_company" className={inputClass} placeholder="e.g. Buzztime, Geeks Who Drink" />
          </div>
          <div>
            <label className={labelClass} htmlFor="host">Regular Host</label>
            <input type="text" id="host" name="host" className={inputClass} placeholder="Host's name" />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="description">Description / Notes</label>
          <textarea id="description" name="description" rows={3} className={inputClass} placeholder="Team size limits, prizes, theme details, any other notes…" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="venue_website">Venue Website</label>
            <input type="url" id="venue_website" name="venue_website" className={inputClass} placeholder="https://…" />
          </div>
          <div>
            <label className={labelClass} htmlFor="website">Quiz / Event Website</label>
            <input type="url" id="website" name="website" className={inputClass} placeholder="https://…" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Format</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="format" value="pen_paper" className="accent-[#0B1C3A]" />
              <span className="text-sm text-gray-700">Pen &amp; Paper</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="format" value="mobile_app" className="accent-[#0B1C3A]" />
              <span className="text-sm text-gray-700">Mobile App</span>
            </label>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="image">Event Graphic</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#C83803] file:text-white hover:file:bg-red-700 file:cursor-pointer file:transition-colors"
          />
          <p className="text-xs text-gray-400 mt-1">Optional. JPG, PNG, WebP, or GIF. Max 5MB.</p>
        </div>

        <div className="border-t pt-4">
          <p className={labelClass}>Your Contact Info <span className="text-gray-400 font-normal">(optional — used only to notify you of approval and send you a management link)</span></p>
          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className={labelClass} htmlFor="submitter_name">Your Name</label>
              <input type="text" id="submitter_name" name="submitter_name" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="submitter_email">Your Email</label>
              <input type="email" id="submitter_email" name="submitter_email" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#C83803] text-white px-8 py-3 rounded font-medium hover:bg-orange-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting…" : "Submit Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
