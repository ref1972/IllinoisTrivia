// Subscribers pick a region; events only know the city parsed out of their
// address. Without this mapping the two never meet: a subscriber who chose
// "Champaign-Urbana" would be compared against the literal city "Urbana" and
// never match, so they'd silently receive nothing.

export const IL_REGIONS = [
  'All Illinois',
  'Chicago',
  'Chicago Suburbs (North)',
  'Chicago Suburbs (South)',
  'Chicago Suburbs (West)',
  'Rockford',
  'Peoria',
  'Springfield',
  'Champaign-Urbana',
  'Bloomington-Normal',
  'Decatur',
  'Quad Cities',
  'Joliet',
  'Aurora',
  'Other',
] as const;

export type Region = (typeof IL_REGIONS)[number];

export const OTHER_REGION: Region = 'Other';
export const ALL_REGIONS: Region = 'All Illinois';

// Cities are grouped by the region a subscriber would expect to find them under.
// Anything unlisted falls through to "Other", which is how downstate towns reach
// the subscribers who asked for everything else.
const CITY_TO_REGION: Record<string, Region> = {};

function register(region: Region, cities: string[]) {
  for (const city of cities) CITY_TO_REGION[city.toLowerCase()] = region;
}

register('Chicago', ['Chicago']);

register('Chicago Suburbs (North)', [
  'Evanston', 'Skokie', 'Wilmette', 'Winnetka', 'Glenview', 'Northbrook', 'Des Plaines',
  'Park Ridge', 'Arlington Heights', 'Palatine', 'Schaumburg', 'Buffalo Grove', 'Deerfield',
  'Highland Park', 'Lake Forest', 'Waukegan', 'Gurnee', 'Libertyville', 'Mundelein',
  'Vernon Hills', 'Barrington', 'Mount Prospect', 'Wheeling', 'Niles', 'Morton Grove',
  'Lincolnshire', 'Grayslake', 'Antioch', 'Zion', 'North Chicago',
]);

register('Chicago Suburbs (South)', [
  'Oak Lawn', 'Orland Park', 'Tinley Park', 'Palos Heights', 'Homewood', 'Flossmoor',
  'Country Club Hills', 'Matteson', 'Frankfort', 'Mokena', 'New Lenox', 'Chicago Heights',
  'Blue Island', 'Alsip', 'Oak Forest', 'Crestwood', 'Lansing', 'Calumet City', 'Dolton',
  'Harvey', 'Midlothian', 'Evergreen Park', 'Burbank', 'Bridgeview', 'Lemont',
]);

register('Chicago Suburbs (West)', [
  'Oak Park', 'Berwyn', 'Cicero', 'Elmhurst', 'Lombard', 'Glen Ellyn', 'Wheaton',
  'Naperville', 'Downers Grove', 'Westmont', 'Hinsdale', 'Villa Park', 'Addison',
  'Bloomingdale', 'Carol Stream', 'Bartlett', 'Streamwood', 'Hanover Park', 'Elgin',
  'St. Charles', 'Saint Charles', 'Geneva', 'Batavia', 'West Chicago', 'Wood Dale',
  'Itasca', 'Roselle', 'Lisle', 'Woodridge', 'La Grange', 'Westchester', 'Maywood',
]);

register('Rockford', ['Rockford', 'Loves Park', 'Machesney Park', 'Belvidere', 'Roscoe', 'Rockton']);

register('Peoria', [
  'Peoria', 'East Peoria', 'Peoria Heights', 'Pekin', 'Morton', 'Washington',
  'Chillicothe', 'Bartonville', 'Dunlap', 'Germantown Hills',
]);

register('Springfield', ['Springfield', 'Chatham', 'Sherman', 'Rochester', 'Riverton', 'Auburn']);

register('Champaign-Urbana', ['Champaign', 'Urbana', 'Savoy', 'Mahomet', 'Rantoul', 'St. Joseph']);

register('Bloomington-Normal', ['Bloomington', 'Normal']);

register('Decatur', ['Decatur', 'Forsyth', 'Mount Zion', 'Argenta']);

register('Quad Cities', ['Moline', 'East Moline', 'Rock Island', 'Silvis', 'Milan', 'Coal Valley']);

register('Joliet', ['Joliet', 'Shorewood', 'Crest Hill', 'Plainfield', 'Lockport', 'Channahon']);

register('Aurora', ['Aurora', 'North Aurora', 'Montgomery', 'Oswego', 'Sugar Grove', 'Yorkville']);

/** Maps a city name to the subscriber-facing region it belongs to. */
export function regionForCity(city: string): Region {
  return CITY_TO_REGION[city.trim().toLowerCase()] ?? OTHER_REGION;
}

const STATE_TOKENS = new Set(['il', 'il.', 'ill', 'ill.', 'illinois']);
const COUNTRY_TOKENS = new Set(['usa', 'us', 'u.s.', 'u.s.a.', 'united states', 'united states of america']);
const ZIP = /\b\d{5}(?:-\d{4})?\b/g;

/**
 * Pulls the city out of an address.
 *
 * Submitted addresses are not uniform — some end with ", United States", some
 * spell out "Illinois", some carry a ZIP in its own segment, and some have no
 * commas at all. Taking the second-to-last comma segment produced "IL 62704",
 * "62085" and whole street addresses as city names, which then became public
 * URLs. This walks in from the end discarding country, state and ZIP fragments,
 * and returns "" rather than guessing when nothing city-like remains.
 */
export function extractCity(address: string): string {
  if (!address) return '';

  const parts = address.split(',').map(part => part.trim()).filter(Boolean);
  // A single segment gives no way to tell a street from a city.
  if (parts.length < 2) return '';

  for (let i = parts.length - 1; i >= 0; i--) {
    const candidate = parts[i].replace(ZIP, '').replace(/[.\s]+$/, '').trim();
    if (!candidate) continue;

    const lower = candidate.toLowerCase();
    if (STATE_TOKENS.has(lower) || COUNTRY_TOKENS.has(lower)) continue;
    if (/\bcounty\b/i.test(candidate)) continue;
    if (!/[a-z]/i.test(candidate)) continue;

    // "2142 Old State Road Jacksonville" — street and city run together with no
    // comma. Everything after the last street-type word is the city.
    if (/^\d/.test(candidate)) {
      const salvaged = cityAfterStreet(candidate);
      if (salvaged) return salvaged;
      continue;
    }

    // "North Lakewood Drive" is a street, not a city.
    if (endsWithStreetWord(candidate)) continue;

    return candidate;
  }

  return '';
}

// Deliberately excludes words that are also common in city names — Park,
// Grove, Heights, Hills — so "Downers Grove" and "Highland Park" survive.
const STREET_WORDS = new Set([
  'st', 'street', 'rd', 'road', 'ave', 'avenue', 'dr', 'drive', 'ln', 'lane',
  'blvd', 'boulevard', 'ct', 'court', 'pkwy', 'parkway', 'hwy', 'highway',
  'pl', 'place', 'ter', 'terrace', 'cir', 'circle', 'trl', 'trail', 'way',
]);

function isStreetWord(word: string): boolean {
  return STREET_WORDS.has(word.toLowerCase().replace(/[.,]/g, ''));
}

function endsWithStreetWord(value: string): boolean {
  const words = value.split(/\s+/);
  return words.length > 0 && isStreetWord(words[words.length - 1]);
}

function cityAfterStreet(value: string): string {
  const words = value.split(/\s+/);
  let lastStreetWord = -1;
  for (let i = 0; i < words.length; i++) {
    if (isStreetWord(words[i])) lastStreetWord = i;
  }
  if (lastStreetWord === -1) return '';
  return words.slice(lastStreetWord + 1).join(' ').trim();
}

/** Region a given event address belongs to. */
export function regionForAddress(address: string): Region {
  return regionForCity(extractCity(address));
}

export function isValidRegion(value: unknown): value is Region {
  return typeof value === 'string' && (IL_REGIONS as readonly string[]).includes(value);
}
