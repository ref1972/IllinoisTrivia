"use client";

import { useState, FormEvent } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function SubmitPage() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    try {
      let recaptchaToken = "";
      if (siteKey && window.grecaptcha) {
        recaptchaToken = await new Promise<string>((resolve) => {
          window.grecaptcha.ready(async () => {
            const token = await window.grecaptcha.execute(siteKey, {
              action: "submit_event",
            });
            resolve(token);
          });
        });
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
        contact_name: formData.get("contact_name"),
        contact_email: formData.get("contact_email"),
        contact_phone: formData.get("contact_phone") || null,
        recaptchaToken,
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-green-800 mb-2">Event Submitted!</h2>
          <p className="text-green-700">
            Your event has been submitted and is pending admin review. It will
            appear on the site once approved.
          </p>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#58595B] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#58595B] mb-2">Submit an Event</h1>
      <p className="text-gray-600 mb-6">
        Submit your trivia night fundraiser for listing. Events are reviewed
        before being published.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border p-6 space-y-4"
      >
        <div>
          <label className={labelClass} htmlFor="name">Event Name *</label>
          <input type="text" id="name" name="name" required className={inputClass} placeholder="e.g. Springfield Trivia Night for Charity" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="date_time">Date & Time *</label>
            <input type="datetime-local" id="date_time" name="date_time" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="cost">Cost *</label>
            <input type="text" id="cost" name="cost" required className={inputClass} placeholder="e.g. $20 per person" />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="venue">Venue Name *</label>
          <input type="text" id="venue" name="venue" required className={inputClass} placeholder="e.g. Elks Lodge #158" />
        </div>

        <div>
          <label className={labelClass} htmlFor="address">Address *</label>
          <input type="text" id="address" name="address" required className={inputClass} placeholder="e.g. 123 Main St, Springfield, IL 62701" />
        </div>

        <div>
          <label className={labelClass} htmlFor="description">Description *</label>
          <textarea id="description" name="description" required rows={4} className={inputClass} placeholder="Tell people about your event, the cause, prizes, team sizes, etc." />
        </div>

        <div>
          <label className={labelClass} htmlFor="sponsors">Presenting Sponsors</label>
          <input type="text" id="sponsors" name="sponsors" className={inputClass} placeholder="e.g. Local Business Name, Another Sponsor" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="facebook_url">Facebook Event Page</label>
            <input type="url" id="facebook_url" name="facebook_url" className={inputClass} placeholder="https://www.facebook.com/events/..." />
          </div>
          <div>
            <label className={labelClass} htmlFor="website">Website</label>
            <input type="url" id="website" name="website" className={inputClass} placeholder="https://..." />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="contact_name">Contact Name *</label>
            <input type="text" id="contact_name" name="contact_name" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="contact_email">Contact Email *</label>
            <input type="email" id="contact_email" name="contact_email" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="contact_phone">Contact Phone</label>
            <input type="tel" id="contact_phone" name="contact_phone" className={inputClass} />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#ED1C24] text-white px-8 py-3 rounded font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Event"}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          This site is protected by reCAPTCHA. Submitted events are reviewed before publication.
        </p>
      </form>
    </div>
  );
}
