import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getPubQuizById } from "@/lib/db";
import { savePubQuizEdit } from "../../actions";

export const dynamic = "force-dynamic";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function EditPubQuizPage({ params }: { params: { id: string } }) {
  const admin = await isAdmin();
  if (!admin) redirect("/admin/login");

  const id = parseInt(params.id, 10);
  const quiz = getPubQuizById(id);
  if (!quiz) notFound();

  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B1C3A]";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-2xl">
      <Link href="/admin/pub-quizzes" className="text-[#C83803] hover:underline text-sm">&larr; Back to Pub Quiz Listings</Link>
      <h1 className="text-2xl font-bold text-[#0B1C3A] mt-2 mb-6">Edit Pub Quiz Listing</h1>

      <form action={savePubQuizEdit.bind(null, id)} className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Venue Name</label>
            <input type="text" name="venue" defaultValue={quiz.venue} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input type="text" name="city" defaultValue={quiz.city} required className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Street Address</label>
          <input type="text" name="address" defaultValue={quiz.address} required className={inputClass} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Venue Website</label>
            <input type="url" name="venue_website" defaultValue={quiz.venue_website || ""} className={inputClass} placeholder="https://…" />
          </div>
          <div>
            <label className={labelClass}>Quiz / Event Website</label>
            <input type="url" name="website" defaultValue={quiz.website || ""} className={inputClass} placeholder="https://…" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Day of the Week</label>
            <select name="day_of_week" defaultValue={quiz.day_of_week} required className={inputClass}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Start Time</label>
            <input type="text" name="start_time" defaultValue={quiz.start_time} required className={inputClass} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Quiz Company</label>
            <input type="text" name="quiz_company" defaultValue={quiz.quiz_company || ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Regular Host</label>
            <input type="text" name="host" defaultValue={quiz.host || ""} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description / Notes</label>
          <textarea name="description" defaultValue={quiz.description || ""} rows={3} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Format</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="format" value="pen_paper" defaultChecked={quiz.format === "pen_paper"} className="accent-[#0B1C3A]" />
              <span className="text-sm">Pen &amp; Paper</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="format" value="mobile_app" defaultChecked={quiz.format === "mobile_app"} className="accent-[#0B1C3A]" />
              <span className="text-sm">Mobile App</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="format" value="" defaultChecked={!quiz.format} className="accent-[#0B1C3A]" />
              <span className="text-sm">Not specified</span>
            </label>
          </div>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={quiz.status} className={inputClass}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {(quiz.latitude || quiz.longitude) && (
          <div className="text-xs text-gray-400">
            Coordinates: {quiz.latitude?.toFixed(5)}, {quiz.longitude?.toFixed(5)}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-[#C83803] text-white px-6 py-2 rounded font-medium hover:bg-orange-800 transition-colors">
            Save Changes
          </button>
          <Link href="/admin/pub-quizzes" className="px-6 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
