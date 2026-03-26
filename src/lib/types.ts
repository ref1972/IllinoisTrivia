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
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export type EventFormData = Omit<Event, 'id' | 'status' | 'created_at' | 'is_workshop' | 'latitude' | 'longitude'>;
