import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Event, EventFormData } from './types';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'trivia.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date_time TEXT NOT NULL,
    venue TEXT NOT NULL,
    address TEXT NOT NULL,
    cost TEXT NOT NULL,
    description TEXT NOT NULL,
    sponsors TEXT,
    facebook_url TEXT,
    website TEXT,
    image TEXT,
    latitude REAL,
    longitude REAL,
    is_workshop INTEGER NOT NULL DEFAULT 0,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Settings table for admin toggles
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

// Initialize captcha setting if not present
const captchaSetting = db.prepare(`SELECT value FROM settings WHERE key = 'captcha_enabled'`).get();
if (!captchaSetting) {
  db.prepare(`INSERT INTO settings (key, value) VALUES ('captcha_enabled', 'true')`).run();
}

export function getSetting(key: string): string | null {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run(key, value);
}

export function isCaptchaEnabled(): boolean {
  return getSetting('captcha_enabled') !== 'false';
}

// Add columns if missing (existing databases)
const columnsToAdd = [
  'image TEXT',
  'latitude REAL',
  'longitude REAL',
];
for (const col of columnsToAdd) {
  try {
    db.exec(`ALTER TABLE events ADD COLUMN ${col}`);
  } catch {
    // Column already exists
  }
}

export function getApprovedEvents(): Event[] {
  return db.prepare(
    `SELECT * FROM events WHERE status = 'approved' AND date_time >= datetime('now') ORDER BY is_workshop DESC, date_time ASC`
  ).all() as Event[];
}

export function getEventById(id: number): Event | undefined {
  return db.prepare(
    `SELECT * FROM events WHERE id = ? AND status = 'approved'`
  ).get(id) as Event | undefined;
}

export function getEventByIdAdmin(id: number): Event | undefined {
  return db.prepare(
    `SELECT * FROM events WHERE id = ?`
  ).get(id) as Event | undefined;
}

export function getPendingEvents(): Event[] {
  return db.prepare(
    `SELECT * FROM events WHERE status = 'pending' ORDER BY created_at DESC`
  ).all() as Event[];
}

export function getAllEvents(): Event[] {
  return db.prepare(
    `SELECT * FROM events ORDER BY created_at DESC`
  ).all() as Event[];
}

export function insertEvent(data: EventFormData): number {
  const result = db.prepare(`
    INSERT INTO events (name, date_time, venue, address, cost, description, sponsors, facebook_url, website, image, contact_name, contact_email, contact_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.name, data.date_time, data.venue, data.address, data.cost,
    data.description, data.sponsors || null, data.facebook_url || null,
    data.website || null, data.image || null, data.contact_name || '',
    data.contact_email || '', data.contact_phone || null
  );
  return Number(result.lastInsertRowid);
}

export function updateEvent(id: number, data: Partial<Event>): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  const allowed = [
    'name', 'date_time', 'venue', 'address', 'cost', 'description',
    'sponsors', 'facebook_url', 'website', 'image', 'latitude', 'longitude',
    'is_workshop', 'contact_name', 'contact_email', 'contact_phone', 'status'
  ] as const;

  const notNullFields = new Set(['contact_name', 'contact_email']);

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = ?`);
      const val = data[key as keyof Event] ?? null;
      values.push(notNullFields.has(key) ? (val || '') : val);
    }
  }

  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function getMapEvents(): Event[] {
  return db.prepare(
    `SELECT * FROM events WHERE status = 'approved' AND date_time >= datetime('now') AND latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY date_time ASC`
  ).all() as Event[];
}

export function updateEventStatus(id: number, status: 'approved' | 'rejected'): void {
  db.prepare(`UPDATE events SET status = ? WHERE id = ?`).run(status, id);
}
