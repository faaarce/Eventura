export interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  price: number;
  currency: string;
  category: EventCategory;
  imageUrl?: string;
  attendees: number;
}

export type EventCategory =
  | "conference"
  | "workshop"
  | "meetup"
  | "concert"
  | "sports"
  | "party";
