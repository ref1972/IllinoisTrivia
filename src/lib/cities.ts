import { Event, PubQuiz } from './types';
import { extractCity } from './regions';
import { getApprovedEvents, getApprovedPubQuizzes, getPastEvents } from './db';

export interface CitySummary {
  city: string;
  slug: string;
  upcoming: number;
  past: number;
  quizzes: number;
}

export interface CityPageData {
  city: string;
  slug: string;
  upcoming: Event[];
  past: Event[];
  quizzes: PubQuiz[];
}

/** "Chicago Heights" -> "chicago-heights". Stable enough to use in URLs. */
export function citySlug(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function cityOf(event: Event): string {
  return extractCity(event.address);
}

/**
 * Every city with at least one approved event or pub quiz, with counts.
 * Cities come from the data rather than a fixed list so a new town appears the
 * moment its first event is approved.
 */
export function getCityIndex(): CitySummary[] {
  const byCity = new Map<string, CitySummary>();

  const bump = (rawCity: string, key: 'upcoming' | 'past' | 'quizzes') => {
    const city = rawCity.trim();
    if (!city) return;
    const slug = citySlug(city);
    if (!slug) return;

    const existing = byCity.get(slug) ?? { city, slug, upcoming: 0, past: 0, quizzes: 0 };
    existing[key] += 1;
    byCity.set(slug, existing);
  };

  for (const event of getApprovedEvents()) bump(cityOf(event), 'upcoming');
  for (const event of getPastEvents()) bump(cityOf(event), 'past');
  for (const quiz of getApprovedPubQuizzes()) bump(quiz.city, 'quizzes');

  return Array.from(byCity.values()).sort(
    (a, b) =>
      b.upcoming + b.quizzes - (a.upcoming + a.quizzes) || a.city.localeCompare(b.city),
  );
}

/** Everything shown on a city page, or null when the slug matches nothing. */
export function getCityPageData(slug: string): CityPageData | null {
  const normalized = citySlug(slug);
  if (!normalized) return null;

  const upcoming = getApprovedEvents().filter(e => citySlug(cityOf(e)) === normalized);
  const past = getPastEvents().filter(e => citySlug(cityOf(e)) === normalized);
  const quizzes = getApprovedPubQuizzes().filter(q => citySlug(q.city) === normalized);

  if (upcoming.length === 0 && past.length === 0 && quizzes.length === 0) return null;

  // Prefer a display name from live content over the slug itself.
  const city =
    (upcoming[0] && cityOf(upcoming[0])) ||
    (quizzes[0] && quizzes[0].city.trim()) ||
    (past[0] && cityOf(past[0])) ||
    normalized;

  return { city, slug: normalized, upcoming, past, quizzes };
}
