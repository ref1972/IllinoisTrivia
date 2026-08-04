import { Event } from './types';

// Events are stored as local wall-clock strings with no offset ("2026-04-09T18:00"),
// which is Central time in practice. Emitting them with an explicit TZID plus a
// VTIMEZONE block keeps them correct across DST instead of guessing an offset.
const TIMEZONE = 'America/Chicago';

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TIMEZONE}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0600',
  'TZOFFSETTO:-0500',
  'TZNAME:CDT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0600',
  'TZNAME:CST',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

const DEFAULT_DURATION_HOURS = 2;

/** RFC 5545 escaping: backslash, semicolon, comma, and newlines. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** "2026-04-09T18:00" or "2026-04-09 18:00:00" -> "20260409T180000" */
function toLocalStamp(dateTime: string): string | null {
  const match = dateTime.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const [, y, m, d, hh, mm, ss] = match;
  return `${y}${m}${d}T${hh}${mm}${ss ?? '00'}`;
}

function addHours(stamp: string, hours: number): string {
  const y = +stamp.slice(0, 4);
  const mo = +stamp.slice(4, 6) - 1;
  const d = +stamp.slice(6, 8);
  const hh = +stamp.slice(9, 11);
  const mm = +stamp.slice(11, 13);
  const ss = +stamp.slice(13, 15);
  const dt = new Date(Date.UTC(y, mo, d, hh + hours, mm, ss));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}${p(dt.getUTCMonth() + 1)}${p(dt.getUTCDate())}T${p(dt.getUTCHours())}${p(dt.getUTCMinutes())}${p(dt.getUTCSeconds())}`;
}

/** Folds lines to 75 octets as RFC 5545 requires, continuing with a leading space. */
function fold(line: string): string {
  if (Buffer.byteLength(line, 'utf8') <= 75) return line;

  const out: string[] = [];
  let current = '';
  for (const char of line) {
    const limit = out.length === 0 ? 75 : 74;
    if (Buffer.byteLength(current + char, 'utf8') > limit) {
      out.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  if (current) out.push(current);
  return out.join('\r\n ');
}

export function eventToIcs(event: Event, siteUrl: string): string | null {
  const start = toLocalStamp(event.date_time);
  if (!start) return null;

  const end = addHours(start, DEFAULT_DURATION_HOURS);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const descriptionParts = [stripHtml(event.description || '')];
  if (event.cost) descriptionParts.push(`Cost: ${event.cost}`);
  descriptionParts.push(`${siteUrl}/events/${event.id}`);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IllinoisTrivia.com//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...VTIMEZONE,
    'BEGIN:VEVENT',
    `UID:event-${event.id}@illinoistrivia.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${TIMEZONE}:${start}`,
    `DTEND;TZID=${TIMEZONE}:${end}`,
    `SUMMARY:${escapeText(event.name)}`,
    `DESCRIPTION:${escapeText(descriptionParts.filter(Boolean).join('\n\n'))}`,
    `LOCATION:${escapeText([event.venue, event.address].filter(Boolean).join(', '))}`,
    `URL:${siteUrl}/events/${event.id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.map(fold).join('\r\n') + '\r\n';
}
