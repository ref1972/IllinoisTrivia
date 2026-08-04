"use client";

import { useState } from "react";

interface EventActionsProps {
  eventId: number;
  name: string;
  dateTime: string;
  address: string;
  description: string;
  eventUrl: string;
}

// Stored times are Central wall-clock with no offset. Passing them through
// `new Date()` would reinterpret them in the viewer's timezone, so the local
// stamp is used verbatim and the timezone is stated explicitly via ctz.
function toLocalStamp(dateStr: string): string {
  const m = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return "";
  const [, y, mo, d, hh, mm] = m;
  return `${y}${mo}${d}T${hh}${mm}00`;
}

function addTwoHours(stamp: string): string {
  const dt = new Date(Date.UTC(
    +stamp.slice(0, 4), +stamp.slice(4, 6) - 1, +stamp.slice(6, 8),
    +stamp.slice(9, 11) + 2, +stamp.slice(11, 13),
  ));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}${p(dt.getUTCMonth() + 1)}${p(dt.getUTCDate())}T${p(dt.getUTCHours())}${p(dt.getUTCMinutes())}00`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function googleCalendarUrl(name: string, dateTime: string, address: string, description: string): string {
  const start = toLocalStamp(dateTime);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: name,
    dates: `${start}/${addTwoHours(start)}`,
    ctz: "America/Chicago",
    location: address,
    details: stripHtml(description),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export default function EventActions({ eventId, name, dateTime, address, description, eventUrl }: EventActionsProps) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(eventUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
  const xShare = `https://x.com/intent/tweet?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(name)}`;

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      {/* Add to Calendar */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Add to Calendar</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href={googleCalendarUrl(name, dateTime, address, description)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Google Calendar
          </a>
          <a
            href={`/events/${eventId}/calendar.ics`}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 14v4M10 16l2 2 2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Apple / Outlook (.ics)
          </a>
        </div>
      </div>

      {/* Share */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Share</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href={fbShare}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#1877F2] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </a>
          <a
            href={xShare}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X / Twitter
          </a>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
