import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getPendingEvents, getAllEvents, isCaptchaEnabled, getTotalStats, getEventViewCounts, getPendingChangeRequests, getEventsWithoutCoords } from "@/lib/db";
import { approveEvent, rejectEvent, toggleCaptcha, approveChangeRequest, rejectChangeRequest, regeocodeMissingEvents } from "./actions";
import AdminSignOut from "./AdminSignOut";
import AdminBulkActions from "./AdminBulkActions";
import AdminEventRow from "./AdminEventRow";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/admin/login");

  const pendingEvents = getPendingEvents();
  const allEvents = getAllEvents();
  const captchaOn = isCaptchaEnabled();
  const stats = getTotalStats();
  const viewCounts = getEventViewCounts();
  const changeRequests = getPendingChangeRequests();
  const missingCoordsEvents = getEventsWithoutCoords();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#0B1C3A]">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/venues"
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Venues
          </Link>
          <Link
            href="/admin/create"
            className="bg-[#C83803] text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-800 transition-colors"
          >
            + Create Event
          </Link>
          <AdminSignOut />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Events", value: stats.total },
          { label: "Approved", value: stats.approved },
          { label: "Pending", value: stats.pending },
          { label: "Total Views", value: stats.totalViews },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-[#0B1C3A]">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CAPTCHA toggle */}
      <section className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">reCAPTCHA</h3>
            <p className="text-xs text-gray-500">
              {captchaOn ? "Enabled — bot submissions are blocked." : "Disabled — bots (like Claude) can submit events."}
            </p>
          </div>
          <form action={async () => { "use server"; await toggleCaptcha(); }}>
            <button
              type="submit"
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${captchaOn ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-orange-800"}`}
            >
              {captchaOn ? "Disable CAPTCHA" : "Enable CAPTCHA"}
            </button>
          </form>
        </div>
      </section>

      {/* Map Tools */}
      {missingCoordsEvents.length > 0 && (
        <section className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Map: Missing Coordinates</h3>
              <p className="text-xs text-yellow-700 mt-0.5">
                {missingCoordsEvents.length} approved event{missingCoordsEvents.length !== 1 ? "s" : ""} won&apos;t appear on the map:{" "}
                {missingCoordsEvents.map(e => e.name).join(", ")}
              </p>
            </div>
            <form action={async () => { "use server"; await regeocodeMissingEvents(); }}>
              <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-yellow-700 transition-colors whitespace-nowrap ml-4">
                Fix Now
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Pending events with bulk actions */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0B1C3A] mb-4">
          Pending Events ({pendingEvents.length})
        </h2>

        {pendingEvents.length === 0 ? (
          <p className="text-gray-500 bg-white rounded-lg border p-4">No events pending review.</p>
        ) : (
          <AdminBulkActions events={pendingEvents}>
            {pendingEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm border p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <input type="checkbox" value={event.id} className="bulk-checkbox mt-1.5 w-4 h-4" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{event.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(event.date_time).toLocaleString()} &bull; {event.venue}
                      </p>
                      <p className="text-sm text-gray-600">{event.address}</p>
                      <p className="text-sm text-gray-600">Cost: {event.cost}</p>
                      <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap line-clamp-3">{event.description}</p>
                      {event.contact_name && <p className="text-sm text-gray-600 mt-1">Contact: {event.contact_name} — {event.contact_email}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/admin/edit/${event.id}`} className="bg-[#0B1C3A] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-700 transition-colors">
                      Edit
                    </Link>
                    <form action={async () => { "use server"; await approveEvent(event.id); }}>
                      <button type="submit" className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700 transition-colors">
                        Approve
                      </button>
                    </form>
                    <form action={async () => { "use server"; await rejectEvent(event.id); }}>
                      <button type="submit" className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-orange-800 transition-colors">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </AdminBulkActions>
        )}
      </section>

      {/* Change Requests */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0B1C3A] mb-4">
          Change Requests ({changeRequests.length})
        </h2>
        {changeRequests.length === 0 ? (
          <p className="text-gray-500 bg-white rounded-lg border p-4">No pending change requests.</p>
        ) : (
          <div className="space-y-4">
            {changeRequests.map((req) => {
              const changes = req.changes ? JSON.parse(req.changes) as Record<string, string> : null;
              return (
                <div key={req.id} className="bg-white rounded-lg shadow-sm border p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-800">{req.event.name}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${req.type === 'delete' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {req.type === 'delete' ? 'Deletion Request' : 'Update Request'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        Submitted {new Date(req.created_at).toLocaleString()} &bull; Contact: {req.event.contact_email || 'none'}
                      </p>
                      {req.type === 'update' && changes && (
                        <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                          <p className="font-medium text-gray-700 mb-2">Requested changes:</p>
                          {Object.entries(changes).map(([key, val]) => {
                            const current = req.event[key as keyof typeof req.event];
                            const changed = String(current ?? '') !== String(val ?? '');
                            return changed ? (
                              <div key={key} className="grid grid-cols-[120px_1fr_1fr] gap-2 text-xs">
                                <span className="font-medium text-gray-500">{key}</span>
                                <span className="text-gray-400 line-through">{String(current ?? '—')}</span>
                                <span className="text-green-700 font-medium">{String(val ?? '—')}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                      {req.type === 'delete' && (
                        <p className="text-sm text-red-600">The submitter is requesting this event be removed from the site.</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <form action={async () => { "use server"; await approveChangeRequest(req.id); }}>
                        <button type="submit" className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700 transition-colors">
                          Approve
                        </button>
                      </form>
                      <form action={async () => { "use server"; await rejectChangeRequest(req.id); }}>
                        <button type="submit" className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-orange-800 transition-colors">
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* All events table */}
      <section>
        <h2 className="text-xl font-semibold text-[#0B1C3A] mb-4">
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
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Views</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {allEvents.map((event) => (
                  <AdminEventRow key={event.id} event={event} views={viewCounts[event.id] ?? 0} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
