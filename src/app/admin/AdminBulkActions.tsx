"use client";

import { useState } from "react";
import { Event } from "@/lib/types";
import { bulkApprove, bulkReject } from "./actions";

export default function AdminBulkActions({
  events,
  children,
}: {
  events: Event[];
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(events.map(e => e.id)) : new Set());
  }

  function handleChange(e: React.ChangeEvent<HTMLDivElement>) {
    const cb = e.target as HTMLInputElement;
    if (cb.classList.contains("bulk-checkbox")) {
      const id = parseInt(cb.value, 10);
      setSelected(prev => {
        const next = new Set(prev);
        if (cb.checked) { next.add(id); } else { next.delete(id); }
        return next;
      });
    }
  }

  async function handleBulkApprove() {
    if (selected.size === 0) return;
    setLoading(true);
    await bulkApprove(Array.from(selected));
    setSelected(new Set());
    setLoading(false);
  }

  async function handleBulkReject() {
    if (selected.size === 0) return;
    setLoading(true);
    await bulkReject(Array.from(selected));
    setSelected(new Set());
    setLoading(false);
  }

  return (
    <div>
      {/* Bulk toolbar */}
      <div className="flex items-center gap-3 mb-3 bg-gray-50 border rounded-lg px-4 py-2">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            onChange={e => toggleAll(e.target.checked)}
            checked={selected.size === events.length && events.length > 0}
          />
          Select all
        </label>
        {selected.size > 0 && (
          <>
            <span className="text-sm text-gray-500">{selected.size} selected</span>
            <button
              onClick={handleBulkApprove}
              disabled={loading}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Approve Selected
            </button>
            <button
              onClick={handleBulkReject}
              disabled={loading}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-orange-800 disabled:opacity-50 transition-colors"
            >
              Reject Selected
            </button>
          </>
        )}
      </div>

      <div className="space-y-4" onChange={handleChange}>
        {children}
      </div>
    </div>
  );
}
