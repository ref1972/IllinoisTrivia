"use client";

import { useState, useEffect, FormEvent } from "react";

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
  const [captchaEnabled, setCaptchaEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setCaptchaEnabled(data.captcha_enabled))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    try {
      let recaptchaToken = "";
      if (captchaEnabled && siteKey && window.grecaptcha) {
        recaptchaToken = await new Promise<string>((resolve) => {
          window.grecaptcha.ready(async () => {
            const token = await window.grecaptcha.execute(siteKey, {
              action: "submit_event",
            });
            resolve(token);
          });
        });
      }

      const submitData = new FormData();
      submitData.append("name", formData.get("name") as string);
      submitData.append("date_time", formData.get("date_time") as string);
      submitData.append("venue", formData.get("venue") as string);
      submitData.append("address", formData.get("address") as string);
      submitData.append("cost", formData.get("cost") as string);
      submitData.append("description", formData.get("description") as string);
      if (formData.get("sponsors")) submitData.append("sponsors", formData.get("sponsors") as string);
      if (formData.get("facebook_url")) submitData.append("facebook_url", formData.get("facebook_url") as string);
      if (formData.get("website")) submitData.append("website", formData.get("website") as string);
      if (formData.get("contact_name")) submitData.append("contact_name", formData.get("contact_name") as string);
      if (formData.get("contact_email")) submitData.append("contact_email", formData.get("contact_email") as string);
      if (formData.get("contact_phone")) submitData.append("contact_phone", formData.get("contact_phone") as string);
      submitData.append("recaptchaToken", recaptchaToken);

      const imageFile = formData.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        submitData.append("image", imageFile);
      }

      const res = await fetch("/api/events", {
        method: "POST",
        body: submitData,
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

        <div>
          <label className={labelClass} htmlFor="image">Event Graphic</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#ED1C24] file:text-white hover:file:bg-red-700 file:cursor-pointer file:transition-colors"
          />
          <p className="text-xs text-gray-400 mt-1">Optional. JPG, PNG, WebP, or GIF. Max 5MB.</p>
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
