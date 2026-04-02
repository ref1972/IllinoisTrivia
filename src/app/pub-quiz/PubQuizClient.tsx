"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PubQuiz } from "@/lib/types";

const PubQuizMap = dynamic(() => import("./PubQuizMap"), { ssr: false });

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatBadge(q: PubQuiz) {
  if (q.format === "pen_paper") return "Pen & Paper";
  if (q.format === "mobile_app") return "Mobile App";
  return null;
}

export default function PubQuizClient({ quizzes }: { quizzes: PubQuiz[] }) {
  const [tab, setTab] = useState<"list" | "map">("list");
  const [cityFilter, setCityFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");

  const cities = useMemo(() => {
    const set = new Set(quizzes.map(q => q.city));
    return Array.from(set).sort();
  }, [quizzes]);

  const filtered = useMemo(() => {
    return quizzes.filter(q => {
      if (cityFilter !== "all" && q.city !== cityFilter) return false;
      if (dayFilter !== "all" && q.day_of_week !== dayFilter) return false;
      return true;
    });
  }, [quizzes, cityFilter, dayFilter]);

  // Group filtered list by day
  const byDay = useMemo(() => {
    const map: Record<string, PubQuiz[]> = {};
    for (const day of DAYS) {
      const group = filtered.filter(q => q.day_of_week === day);
      if (group.length > 0) map[day] = group;
    }
    return map;
  }, [filtered]);

  const tabClass = (t: "list" | "map") =>
    `px-5 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
      tab === t
        ? "border-[#C83803] text-[#C83803] bg-white"
        : "border-transparent text-gray-500 hover:text-gray-700 bg-gray-50"
    }`;

  const selectClass = "border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1C3A]";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1C3A]">Pub Quiz Finder</h1>
          <p className="text-gray-500 text-sm mt-1">Recurring bar trivia nights across Illinois</p>
        </div>
        <Link
          href="/pub-quiz/submit"
          className="bg-[#C83803] text-white px-4 py-2 rounded font-medium text-sm hover:bg-orange-800 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          + Add a Listing
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className={selectClass}>
          <option value="all">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} className={selectClass}>
          <option value="all">All Days</option>
          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {(cityFilter !== "all" || dayFilter !== "all") && (
          <button onClick={() => { setCityFilter("all"); setDayFilter("all"); }} className="text-sm text-gray-400 hover:text-gray-600 underline">
            Clear filters
          </button>
        )}
        <span className="text-sm text-gray-400 self-center">{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-0">
        <div className="flex gap-1">
          <button className={tabClass("list")} onClick={() => setTab("list")}>List</button>
          <button className={tabClass("map")} onClick={() => setTab("map")}>Map</button>
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg">
        {tab === "list" ? (
          <div className="p-4">
            {filtered.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No listings match your filters.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(byDay).map(([day, items]) => (
                  <div key={day}>
                    <h2 className="text-sm font-bold text-[#0B1C3A] uppercase tracking-wider mb-2 pb-1 border-b border-gray-100">
                      {day}s
                    </h2>
                    <div className="space-y-2">
                      {items.map(q => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="text-[#C83803] font-semibold text-sm w-20 shrink-0 pt-0.5">{q.start_time}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#0B1C3A]">{q.venue}</div>
                            <div className="text-sm text-gray-500">{q.address}, {q.city}</div>
                            {(q.quiz_company || q.host) && (
                              <div className="text-sm text-gray-500">
                                {q.quiz_company && <span>{q.quiz_company}</span>}
                                {q.quiz_company && q.host && <span> &middot; </span>}
                                {q.host && <span>Host: {q.host}</span>}
                              </div>
                            )}
                            {q.description && <div className="text-sm text-gray-600 mt-1">{q.description}</div>}
                            <div className="flex gap-3 mt-1">
                              {q.venue_website && <a href={q.venue_website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C83803] hover:underline">Venue Site</a>}
                              {q.website && <a href={q.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C83803] hover:underline">Quiz Info</a>}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {formatBadge(q) && (
                              <span className="inline-block bg-[#0B1C3A] text-white text-xs px-2 py-0.5 rounded-full">
                                {formatBadge(q)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <PubQuizMap quizzes={filtered} />
        )}
      </div>
    </div>
  );
}
