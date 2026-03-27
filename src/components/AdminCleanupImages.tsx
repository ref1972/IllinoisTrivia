"use client";

import { useState } from "react";

export default function AdminCleanupImages() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState("");

  async function handleClick() {
    if (!confirm("Delete all images not linked to any event?")) return;
    setStatus("running");
    try {
      const res = await fetch("/api/admin/cleanup-images", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(`Deleted ${data.deleted} of ${data.total} files.`);
      setStatus("done");
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Error");
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={status === "running"}
        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "running" ? "Cleaning…" : "Clean Up Images"}
      </button>
      {(status === "done" || status === "error") && (
        <span className={`text-xs ${status === "done" ? "text-green-700" : "text-red-600"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
