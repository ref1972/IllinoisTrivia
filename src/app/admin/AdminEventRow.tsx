"use client";

import Link from "next/link";
import { useState } from "react";
import { Event } from "@/lib/types";
import { removeEvent, cloneEvent } from "./actions";

export default function AdminEventRow({ event, views }: { event: Event; views: number }) {
  const [confirming, setConfirming] = useState(false);

  const statusBadge = (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
      event.status === "approved" ? "bg-green-100 text-green-800"
      : event.status === "rejected" ? "bg-red-100 text-red-800"
      : "bg-yellow-100 text-yellow-800"
    }`}>
      {event.status}
    </span>
  );

  const actions = (
    <div className="flex items-center gap-3 md:gap-2">
      <Link href={`/admin/edit/${event.id}`} className="text-[#C83803] hover:underline text-sm min-h-[44px] md:min-h-0 flex items-center">
        Edit
      </Link>
      <form action={cloneEvent.bind(null, event.id)}>
        <button type="submit" className="text-[#0B1C3A] hover:underline text-sm min-h-[44px] md:min-h-0">
          Duplicate
        </button>
      </form>
      {confirming ? (
        <form action={removeEvent.bind(null, event.id)} className="inline flex items-center gap-2">
          <button type="submit" className="text-red-600 hover:underline text-sm font-medium min-h-[44px] md:min-h-0">
            Confirm
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="text-gray-400 hover:underline text-sm min-h-[44px] md:min-h-0">
            Cancel
          </button>
        </form>
      ) : (
        <button onClick={() => setConfirming(true)} className="text-red-400 hover:text-red-600 hover:underline text-sm min-h-[44px] md:min-h-0">
          Delete
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop table row */}
      <tr className="border-b last:border-b-0 hidden md:table-row">
        <td className="px-4 py-2 text-gray-800">{event.name}</td>
        <td className="px-4 py-2 text-gray-600">{new Date(event.date_time).toLocaleDateString("en-US")}</td>
        <td className="px-4 py-2">
          {event.is_workshop === 1 && (
            <span className="inline-block bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-medium">Workshop</span>
          )}
        </td>
        <td className="px-4 py-2">{statusBadge}</td>
        <td className="px-4 py-2 text-gray-500">{views}</td>
        <td className="px-4 py-2">{actions}</td>
      </tr>

      {/* Mobile card */}
      <tr className="md:hidden">
        <td colSpan={6} className="p-0">
          <div className="border-b p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-medium text-gray-800 text-sm leading-tight">{event.name}</h3>
              {statusBadge}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              {new Date(event.date_time).toLocaleDateString("en-US")}
              {event.is_workshop === 1 && " · Workshop"}
              {" · "}{views} views
            </p>
            {actions}
          </div>
        </td>
      </tr>
    </>
  );
}
