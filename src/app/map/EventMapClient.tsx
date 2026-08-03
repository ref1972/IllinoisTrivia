"use client";

import dynamic from "next/dynamic";
import type { MapEvent } from "./EventMap";

// Leaflet touches `window` at module scope, so it must never be evaluated on
// the server. `ssr: false` is only allowed inside a client component, which is
// why the map page renders this wrapper instead of EventMap directly.
const EventMap = dynamic(() => import("./EventMap"), { ssr: false });

export default function EventMapClient({ events }: { events: MapEvent[] }) {
  return <EventMap events={events} />;
}
