"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PubQuizManagePage({ params }: { params: { token: string } }) {
  const [quiz, setQuiz] = useState<{
    id: number; venue: string; address: string; city: string; day_of_week: string;
    start_time: string; quiz_company: string | null; host: string | null;
    description: string | null; format: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"update" | "delete">("update");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/pub-quizzes/manage/${params.token}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setQuiz(d); })
      .finally(() => setLoading(false));
  }, [params.token]);

  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    const changes: Record<string, string> = {};
    Array.from(data.entries()).forEach(([k, v]) => {
      if (v && v !== (quiz as Record<string, unknown>)[k]) changes[k] = v as string;
    });
    try {
      const res = await fetch(`/api/pub-quizzes/manage/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "update", changes }),
      });
      if (!res.ok) throw new Error("Request failed");
      setDone("Your update request has been submitted and is pending admin review.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Request deletion of this listing?")) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/pub-quizzes/manage/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "delete" }),
      });
      if (!res.ok) throw new Error("Request failed");
      setDone("Your deletion request has been submitted and is pending admin review.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B1C3A]";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (loading) return <div className="py-16 text-center text-gray-400">Loading…</div>;
  if (notFound || !quiz) return <div className="py-16 text-center text-gray-500">Listing not found or link has expired.</div>;
  if (done) return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="bg-green-50 border border-green-200 rounded-lg p-8">
        <p className="text-green-800 font-medium">{done}</p>
        <Link href="/pub-quiz" className="text-[#C83803] hover:underline text-sm mt-4 block">
          &larr; Back to Pub Quiz Finder
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/pub-quiz" className="text-[#C83803] hover:underline text-sm">&larr; Back to Pub Quiz Finder</Link>
      <h1 className="text-2xl font-bold text-[#0B1C3A] mt-2 mb-1">Manage Your Listing</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Requesting changes to <strong>{quiz.venue}</strong> ({quiz.city}). All requests require admin approval.
      </p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4">{error}</div>}

      <div className="flex gap-1 border-b border-gray-200 mb-0">
        {(["update", "delete"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${tab === t ? "border-[#C83803] text-[#C83803] bg-white" : "border-transparent text-gray-500 hover:text-gray-700 bg-gray-50"}`}
          >
            {t === "update" ? "Request Update" : "Request Removal"}
          </button>
        ))}
      </div>

      <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
        {tab === "update" ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Venue Name</label>
                <input type="text" name="venue" defaultValue={quiz.venue} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input type="text" name="city" defaultValue={quiz.city} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Street Address</label>
              <input type="text" name="address" defaultValue={quiz.address} className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Day of the Week</label>
                <select name="day_of_week" defaultValue={quiz.day_of_week} className={inputClass}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Start Time</label>
                <input type="text" name="start_time" defaultValue={quiz.start_time} className={inputClass} />
              </div>
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
              </div>
            </div>
            <button type="submit" disabled={submitting} className="bg-[#C83803] text-white px-6 py-2 rounded font-medium hover:bg-orange-800 transition-colors disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit Update Request"}
            </button>
          </form>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">This will request removal of <strong>{quiz.venue}</strong> from the pub quiz listings. The listing will remain visible until an admin approves the request.</p>
            <button onClick={handleDelete} disabled={submitting} className="bg-red-600 text-white px-6 py-2 rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
              {submitting ? "Submitting…" : "Request Removal"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
