export interface EventTags {
  age?: 'AA' | '18' | '21';
  bar?: 'CB' | 'OB' | 'NA';
  mulligans?: 'M' | 'NM';
  auction?: 'LA' | 'SA';
  fiftyFifty?: '50';
}

export interface Event {
  id: number;
  name: string;
  date_time: string;
  venue: string;
  address: string;
  cost: string;
  description: string;
  sponsors: string | null;
  facebook_url: string | null;
  website: string | null;
  image: string | null;
  latitude: number | null;
  longitude: number | null;
  is_workshop: number; // 0 or 1 (SQLite boolean)
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tags: string | null; // JSON-encoded EventTags
  venue_website: string | null;
  questions_by: string | null;
  emcee: string | null;
  theme: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export type EventFormData = Omit<Event, 'id' | 'status' | 'created_at' | 'is_workshop' | 'latitude' | 'longitude'>;

export interface PubQuiz {
  id: number;
  venue: string;
  address: string;
  city: string;
  day_of_week: string; // 'Monday' | 'Tuesday' | ...
  start_time: string;  // e.g. '7:00 PM'
  quiz_company: string | null;
  host: string | null;
  description: string | null;
  format: 'pen_paper' | 'mobile_app' | null;
  venue_website: string | null;
  website: string | null;
  submitter_name: string | null;
  submitter_email: string | null;
  manage_token: string | null;
  status: 'pending' | 'approved' | 'rejected';
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}
