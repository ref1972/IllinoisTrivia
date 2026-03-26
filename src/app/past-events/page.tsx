import Link from "next/link";
import { getPastEvents } from "@/lib/db";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Past Events | IllinoisTrivia.com" };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

export default function PastEventsPage() {
  const events = getPastEvents();

  return (
    <div>
      <div className="mb-8">
        <Link href="/" className="text-[#ED1C24] hover:underline text-sm mb-4 inline-block">
          &larr; Back to upcoming events
        </Link>
        <h1 className="text-3xl font-bold text-[#58595B] mb-2">Past Events</h1>
        <p className="text-gray-600">A history of trivia night fundraisers listed on IllinoisTrivia.com.</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
          <p className="text-gray-500 text-lg">No past events yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-5 opacity-80 hover:opacity-100"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-[#58595B]">{event.name}</h2>
                  <p className="text-gray-600 mt-1">{event.venue} &mdash; {event.address}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gray-500 font-semibold">{formatDate(event.date_time)}</p>
                  <p className="text-gray-400 text-sm">{formatTime(event.date_time)} &bull; {event.cost}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
