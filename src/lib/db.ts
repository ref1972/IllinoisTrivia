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

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL DEFAULT 'All Illinois',
    unsubscribe_token TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id)
  )
`);

// Initialize defaults
const captchaSetting = db.prepare(`SELECT value FROM settings WHERE key = 'captcha_enabled'`).get();
if (!captchaSetting) {
  db.prepare(`INSERT INTO settings (key, value) VALUES ('captcha_enabled', 'true')`).run();
}

// Add columns if missing (existing databases)
const columnsToAdd = ['image TEXT', 'latitude REAL', 'longitude REAL'];
for (const col of columnsToAdd) {
  try { db.exec(`ALTER TABLE events ADD COLUMN ${col}`); } catch { /* already exists */ }
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

export function getApprovedEvents(): Event[] {
  return db.prepare(
    `SELECT * FROM events WHERE status = 'approved' AND date_time >= datetime('now') ORDER BY is_workshop DESC, date_time ASC`
  ).all() as Event[];
}

export function getPastEvents(): Event[] {
  return db.prepare(
    `SELECT * FROM events WHERE status = 'approved' AND date_time < datetime('now') ORDER BY date_time DESC`
  ).all() as Event[];
}

export function getEventById(id: number): Event | undefined {
  return db.prepare(
    `SELECT * FROM events WHERE id = ? AND status = 'approved'`
  ).get(id) as Event | undefined;
}

export function getEventByIdAdmin(id: number): Event | undefined {
  return db.prepare(`SELECT * FROM events WHERE id = ?`).get(id) as Event | undefined;
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
    data.website || null, data.image || null,
    data.contact_name || '', data.contact_email || '', data.contact_phone || null
  );
  return Number(result.lastInsertRowid);
}

export function insertEventAdmin(data: Partial<Event>): number {
  const result = db.prepare(`
    INSERT INTO events (name, date_time, venue, address, cost, description, sponsors, facebook_url, website, image, contact_name, contact_email, contact_phone, is_workshop, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.name, data.date_time, data.venue, data.address, data.cost,
    data.description, data.sponsors || null, data.facebook_url || null,
    data.website || null, data.image || null,
    data.contact_name || '', data.contact_email || '', data.contact_phone || null,
    data.is_workshop ?? 0, data.status ?? 'approved'
  );
  return Number(result.lastInsertRowid);
}

export function duplicateEvent(id: number): number {
  const event = getEventByIdAdmin(id);
  if (!event) throw new Error('Event not found');
  const result = db.prepare(`
    INSERT INTO events (name, date_time, venue, address, cost, description, sponsors, facebook_url, website, contact_name, contact_email, contact_phone, is_workshop, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    event.name, event.date_time, event.venue, event.address, event.cost,
    event.description, event.sponsors, event.facebook_url, event.website,
    event.contact_name, event.contact_email, event.contact_phone, event.is_workshop
  );
  return Number(result.lastInsertRowid);
}

export function deleteEvent(id: number): void {
  db.prepare(`DELETE FROM page_views WHERE event_id = ?`).run(id);
  db.prepare(`DELETE FROM events WHERE id = ?`).run(id);
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

export function updateEventStatus(id: number, status: 'approved' | 'rejected'): void {
  db.prepare(`UPDATE events SET status = ? WHERE id = ?`).run(status, id);
}

export function getMapEvents(): Event[] {
  return db.prepare(
    `SELECT * FROM events WHERE status = 'approved' AND date_time >= datetime('now') AND latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY date_time ASC`
  ).all() as Event[];
}

export interface Subscriber {
  id: number;
  email: string;
  region: string;
  unsubscribe_token: string;
  created_at: string;
}

export function addSubscriber(email: string, region: string, token: string): void {
  db.prepare(`INSERT OR IGNORE INTO subscribers (email, region, unsubscribe_token) VALUES (?, ?, ?)`)
    .run(email, region, token);
}

export function getSubscriberByToken(token: string): Subscriber | undefined {
  return db.prepare(`SELECT * FROM subscribers WHERE unsubscribe_token = ?`).get(token) as Subscriber | undefined;
}

export function removeSubscriber(token: string): void {
  db.prepare(`DELETE FROM subscribers WHERE unsubscribe_token = ?`).run(token);
}

export function getSubscribersForRegion(region: string): Subscriber[] {
  return db.prepare(
    `SELECT * FROM subscribers WHERE region = 'All Illinois' OR region = ?`
  ).all(region) as Subscriber[];
}

export function recordPageView(eventId: number): void {
  db.prepare(`INSERT INTO page_views (event_id) VALUES (?)`).run(eventId);
}

export function getEventViewCounts(): Record<number, number> {
  const rows = db.prepare(
    `SELECT event_id, COUNT(*) as count FROM page_views GROUP BY event_id`
  ).all() as { event_id: number; count: number }[];
  return Object.fromEntries(rows.map(r => [r.event_id, r.count]));
}

export function getTopEvents(limit = 10): { event: Event; views: number }[] {
  const rows = db.prepare(`
    SELECT e.*, COUNT(pv.id) as view_count
    FROM events e
    LEFT JOIN page_views pv ON e.id = pv.event_id
    WHERE e.status = 'approved'
    GROUP BY e.id
    ORDER BY view_count DESC
    LIMIT ?
  `).all(limit) as (Event & { view_count: number })[];
  return rows.map(r => ({ event: r, views: r.view_count }));
}

export function getTotalStats(): { total: number; approved: number; pending: number; totalViews: number } {
  const total = (db.prepare(`SELECT COUNT(*) as c FROM events`).get() as { c: number }).c;
  const approved = (db.prepare(`SELECT COUNT(*) as c FROM events WHERE status = 'approved'`).get() as { c: number }).c;
  const pending = (db.prepare(`SELECT COUNT(*) as c FROM events WHERE status = 'pending'`).get() as { c: number }).c;
  const totalViews = (db.prepare(`SELECT COUNT(*) as c FROM page_views`).get() as { c: number }).c;
  return { total, approved, pending, totalViews };
}
