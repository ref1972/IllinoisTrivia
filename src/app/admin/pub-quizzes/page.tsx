import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getAllPubQuizzes } from "@/lib/db";
import { approvePubQuiz, rejectPubQuiz, removePubQuiz } from "./actions";

export const dynamic = "force-dynamic";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function statusBadge(status: string) {
  if (status === "approved") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
}

export default async function AdminPubQuizzesPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/admin/login");

  const quizzes = getAllPubQuizzes();
  const pending = quizzes.filter(q => q.status === "pending");
  const rest = quizzes.filter(q => q.status !== "pending");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-[#C83803] hover:underline text-sm">&larr; Back to admin</Link>
          <h1 className="text-3xl font-bold text-[#0B1C3A] mt-2">Pub Quiz Listings</h1>
        </div>
        <span className="text-sm text-gray-500">{quizzes.length} total</span>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#0B1C3A] mb-3">
            Pending Review <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full ml-1">{pending.length}</span>
          </h2>
          <div className="space-y-3">
            {pending.map(q => (
              <div key={q.id} className="bg-white rounded-lg border border-yellow-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0B1C3A]">{q.venue}</div>
                    <div className="text-sm text-gray-500">{q.address}, {q.city}</div>
                    <div className="text-sm text-[#C83803] font-medium">{q.day_of_week}s at {q.start_time}</div>
                    {q.quiz_company && <div className="text-sm text-gray-500">Quiz Co: {q.quiz_company}</div>}
                    {q.host && <div className="text-sm text-gray-500">Host: {q.host}</div>}
                    {q.description && <div className="text-sm text-gray-600 mt-1">{q.description}</div>}
                    {q.format && <div className="text-xs text-gray-400 mt-1">{q.format === "pen_paper" ? "Pen & Paper" : "Mobile App"}</div>}
                    {q.submitter_name && <div className="text-xs text-gray-400 mt-1">Submitted by: {q.submitter_name}{q.submitter_email ? ` (${q.submitter_email})` : ""}</div>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={approvePubQuiz.bind(null, q.id)}>
                      <button type="submit" className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700">Approve</button>
                    </form>
                    <form action={rejectPubQuiz.bind(null, q.id)}>
                      <button type="submit" className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-300">Reject</button>
                    </form>
                    <Link href={`/admin/pub-quizzes/${q.id}/edit`} className="bg-[#0B1C3A] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-900">Edit</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All listings table */}
      {rest.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#0B1C3A] mb-3">All Listings</h2>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Venue</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">City</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">When</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rest.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{q.venue}</td>
                    <td className="px-4 py-2 text-gray-600">{q.city}</td>
                    <td className="px-4 py-2 text-gray-600">{q.day_of_week}s {q.start_time}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge(q.status)}`}>{q.status}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 items-center">
                        <Link href={`/admin/pub-quizzes/${q.id}/edit`} className="text-[#C83803] hover:underline text-sm">Edit</Link>
                        {q.status === "rejected" && (
                          <form action={approvePubQuiz.bind(null, q.id)} className="inline">
                            <button type="submit" className="text-green-600 hover:underline text-sm">Approve</button>
                          </form>
                        )}
                        <form action={removePubQuiz.bind(null, q.id)} className="inline" onSubmit={e => { if (!confirm("Delete this listing?")) e.preventDefault(); }}>
                          <button type="submit" className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {quizzes.length === 0 && (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">No pub quiz listings yet.</div>
      )}
    </div>
  );
}
