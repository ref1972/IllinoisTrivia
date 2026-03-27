"use client";

import { useState } from "react";
import { EventTags } from "@/lib/types";

const TAG_GROUPS: { key: keyof EventTags; label: string; options: { value: string; label: string }[] }[] = [
  { key: "age", label: "Age Requirement", options: [{ value: "AA", label: "All Ages" }, { value: "18", label: "18+" }, { value: "21", label: "21+" }] },
  { key: "bar", label: "Bar", options: [{ value: "CB", label: "Cash Bar" }, { value: "OB", label: "Open Bar" }, { value: "NA", label: "No Alcohol" }] },
  { key: "mulligans", label: "Mulligans", options: [{ value: "M", label: "Mulligans" }, { value: "NM", label: "No Mulligans" }] },
  { key: "auction", label: "Auction", options: [{ value: "LA", label: "Live Auction" }, { value: "SA", label: "Silent Auction" }] },
  { key: "fiftyFifty", label: "50/50 Raffle", options: [{ value: "50", label: "50/50 Raffle" }] },
];

interface Props {
  defaultTags?: EventTags;
}

export default function TagSelector({ defaultTags = {} }: Props) {
  const [tags, setTags] = useState<EventTags>(defaultTags);

  function toggle(key: keyof EventTags, value: string) {
    setTags(prev => {
      const current = prev[key];
      return { ...prev, [key]: current === value ? undefined : value };
    });
  }

  return (
    <div>
      <input type="hidden" name="tags" value={JSON.stringify(tags)} />
      <div className="space-y-3">
        {TAG_GROUPS.map(group => (
          <div key={group.key}>
            <p className="text-xs font-medium text-gray-500 mb-1.5">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.options.map(opt => {
                const selected = tags[group.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(group.key, opt.value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      selected
                        ? "bg-[#0B1C3A] text-white border-[#0B1C3A]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-[#0B1C3A]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
