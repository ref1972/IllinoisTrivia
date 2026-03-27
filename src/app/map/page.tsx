import { getMapEvents } from "@/lib/db";
import EventMap from "./EventMap";

export const dynamic = "force-dynamic";

export default function MapPage() {
  const events = getMapEvents();

  const mapEvents = events.map((e) => ({
    id: e.id,
    name: e.name,
    venue: e.venue,
    address: e.address,
    date_time: e.date_time,
    cost: e.cost,
    latitude: e.latitude!,
    longitude: e.longitude!,
    is_workshop: e.is_workshop,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0B1C3A] mb-2">Event Map</h1>
        <p className="text-gray-600">
          Find trivia night fundraisers near you across Illinois.
        </p>
      </div>

      {mapEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
          <p className="text-gray-500 text-lg">No mapped events yet. Check back soon!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <EventMap events={mapEvents} />
        </div>
      )}
    </div>
  );
}
