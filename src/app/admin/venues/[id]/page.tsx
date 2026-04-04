import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getVenueById } from "@/lib/db";
import { editVenue } from "../actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditVenuePage({ params }: { params: { id: string } }) {
  const admin = await isAdmin();
  if (!admin) redirect("/admin/login");

  const venue = getVenueById(Number(params.id));
  if (!venue) return notFound();

  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C83803]";

  return (
    <div className="max-w-xl">
      <Link href="/admin/venues" className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">← Back to Venues</Link>
      <h1 className="text-2xl font-bold text-[#0B1C3A] mb-6">Edit Venue</h1>

      <form
        action={async (fd: FormData) => {
          "use server";
          await editVenue(venue.id, {
            name: fd.get("name") as string,
            address: fd.get("address") as string,
            website: (fd.get("website") as string) || undefined,
          });
          redirect("/admin/venues");
        }}
        className="bg-white border rounded-lg p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
          <input name="name" defaultValue={venue.name} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <input name="address" defaultValue={venue.address} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input name="website" type="url" defaultValue={venue.website || ""} className={inputClass} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="submit" className="bg-[#C83803] text-white px-5 py-3 rounded font-medium hover:bg-orange-800 transition-colors min-h-[48px] w-full sm:w-auto">
            Save Changes
          </button>
          <Link href="/admin/venues" className="bg-gray-200 text-gray-700 px-4 py-3 rounded font-medium hover:bg-gray-300 transition-colors min-h-[48px] text-center w-full sm:w-auto">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
