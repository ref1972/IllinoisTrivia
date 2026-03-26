import Link from "next/link";
import { getApprovedEvents } from "@/lib/db";
import EventList from "@/components/EventList";
import SubscribeForm from "@/components/SubscribeForm";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const events = getApprovedEvents();

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main content */}
      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#58595B] mb-2">
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
              className="inline-block bg-[#ED1C24] text-white px-6 py-2 rounded font-medium hover:bg-red-700 transition-colors"
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
          <h2 className="text-lg font-bold text-[#58595B] mb-1">Host a Trivia Night?</h2>
          <p className="text-sm text-gray-600 mb-3">List your fundraising event for free on IllinoisTrivia.com.</p>
          <Link
            href="/submit"
            className="block text-center bg-[#ED1C24] text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Submit an Event
          </Link>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#58595B] mb-1">Event Map</h2>
          <p className="text-sm text-gray-600 mb-3">See upcoming events plotted on a map of Illinois.</p>
          <Link
            href="/map"
            className="block text-center bg-[#58595B] text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            View Map
          </Link>
        </div>
      </div>
    </div>
  );
}
