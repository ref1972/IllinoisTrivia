import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getAllSubscribers } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/admin/login");

  const subscribers = getAllSubscribers();

  const regionCounts = subscribers.reduce<Record<string, number>>((acc, s) => {
    acc[s.region] = (acc[s.region] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-[#C83803] hover:underline text-sm">
            &larr; Back to admin
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0B1C3A] mt-2">Subscribers</h1>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-[#0B1C3A]">{subscribers.length}</p>
          <p className="text-sm text-gray-500">total subscribers</p>
        </div>
      </div>

      {/* Region breakdown */}
      {Object.keys(regionCounts).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">By Region</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(regionCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([region, count]) => (
                <span
                  key={region}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                >
                  <span className="font-medium">{region}</span>
                  <span className="bg-white text-gray-500 text-xs px-1.5 py-0.5 rounded-full font-semibold">{count}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {subscribers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
          No subscribers yet.
        </div>
      ) : (
        <>
        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Region</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Signed Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscribers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {s.region}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(s.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden bg-white rounded-lg shadow-sm border divide-y">
          {subscribers.map((s) => (
            <div key={s.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-800 truncate">{s.email}</span>
                <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                  {s.region}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(s.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
