"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapEvent {
  id: number;
  name: string;
  venue: string;
  address: string;
  date_time: string;
  cost: string;
  latitude: number;
  longitude: number;
  is_workshop: number;
}

// Custom marker icons
const defaultIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: #ED1C24; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const workshopIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: #F59E0B; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px;">&#9733;</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventMap({ events }: { events: MapEvent[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Center on Illinois
    const map = L.map(mapRef.current).setView([40.0, -89.5], 7);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    events.forEach((event) => {
      const icon = event.is_workshop ? workshopIcon : defaultIcon;

      const popup = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: bold; color: #58595B;">
            ${event.name}
          </h3>
          ${event.is_workshop ? '<span style="background: #F59E0B; color: white; font-size: 10px; font-weight: bold; padding: 1px 6px; border-radius: 3px; text-transform: uppercase;">Trivia Workshop</span>' : ''}
          <p style="margin: 6px 0 2px 0; font-size: 13px; color: #666;">
            <strong>${event.venue}</strong><br/>
            ${event.address}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #ED1C24; font-weight: 600;">
            ${formatDate(event.date_time)} at ${formatTime(event.date_time)}
          </p>
          <p style="margin: 2px 0 6px 0; font-size: 13px; color: #666;">${event.cost}</p>
          <a href="/events/${event.id}" style="color: #ED1C24; font-size: 13px; font-weight: 500; text-decoration: none;">
            View Details &rarr;
          </a>
        </div>
      `;

      L.marker([event.latitude, event.longitude], { icon })
        .addTo(map)
        .bindPopup(popup);
    });

    // Fit bounds if there are events
    if (events.length > 0) {
      const bounds = L.latLngBounds(
        events.map((e) => [e.latitude, e.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [events]);

  return (
    <div
      ref={mapRef}
      style={{ height: "600px", width: "100%" }}
    />
  );
}
