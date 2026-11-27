"use client";

import Link from "next/link";
import { useState } from "react";
import { foundFields, FoundEvent, FoundField } from "@/lib/found-events";

async function submit(body: object) {
  const response = await fetch("/api/admin/find-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function FindEvents() {
  const [area, setArea] = useState("");
  const [events, setEvents] = useState<FoundEvent[] | null>(null);
  const [saved, setSaved] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/admin" className="text-sm underline">Back to admin</Link>
      <h1 className="text-3xl font-bold text-[#0B1C3A] mt-2">Find Fundraising Trivia</h1>
      <p className="text-gray-600 mt-2">Search Illinois for upcoming fundraisers. Check each source before adding an event to the approval queue.</p>
      <form className="flex flex-wrap items-end gap-3 my-5" onSubmit={event => {
        event.preventDefault();
        void run(async () => {
          const data = await submit({ action: "search", area });
          setEvents(data.events);
          setSaved({});
        });
      }}>
        <label className="flex-1 min-w-48 text-sm font-medium">
          City or region (optional)
          <input className="block w-full mt-1 rounded border p-2" value={area} maxLength={100}
            onChange={event => setArea(event.target.value)} placeholder="All Illinois" />
        </label>
        <button disabled={busy} className="rounded bg-[#C83803] text-white px-4 py-2 disabled:opacity-50">Search the web</button>
      </form>
      {busy && <p role="status">Working…</p>}
      {error && <p role="alert" className="text-red-700 my-3">{error}</p>}
      {events?.length === 0 && <p>No matching fundraisers found. Try another city or search statewide.</p>}
      {events?.map((candidate, index) => (
        <details key={index} className="bg-white border rounded-lg p-4 my-3">
          <summary className="cursor-pointer font-semibold">{candidate.name} {saved[index] && "· Pending"}</summary>
          {saved[index] ? <Link className="underline" href={`/admin/edit/${saved[index]}`}>Open pending event</Link> : (
            <form className="mt-4 space-y-4" onSubmit={event => {
              event.preventDefault();
              void run(async () => {
                const data = await submit({ action: "save", event: candidate });
                setSaved(current => ({ ...current, [index]: data.id }));
              });
            }}>
              {/^https?:\/\//i.test(candidate.website) && <a className="underline" href={candidate.website} target="_blank" rel="noreferrer">Check event source</a>}
              <div className="grid sm:grid-cols-2 gap-3">
                {(Object.keys(foundFields) as FoundField[]).map(field => {
                  const change = (value: string) => setEvents(current => current?.map((item, i) =>
                    i === index ? { ...item, [field]: value } : item) ?? null);
                  return <label key={field} className={field === "description" ? "sm:col-span-2 text-sm" : "text-sm"}>
                    {foundFields[field]}
                    {field === "description"
                      ? <textarea className="block w-full border rounded p-2" rows={3} value={candidate[field]} onChange={event => change(event.target.value)} />
                      : <input className="block w-full border rounded p-2" type={field === "date_time" ? "datetime-local" : field.includes("url") || field === "website" ? "url" : field === "contact_email" ? "email" : "text"}
                          required={["name", "website", "date_time"].includes(field)} value={candidate[field]} onChange={event => change(event.target.value)} />}
                  </label>;
                })}
              </div>
              <button disabled={busy} className="rounded bg-[#0B1C3A] text-white px-4 py-2 disabled:opacity-50">Save as pending</button>
            </form>
          )}
        </details>
      ))}
    </div>
  );
}
