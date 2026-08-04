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

/** Pulls the city out of "123 Main St, Chicago, IL 60601". */
export function extractCity(address: string): string {
  const parts = address.split(',');
  return parts.length >= 2 ? parts[parts.length - 2].trim() : address.trim();
}

/** Region a given event address belongs to. */
export function regionForAddress(address: string): Region {
  return regionForCity(extractCity(address));
}

export function isValidRegion(value: unknown): value is Region {
  return typeof value === 'string' && (IL_REGIONS as readonly string[]).includes(value);
}
