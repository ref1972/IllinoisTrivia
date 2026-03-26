import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/db";

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

function googleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function EventPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const event = getEventById(id);
  if (!event) notFound();

  return (
    <div>
      <Link
        href="/"
        className="text-[#ED1C24] hover:underline text-sm mb-6 inline-block"
      >
        &larr; Back to all events
      </Link>

      <div className={`rounded-lg shadow-sm border p-6 sm:p-8 ${
        event.is_workshop ? "bg-amber-50 border-amber-300" : "bg-white"
      }`}>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-[#58595B]">{event.name}</h1>
          {event.is_workshop === 1 && (
            <span className="inline-block bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
              Trivia Workshop
            </span>
          )}
        </div>

        {event.image && (
          <div className="mt-4 mb-6">
            <Image
              src={`/uploads/${event.image}`}
              alt={event.name}
              width={800}
              height={400}
              className="rounded-lg w-full max-h-96 object-cover"
            />
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Date & Time
            </h3>
            <p className="text-lg font-medium text-gray-800">
              {formatDate(event.date_time)}
            </p>
            <p className="text-gray-600">{formatTime(event.date_time)}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Cost
            </h3>
            <p className="text-lg font-medium text-[#ED1C24]">{event.cost}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Venue
            </h3>
            <p className="text-lg font-medium text-gray-800">{event.venue}</p>
            <a
              href={googleMapsUrl(event.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ED1C24] hover:underline inline-flex items-center gap-1"
            >
              {event.address}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          </div>

          {(event.contact_name || event.contact_email || event.contact_phone) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Contact
              </h3>
              {event.contact_name && <p className="text-gray-800">{event.contact_name}</p>}
              {event.contact_email && (
                <p>
                  <a
                    href={`mailto:${event.contact_email}`}
                    className="text-[#ED1C24] hover:underline"
                  >
                    {event.contact_email}
                  </a>
                </p>
              )}
              {event.contact_phone && (
                <p className="text-gray-600">{event.contact_phone}</p>
              )}
            </div>
          )}
        </div>

        {event.sponsors && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Presenting Sponsors
            </h3>
            <p className="text-gray-800">{event.sponsors}</p>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            About This Event
          </h3>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {event.description}
          </div>
        </div>

        {(event.facebook_url || event.website) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {event.facebook_url && (
              <a
                href={event.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#1877F2] text-white px-4 py-2 rounded font-medium text-sm hover:bg-blue-700 transition-colors"
              >
                Facebook Event Page
              </a>
            )}
            {event.website && (
              <a
                href={event.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#58595B] text-white px-4 py-2 rounded font-medium text-sm hover:bg-gray-700 transition-colors"
              >
                Event Website
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
