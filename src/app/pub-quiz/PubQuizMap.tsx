"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PubQuiz } from "@/lib/types";

const markerIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: #0B1C3A; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 13px;">🍺</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

export default function PubQuizMap({ quizzes }: { quizzes: PubQuiz[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([40.0, -89.5], 7);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const mapped = quizzes.filter(q => q.latitude && q.longitude);

    mapped.forEach((q) => {
      const formatLabel = q.format === 'pen_paper' ? 'Pen &amp; Paper' : q.format === 'mobile_app' ? 'Mobile App' : '';
      const popup = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: bold; color: #0B1C3A;">${q.venue}</h3>
          <p style="margin: 4px 0 2px 0; font-size: 13px; color: #666;">${q.address}<br/>${q.city}, IL</p>
          <p style="margin: 4px 0; font-size: 13px; color: #C83803; font-weight: 600;">${q.day_of_week}s at ${q.start_time}</p>
          ${q.quiz_company ? `<p style="margin: 2px 0; font-size: 12px; color: #666;">by ${q.quiz_company}</p>` : ''}
          ${q.host ? `<p style="margin: 2px 0; font-size: 12px; color: #666;">Host: ${q.host}</p>` : ''}
          ${formatLabel ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #888;">${formatLabel}</p>` : ''}
        </div>
      `;
      L.marker([q.latitude!, q.longitude!], { icon: markerIcon }).addTo(map).bindPopup(popup);
    });

    if (mapped.length > 0) {
      const bounds = L.latLngBounds(mapped.map(q => [q.latitude!, q.longitude!] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [quizzes]);

  const mapped = quizzes.filter(q => q.latitude && q.longitude);

  return (
    <div>
      <div ref={mapRef} style={{ height: "600px", width: "100%" }} />
      {mapped.length < quizzes.length && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          {quizzes.length - mapped.length} listing{quizzes.length - mapped.length !== 1 ? 's' : ''} could not be mapped (address not found).
        </p>
      )}
    </div>
  );
}
