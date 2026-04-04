import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getAllVenues } from "@/lib/db";
import { createVenue, editVenue, removeVenue } from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VenuesPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/admin/login");

  const venues = getAllVenues();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">← Back to Dashboard</Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0B1C3A]">Venues</h1>
        </div>
      </div>

      {/* Add venue form */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#0B1C3A] mb-3">Add Venue</h2>
        <form
          action={async (fd: FormData) => {
            "use server";
            await createVenue({
              name: fd.get("name") as string,
              address: fd.get("address") as string,
              website: (fd.get("website") as string) || undefined,
            });
          }}
          className="bg-white border rounded-lg p-5 flex flex-col sm:flex-row gap-3 items-end"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Venue Name *</label>
            <input name="name" required className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C83803]" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Address *</label>
            <input name="address" required className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C83803]" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
            <input name="website" type="url" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C83803]" />
          </div>
          <button type="submit" className="bg-[#C83803] text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-800 transition-colors whitespace-nowrap min-h-[44px] w-full sm:w-auto">
            Add Venue
          </button>
        </form>
      </section>

      {/* Venue list */}
      <section>
        <h2 className="text-lg font-semibold text-[#0B1C3A] mb-3">All Venues ({venues.length})</h2>
        {venues.length === 0 ? (
          <p className="text-gray-500 bg-white border rounded-lg p-4">No venues yet. They&apos;ll be added automatically when you create or approve events.</p>
        ) : (
          <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Venue</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Address</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Website</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {venues.map(venue => (
                  <tr key={venue.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{venue.name}</td>
                    <td className="px-4 py-3 text-gray-600">{venue.address}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {venue.website ? <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px] block">{venue.website}</a> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/admin/venues/${venue.id}`}
                          className="bg-[#0B1C3A] text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-700 transition-colors"
                        >
                          Edit
                        </Link>
                        <form action={async () => { "use server"; await removeVenue(venue.id); }}>
                          <button type="submit" className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-orange-800 transition-colors">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {venues.map(venue => (
              <div key={venue.id} className="bg-white border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 text-sm">{venue.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{venue.address}</p>
                {venue.website && (
                  <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-0.5 block truncate">{venue.website}</a>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <Link
                    href={`/admin/venues/${venue.id}`}
                    className="text-[#C83803] hover:underline text-sm min-h-[44px] flex items-center"
                  >
                    Edit
                  </Link>
                  <form action={async () => { "use server"; await removeVenue(venue.id); }}>
                    <button type="submit" className="text-red-500 hover:underline text-sm min-h-[44px]">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </section>
    </div>
  );
}
