export const foundFields = {
  name: "Event name",
  date_time: "Start time (Central)",
  venue: "Venue",
  address: "Address",
  cost: "Cost",
  description: "Description",
  website: "Source or registration URL",
  sponsors: "Sponsors",
  contact_name: "Organizer contact",
  contact_email: "Public contact email",
  contact_phone: "Public contact phone",
  facebook_url: "Facebook event URL",
};

export type FoundField = keyof typeof foundFields;
export type FoundEvent = Record<FoundField, string>;

export function readFoundEvent(value: unknown): FoundEvent {
  const row = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return Object.fromEntries(Object.keys(foundFields).map(key => {
    const raw = row[key];
    let field = typeof raw === "string" ? raw.trim().slice(0, 4000) : "";
    if (field && (key === "website" || key === "facebook_url")) {
      try {
        const url = new URL(field);
        if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) field = "";
      } catch {
        field = "";
      }
    }
    return [key, field];
  })) as FoundEvent;
}

export function readSearchCandidate(value: unknown, today: string): FoundEvent | null {
  if (!value || typeof value !== "object") return null;
  const evidence = value as Record<string, unknown>;
  const event = readFoundEvent(value);
  const trivia = /\b(?:trivia|quiz night|quiz bowl)\b/i;
  if (!event.website || !trivia.test(event.name)
    || typeof evidence.fundraising_evidence !== "string"
    || !/\b(?:fundrais\w*|proceeds|benefit\w*|raises? (?:money|funds))\b/i.test(evidence.fundraising_evidence)) return null;

  // Extract the clock time only where the source labels it as the quiz start.
  const date = typeof evidence.event_date === "string" ? evidence.event_date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today
    || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) return null;
  const start = typeof evidence.trivia_start_evidence === "string" ? evidence.trivia_start_evidence : "";
  const match = start.match(/\b(?:trivia|quiz)(?:\s+night)?\s+(?:starts?|begins?|kicks off)\s*(?:at\s+|:\s*)?(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*([ap])\.?m\b/i);
  const hour = match ? Number(match[1]) % 12 + (match[3].toLowerCase() === "p" ? 12 : 0) : 0;
  event.date_time = match ? `${date}T${String(hour).padStart(2, "0")}:${match[2] ?? "00"}` : "";
  return event;
}
