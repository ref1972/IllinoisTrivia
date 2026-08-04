import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCityPageData } from "@/lib/cities";
import { Event, PubQuiz } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const data = getCityPageData(params.city);
  if (!data) return { title: "City Not Found" };

  const { city, upcoming, quizzes } = data;
  const parts: string[] = [];
  if (upcoming.length) parts.push(`${upcoming.length} upcoming trivia night fundraiser${upcoming.length === 1 ? "" : "s"}`);
  if (quizzes.length) parts.push(`${quizzes.length} weekly pub quiz${quizzes.length === 1 ? "" : "zes"}`);

  return {
    title: `Trivia Nights in ${city}, IL`,
    description: parts.length
      ? `${parts.join(" and ")} in ${city}, Illinois. Dates, venues, and details.`
      : `Trivia night fundraisers and pub quizzes in ${city}, Illinois.`,
    alternates: { canonical: `/trivia/${data.slug}` },
  };
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="block bg-white rounded-lg border shadow-sm p-5 hover:border-[#C83803] transition-colors"
    >
      <h3 className="text-lg font-semibold text-[#0B1C3A]">{event.name}</h3>
      <p className="text-sm text-[#C83803] font-medium mt-1">
        {formatDate(event.date_time)} at {formatTime(event.date_time)}
      </p>
      <p className="text-sm text-gray-600 mt-1">{event.venue}</p>
      <p className="text-sm text-gray-500">{event.address}</p>
      <p className="text-sm text-gray-600 mt-1">Cost: {event.cost}</p>
    </Link>
  );
}

function QuizCard({ quiz }: { quiz: PubQuiz }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-5">
      <h3 className="text-lg font-semibold text-[#0B1C3A]">{quiz.venue}</h3>
      <p className="text-sm text-[#C83803] font-medium mt-1">
        {quiz.event_type === "recurring" && quiz.day_of_week
          ? `Every ${quiz.day_of_week} at ${quiz.start_time}`
          : `${quiz.event_date ? formatDate(quiz.event_date) : "One-off"} at ${quiz.start_time}`}
      </p>
      <p className="text-sm text-gray-500">{quiz.address}</p>
      {quiz.host && <p className="text-sm text-gray-600 mt-1">Hosted by {quiz.host}</p>}
    </div>
  );
}

export default function CityPage({ params }: { params: { city: string } }) {
  const data = getCityPageData(params.city);
  if (!data) notFound();

  const { city, upcoming, past, quizzes } = data;
  const recentPast = past.slice(0, 6);

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="text-[#C83803] hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/trivia" className="text-[#C83803] hover:underline">Cities</Link>
        <span className="mx-2">/</span>
        <span>{city}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#0B1C3A] mb-2">
          Trivia Nights in {city}, Illinois
        </h1>
        <p className="text-gray-600">
          Trivia night fundraisers and weekly pub quizzes in and around {city}.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0B1C3A] mb-4">
          Upcoming Fundraisers ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm p-6 text-gray-500">
            <p className="mb-3">No upcoming fundraisers listed in {city} right now.</p>
            <Link href="/submit" className="text-[#C83803] font-medium hover:underline">
              List one for free &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </section>

      {quizzes.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-[#0B1C3A] mb-4">
            Weekly Pub Quizzes ({quizzes.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {quizzes.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}
          </div>
        </section>
      )}

      {recentPast.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-[#0B1C3A] mb-4">Past Events in {city}</h2>
          <ul className="bg-white rounded-lg border shadow-sm divide-y">
            {recentPast.map(event => (
              <li key={event.id} className="px-5 py-3">
                <Link href={`/events/${event.id}`} className="text-[#0B1C3A] hover:text-[#C83803] font-medium">
                  {event.name}
                </Link>
                <span className="text-sm text-gray-500 ml-2">{formatDate(event.date_time)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="bg-[#0B1C3A] text-white rounded-lg p-6">
        <h2 className="text-lg font-bold mb-1">Hosting a trivia night in {city}?</h2>
        <p className="text-sm text-gray-300 mb-4">
          Listing your fundraiser on IllinoisTrivia.com is free.
        </p>
        <Link
          href="/submit"
          className="inline-block bg-[#C83803] text-white px-5 py-2 rounded font-medium hover:bg-orange-800 transition-colors"
        >
          Submit an Event
        </Link>
      </div>
    </div>
  );
}
