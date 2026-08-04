import { cacheCoords, lookupKnownCoords } from './db';

export interface Coords {
  lat: number;
  lng: number;
}

// Nominatim's usage policy allows at most one request per second from an
// application, and blocks clients that ignore it. Bulk-approving a queue of
// events would otherwise fire a burst of lookups back to back.
const MIN_REQUEST_INTERVAL_MS = 1100;

let chain: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Serializes callers into a single queue, spaced by MIN_REQUEST_INTERVAL_MS. */
function schedule<T>(task: () => Promise<T>): Promise<T> {
  const result = chain.then(async () => {
    const waitFor = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (waitFor > 0) await sleep(waitFor);
    lastRequestAt = Date.now();
    return task();
  });
  // Keep the queue alive even if one lookup rejects.
  chain = result.catch(() => undefined);
  return result;
}

async function fetchFromNominatim(address: string): Promise<Coords | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'IllinoisTrivia.com/1.0 (+https://illinoistrivia.com)',
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return { lat, lng };
}

export async function geocodeAddress(address: string): Promise<Coords | null> {
  if (!address?.trim()) return null;

  // Most fundraisers reuse the same venues, so this usually answers locally.
  const known = lookupKnownCoords(address);
  if (known) return known;

  try {
    const coords = await schedule(() => fetchFromNominatim(address));
    if (coords) cacheCoords(address, coords.lat, coords.lng);
    return coords;
  } catch (err) {
    console.error('Geocoding failed:', err);
    return null;
  }
}
