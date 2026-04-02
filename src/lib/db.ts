import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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

db.exec(`
  CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    website TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS change_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('update', 'delete')),
    changes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS pub_quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    quiz_company TEXT,
    host TEXT,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'recurring' CHECK(event_type IN ('recurring', 'one_off')),
    event_date TEXT,
    image TEXT,
    format TEXT CHECK(format IN ('pen_paper', 'mobile_app')),
    venue_website TEXT,
    website TEXT,
    submitter_name TEXT,
    submitter_email TEXT,
    manage_token TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    latitude REAL,
    longitude REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Initialize defaults
const captchaSetting = db.prepare(`SELECT value FROM settings WHERE key = 'captcha_enabled'`).get();
if (!captchaSetting) {
  db.prepare(`INSERT INTO settings (key, value) VALUES ('captcha_enabled', 'true')`).run();
}

// Add columns if missing (existing databases)
const columnsToAdd = ['image TEXT', 'latitude REAL', 'longitude REAL', 'manage_token TEXT', 'tags TEXT', 'venue_website TEXT', 'questions_by TEXT', 'emcee TEXT', 'theme TEXT'];
for (const col of columnsToAdd) {
  try { db.exec(`ALTER TABLE events ADD COLUMN ${col}`); } catch { /* already exists */ }
}

const pubQuizColumnsToAdd = [
  `event_type TEXT NOT NULL DEFAULT 'recurring'`,
  'event_date TEXT',
  'image TEXT',
  'venue_website TEXT',
  'website TEXT',
];
for (const col of pubQuizColumnsToAdd) {
  try { db.exec(`ALTER TABLE pub_quizzes ADD COLUMN ${col}`); } catch { /* already exists */ }
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
    `SELECT * FROM events WHERE status = 'approved' AND date_time >= datetime('now') ORDER BY date_time ASC`
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

export function insertEvent(data: EventFormData): { id: number; manage_token: string } {
  const manage_token = crypto.randomBytes(32).toString('hex');
  const result = db.prepare(`
    INSERT INTO events (name, date_time, venue, address, cost, description, sponsors, facebook_url, website, image, contact_name, contact_email, contact_phone, manage_token, tags, venue_website, questions_by, emcee, theme)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.name, data.date_time, data.venue, data.address, data.cost,
    data.description, data.sponsors || null, data.facebook_url || null,
    data.website || null, data.image || null,
    data.contact_name || '', data.contact_email || '', data.contact_phone || null,
    manage_token, data.tags || null, data.venue_website || null,
    data.questions_by || null, data.emcee || null, data.theme || null
  );
  // Auto-add venue to venues table if not already present
  if (data.venue && data.address) {
    upsertVenue(data.venue, data.address, data.venue_website || null);
  }
  return { id: Number(result.lastInsertRowid), manage_token };
}

export function insertEventAdmin(data: Partial<Event>): number {
  const result = db.prepare(`
    INSERT INTO events (name, date_time, venue, address, cost, description, sponsors, facebook_url, website, image, contact_name, contact_email, contact_phone, is_workshop, status, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.name, data.date_time, data.venue, data.address, data.cost,
    data.description, data.sponsors || null, data.facebook_url || null,
    data.website || null, data.image || null,
    data.contact_name || '', data.contact_email || '', data.contact_phone || null,
    data.is_workshop ?? 0, data.status ?? 'approved', data.tags || null
  );
  // Auto-add venue to venues table if not already present
  if (data.venue && data.address) {
    upsertVenue(data.venue, data.address, data.venue_website || null);
  }
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
    'is_workshop', 'contact_name', 'contact_email', 'contact_phone', 'status', 'tags', 'venue_website',
    'questions_by', 'emcee', 'theme'
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

export function getAllSubscribers(): Subscriber[] {
  return db.prepare(`SELECT * FROM subscribers ORDER BY created_at DESC`).all() as Subscriber[];
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

export interface ChangeRequest {
  id: number;
  event_id: number;
  type: 'update' | 'delete';
  changes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export function getEventByManageToken(token: string): Event | undefined {
  return db.prepare(`SELECT * FROM events WHERE manage_token = ?`).get(token) as Event | undefined;
}

export function insertChangeRequest(eventId: number, type: 'update' | 'delete', changes: object | null): number {
  const result = db.prepare(`
    INSERT INTO change_requests (event_id, type, changes) VALUES (?, ?, ?)
  `).run(eventId, type, changes ? JSON.stringify(changes) : null);
  return Number(result.lastInsertRowid);
}

export function getPendingChangeRequests(): (ChangeRequest & { event: Event })[] {
  const rows = db.prepare(`
    SELECT cr.*, e.name as event_name, e.date_time, e.venue, e.address, e.cost,
           e.description, e.sponsors, e.facebook_url, e.website, e.image,
           e.contact_name, e.contact_email, e.contact_phone, e.is_workshop, e.status as event_status
    FROM change_requests cr
    JOIN events e ON cr.event_id = e.id
    WHERE cr.status = 'pending'
    ORDER BY cr.created_at DESC
  `).all() as (ChangeRequest & Record<string, unknown>)[];
  return rows.map(r => ({
    id: r.id,
    event_id: r.event_id,
    type: r.type,
    changes: r.changes,
    status: r.status,
    created_at: r.created_at,
    event: {
      id: r.event_id,
      name: r.event_name as string,
      date_time: r.date_time as string,
      venue: r.venue as string,
      address: r.address as string,
      cost: r.cost as string,
      description: r.description as string,
      sponsors: r.sponsors as string | null,
      facebook_url: r.facebook_url as string | null,
      website: r.website as string | null,
      image: r.image as string | null,
      latitude: null,
      longitude: null,
      is_workshop: r.is_workshop as number,
      contact_name: r.contact_name as string | null,
      contact_email: r.contact_email as string | null,
      contact_phone: r.contact_phone as string | null,
      tags: r.tags as string | null,
      venue_website: r.venue_website as string | null,
      questions_by: r.questions_by as string | null,
      emcee: r.emcee as string | null,
      theme: r.theme as string | null,
      status: r.event_status as 'pending' | 'approved' | 'rejected',
      created_at: r.created_at,
    },
  }));
}

export function getChangeRequestById(id: number): ChangeRequest | undefined {
  return db.prepare(`SELECT * FROM change_requests WHERE id = ?`).get(id) as ChangeRequest | undefined;
}

export function updateChangeRequestStatus(id: number, status: 'approved' | 'rejected'): void {
  db.prepare(`UPDATE change_requests SET status = ? WHERE id = ?`).run(status, id);
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  website: string | null;
  created_at: string;
}

export function searchVenues(query: string): Venue[] {
  return db.prepare(
    `SELECT * FROM venues WHERE name LIKE ? ORDER BY name ASC LIMIT 10`
  ).all(`%${query}%`) as Venue[];
}

export function getAllVenues(): Venue[] {
  return db.prepare(`SELECT * FROM venues ORDER BY name ASC`).all() as Venue[];
}

export function upsertVenue(name: string, address: string, website?: string | null): void {
  db.prepare(`
    INSERT INTO venues (name, address, website)
    VALUES (?, ?, ?)
    ON CONFLICT(name) DO NOTHING
  `).run(name, address, website || null);
}

export function updateVenue(id: number, data: { name: string; address: string; website?: string | null }): void {
  db.prepare(`UPDATE venues SET name = ?, address = ?, website = ? WHERE id = ?`)
    .run(data.name, data.address, data.website || null, id);
}

export function deleteVenue(id: number): void {
  db.prepare(`DELETE FROM venues WHERE id = ?`).run(id);
}

export function getVenueById(id: number): Venue | undefined {
  return db.prepare(`SELECT * FROM venues WHERE id = ?`).get(id) as Venue | undefined;
}

export function getPendingChangeRequestCount(): number {
  return (db.prepare(`SELECT COUNT(*) as c FROM change_requests WHERE status = 'pending'`).get() as { c: number }).c;
}

export function getAllEventImageFilenames(): string[] {
  const rows = db.prepare(`SELECT image FROM events WHERE image IS NOT NULL`).all() as { image: string }[];
  return rows.map(r => r.image);
}

export function getEventsWithoutCoords(): Event[] {
  return db.prepare(
    `SELECT * FROM events WHERE status = 'approved' AND (latitude IS NULL OR longitude IS NULL) ORDER BY date_time ASC`
  ).all() as Event[];
}

// ── Pub Quizzes ──────────────────────────────────────────────────────────────

import { PubQuiz } from './types';

export function insertPubQuiz(data: Omit<PubQuiz, 'id' | 'status' | 'latitude' | 'longitude' | 'created_at' | 'manage_token'>): { id: number; manage_token: string } {
  const manage_token = crypto.randomBytes(32).toString('hex');
  const result = db.prepare(`
    INSERT INTO pub_quizzes (venue, address, city, day_of_week, start_time, event_type, event_date, image, quiz_company, host, description, format, venue_website, website, submitter_name, submitter_email, manage_token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.venue, data.address, data.city, data.day_of_week || null, data.start_time,
    data.event_type || 'recurring', data.event_date || null, data.image || null,
    data.quiz_company || null, data.host || null, data.description || null,
    data.format || null, data.venue_website || null, data.website || null,
    data.submitter_name || null, data.submitter_email || null, manage_token
  );
  return { id: Number(result.lastInsertRowid), manage_token };
}

export function getApprovedPubQuizzes(): PubQuiz[] {
  return db.prepare(`
    SELECT * FROM pub_quizzes
    WHERE status = 'approved'
      AND (event_type = 'recurring' OR (event_type = 'one_off' AND event_date >= date('now')))
    ORDER BY event_type DESC, event_date ASC, day_of_week, start_time
  `).all() as PubQuiz[];
}

export function getPendingPubQuizzes(): PubQuiz[] {
  return db.prepare(`SELECT * FROM pub_quizzes WHERE status = 'pending' ORDER BY created_at DESC`).all() as PubQuiz[];
}

export function getAllPubQuizzes(): PubQuiz[] {
  return db.prepare(`SELECT * FROM pub_quizzes ORDER BY created_at DESC`).all() as PubQuiz[];
}

export function getPubQuizById(id: number): PubQuiz | undefined {
  return db.prepare(`SELECT * FROM pub_quizzes WHERE id = ?`).get(id) as PubQuiz | undefined;
}

export function getPubQuizByManageToken(token: string): PubQuiz | undefined {
  return db.prepare(`SELECT * FROM pub_quizzes WHERE manage_token = ?`).get(token) as PubQuiz | undefined;
}

export function updatePubQuiz(id: number, data: Partial<PubQuiz>): void {
  const allowed = ['venue', 'address', 'city', 'day_of_week', 'start_time', 'event_type', 'event_date', 'image', 'quiz_company', 'host', 'description', 'format', 'venue_website', 'website', 'status', 'latitude', 'longitude'] as const;
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key] ?? null);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE pub_quizzes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deletePubQuiz(id: number): void {
  db.prepare(`DELETE FROM pub_quizzes WHERE id = ?`).run(id);
}

export function getPubQuizzesWithoutCoords(): PubQuiz[] {
  return db.prepare(`SELECT * FROM pub_quizzes WHERE status = 'approved' AND (latitude IS NULL OR longitude IS NULL)`).all() as PubQuiz[];
}

export function getPendingPubQuizCount(): number {
  return (db.prepare(`SELECT COUNT(*) as c FROM pub_quizzes WHERE status = 'pending'`).get() as { c: number }).c;
}

export function getTotalStats(): { total: number; approved: number; pending: number; totalViews: number } {
  const total = (db.prepare(`SELECT COUNT(*) as c FROM events`).get() as { c: number }).c;
  const approved = (db.prepare(`SELECT COUNT(*) as c FROM events WHERE status = 'approved'`).get() as { c: number }).c;
  const pending = (db.prepare(`SELECT COUNT(*) as c FROM events WHERE status = 'pending'`).get() as { c: number }).c;
  const totalViews = (db.prepare(`SELECT COUNT(*) as c FROM page_views`).get() as { c: number }).c;
  return { total, approved, pending, totalViews };
}
