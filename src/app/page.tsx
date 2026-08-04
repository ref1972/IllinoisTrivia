import type { Metadata } from "next";
import Link from "next/link";
import { getApprovedEvents } from "@/lib/db";
import { getCityIndex } from "@/lib/cities";
import EventList from "@/components/EventList";
import SubscribeForm from "@/components/SubscribeForm";

export const metadata: Metadata = {
  // The root layout's title template only applies to child segments, so the
  // brand suffix is spelled out here.
  title: "Upcoming Trivia Night Fundraisers in Illinois | IllinoisTrivia.com",
  description: "Browse upcoming trivia night fundraising events across Illinois. Find one near you, or list your own for free.",
};

export const dynamic = "force-dynamic";

export default function HomePage() {
  const events = getApprovedEvents();
  const cities = getCityIndex();

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main content */}
      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B1C3A] mb-2">
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
              className="inline-block bg-[#C83803] text-white px-6 py-2 rounded font-medium hover:bg-orange-800 transition-colors"
            >
              Submit the first event!
            </Link>
          </div>
        ) : (
          <EventList events={events} />
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:w-72 space-y-6">
        <SubscribeForm />
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#0B1C3A] mb-1">Host a Trivia Night?</h2>
          <p className="text-sm text-gray-600 mb-3">List your fundraising event for free on IllinoisTrivia.com.</p>
          <Link
            href="/submit"
            className="block text-center bg-[#C83803] text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-800 transition-colors"
          >
            Submit an Event
          </Link>
        </div>
        {cities.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#0B1C3A] mb-3">Browse by City</h2>
            <ul className="space-y-1.5">
              {cities.slice(0, 8).map(city => (
                <li key={city.slug}>
                  <Link
                    href={`/trivia/${city.slug}`}
                    className="text-sm text-gray-700 hover:text-[#C83803] transition-colors"
                  >
                    {city.city}
                    <span className="text-gray-400 ml-1.5">
                      {city.upcoming + city.quizzes}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {cities.length > 8 && (
              <Link href="/trivia" className="inline-block mt-3 text-sm text-[#C83803] font-medium hover:underline">
                All {cities.length} cities &rarr;
              </Link>
            )}
          </div>
        )}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#0B1C3A] mb-1">Event Map</h2>
          <p className="text-sm text-gray-600 mb-3">See upcoming events plotted on a map of Illinois.</p>
          <Link
            href="/map"
            className="block text-center bg-[#0B1C3A] text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            View Map
          </Link>
        </div>
      </div>
    </div>
  );
}
