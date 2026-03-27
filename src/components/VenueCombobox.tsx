"use client";

import { useState, useEffect, useRef } from "react";

interface Venue {
  id: number;
  name: string;
  address: string;
  website: string | null;
}

interface Props {
  defaultName?: string;
  defaultAddress?: string;
  onSelect?: (venue: Venue) => void;
}

export default function VenueCombobox({ defaultName = "", defaultAddress = "", onSelect }: Props) {
  const [name, setName] = useState(defaultName);
  const [address, setAddress] = useState(defaultAddress);
  const [results, setResults] = useState<Venue[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (name.trim().length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/venues?q=${encodeURIComponent(name)}`);
      const data = await res.json() as Venue[];
      setResults(data);
      setOpen(data.length > 0);
    }, 200);
    return () => clearTimeout(timeout);
  }, [name]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(venue: Venue) {
    setName(venue.name);
    setAddress(venue.address);
    setOpen(false);
    onSelect?.(venue);
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Venue Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="venue"
          value={name}
          onChange={e => { setName(e.target.value); setOpen(true); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          required
          placeholder="Start typing to search existing venues..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C83803]"
        />
        {open && results.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-56 overflow-y-auto">
            {results.map(v => (
              <li
                key={v.id}
                onMouseDown={() => select(v)}
                className="px-4 py-2.5 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <p className="text-sm font-medium text-gray-800">{v.name}</p>
                <p className="text-xs text-gray-500">{v.address}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          required
          placeholder="Full address including city and state"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C83803]"
        />
      </div>
    </div>
  );
}
