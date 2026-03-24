import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { getPendingEvents, getAllEvents } from "@/lib/db";
import { approveEvent, rejectEvent } from "./actions";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token || !verifySessionToken(token)) {
    redirect("/admin/login");
  }

  const pendingEvents = getPendingEvents();
  const allEvents = getAllEvents();

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#58595B] mb-6">Admin Dashboard</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#58595B] mb-4">
          Pending Events ({pendingEvents.length})
        </h2>

        {pendingEvents.length === 0 ? (
          <p className="text-gray-500 bg-white rounded-lg border p-4">No events pending review.</p>
        ) : (
          <div className="space-y-4">
            {pendingEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm border p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{event.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(event.date_time).toLocaleString()} &bull; {event.venue}
                    </p>
                    <p className="text-sm text-gray-600">{event.address}</p>
                    <p className="text-sm text-gray-600">Cost: {event.cost}</p>
                    <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{event.description}</p>
                    {event.sponsors && (
                      <p className="text-sm text-gray-600 mt-1">Sponsors: {event.sponsors}</p>
                    )}
                    {event.facebook_url && (
                      <p className="text-sm text-gray-600 mt-1">
                        Facebook: <a href={event.facebook_url} target="_blank" rel="noopener noreferrer" className="text-[#ED1C24] hover:underline">{event.facebook_url}</a>
                      </p>
                    )}
                    {event.website && (
                      <p className="text-sm text-gray-600 mt-1">
                        Website: <a href={event.website} target="_blank" rel="noopener noreferrer" className="text-[#ED1C24] hover:underline">{event.website}</a>
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Contact: {event.contact_name} &mdash;{" "}
                      <a href={`mailto:${event.contact_email}`} className="text-[#ED1C24] hover:underline">
                        {event.contact_email}
                      </a>
                      {event.contact_phone && ` \u2022 ${event.contact_phone}`}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/edit/${event.id}`}
                      className="bg-[#58595B] text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-900 transition-colors"
                    >
                      Edit
                    </Link>
                    <form action={async () => { "use server"; await approveEvent(event.id); }}>
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={async () => { "use server"; await rejectEvent(event.id); }}>
                      <button
                        type="submit"
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-[#58595B] mb-4">
          All Events ({allEvents.length})
        </h2>

        {allEvents.length === 0 ? (
          <p className="text-gray-500">No events yet.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Event</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {allEvents.map((event) => (
                  <tr key={event.id} className="border-b last:border-b-0">
                    <td className="px-4 py-2 text-gray-800">{event.name}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {new Date(event.date_time).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {event.is_workshop === 1 && (
                        <span className="inline-block bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-medium">
                          Workshop
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          event.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : event.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/edit/${event.id}`}
                        className="text-[#ED1C24] hover:underline text-sm"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
