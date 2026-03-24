import Link from "next/link";
import { getApprovedEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const events = getApprovedEvents();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#58595B] mb-2">
          Upcoming Trivia Night Events
        </h1>
        <p className="text-gray-600">
          Find trivia night fundraisers happening across Illinois. Click on an event for details.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
          <p className="text-gray-500 text-lg mb-4">No upcoming events listed yet.</p>
          <Link
            href="/submit"
            className="inline-block bg-[#ED1C24] text-white px-6 py-2 rounded font-medium hover:bg-orange-600 transition-colors"
          >
            Submit the first event!
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className={`block rounded-lg shadow-sm border hover:shadow-md transition-shadow p-5 ${
                event.is_workshop
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-300"
                  : "bg-white"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-[#58595B]">
                      {event.name}
                    </h2>
                    {event.is_workshop === 1 && (
                      <span className="inline-block bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                        Trivia Workshop
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">
                    {event.venue} &mdash; {event.address}
                  </p>
                </div>
                <div className="text-right sm:text-right flex-shrink-0">
                  <p className="text-[#ED1C24] font-semibold">
                    {formatDate(event.date_time)}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {formatTime(event.date_time)} &bull; {event.cost}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
