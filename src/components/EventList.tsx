"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Event } from "@/lib/types";
import EventTagBadges from "@/components/EventTagBadges";

type SortOption = "date" | "name";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

function extractCity(address: string): string {
  // "123 Main St, Chicago, IL 60601" → "Chicago"
  const parts = address.split(",");
  return parts.length >= 2 ? parts[parts.length - 2].trim() : address;
}

export default function EventList({ events }: { events: Event[] }) {
  const [sort, setSort] = useState<SortOption>("date");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [costFilter, setCostFilter] = useState("all");

  const cities = useMemo(() => {
    const set = new Set(events.map(e => extractCity(e.address)));
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    let result = [...events];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.address.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }

    if (cityFilter !== "all") {
      result = result.filter(e => extractCity(e.address) === cityFilter);
    }

    if (costFilter === "free") {
      result = result.filter(e => e.cost.toLowerCase().includes("free"));
    } else if (costFilter === "paid") {
      result = result.filter(e => !e.cost.toLowerCase().includes("free"));
    }

    result.sort((a, b) => {
      if (a.is_workshop !== b.is_workshop) return b.is_workshop - a.is_workshop;
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
    });

    return result;
  }, [events, search, cityFilter, costFilter, sort]);

  const selectClass = "text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1C3A]";

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-lg border shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0B1C3A]"
        />
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className={selectClass}>
          <option value="all">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={costFilter} onChange={e => setCostFilter(e.target.value)} className={selectClass}>
          <option value="all">Any Cost</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 whitespace-nowrap">Sort:</span>
          <button
            onClick={() => setSort("date")}
            className={`text-sm px-3 py-1 rounded font-medium transition-colors ${sort === "date" ? "bg-[#0B1C3A] text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
          >
            Date
          </button>
          <button
            onClick={() => setSort("name")}
            className={`text-sm px-3 py-1 rounded font-medium transition-colors ${sort === "name" ? "bg-[#0B1C3A] text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
          >
            Name
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No events match your search.</p>
          <button onClick={() => { setSearch(""); setCityFilter("all"); setCostFilter("all"); }} className="mt-2 text-sm text-[#C83803] hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{filtered.length} event{filtered.length !== 1 ? "s" : ""} found</p>
          <div className="grid gap-4">
            {filtered.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className={`block rounded-lg shadow-sm border hover:shadow-md transition-shadow p-5 ${
                  event.is_workshop ? "bg-amber-50 border-amber-300 ring-2 ring-amber-300" : "bg-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-semibold text-[#0B1C3A]">{event.name}</h2>
                      {event.is_workshop === 1 && (
                        <span className="inline-block bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                          Trivia Workshop
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{event.venue} &mdash; {event.address}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#C83803] font-semibold">{formatDate(event.date_time)}</p>
                    <p className="text-gray-500 text-sm">{formatTime(event.date_time)} &bull; {event.cost}</p>
                    <div className="mt-1.5 flex justify-end">
                      <EventTagBadges tags={event.tags} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
