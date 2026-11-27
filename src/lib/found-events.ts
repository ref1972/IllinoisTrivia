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
