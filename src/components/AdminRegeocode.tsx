"use client";

import { useState } from "react";

export default function AdminRegeocode({ count }: { count: number }) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState("");

  async function handleClick() {
    setStatus("running");
    try {
      const res = await fetch("/api/admin/regeocode", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(`Fixed ${data.fixed} of ${data.total} events.`);
      setStatus("done");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Error");
      setStatus("error");
    }
  }

  if (status === "done") {
    return <span className="text-green-700 text-sm font-medium">{result} Reloading...</span>;
  }

  if (status === "error") {
    return <span className="text-red-700 text-sm font-medium">{result}</span>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === "running"}
      className="bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-yellow-700 transition-colors whitespace-nowrap ml-4 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {status === "running" ? `Geocoding ${count} event${count !== 1 ? "s" : ""}…` : "Fix Now"}
    </button>
  );
}
