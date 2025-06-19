import { AgeRestriction } from "./enum";
import { EventTicket } from "./tickets";

// Type pour un événement
export interface Event {
  organizerId: number;
  id: string;
  name: string;
  description: string;
  location: string;
  start_date: Date;
  end_date: Date;
  capacity: number;
  age_restriction: AgeRestriction;
  allowUnverifiedUsers?: boolean;
  image?: string;
  tickets: EventTicket[];
}
