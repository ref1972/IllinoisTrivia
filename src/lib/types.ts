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
  is_workshop: number; // 0 or 1 (SQLite boolean)
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export type EventFormData = Omit<Event, 'id' | 'status' | 'created_at' | 'is_workshop'>;
