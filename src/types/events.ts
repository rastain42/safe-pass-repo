import { AgeRestriction, EventStatus } from './shared';
import { EventTicket } from './tickets';

export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  start_date: Date | any; // Firestore Timestamp
  end_date: Date | any; // Firestore Timestamp
  capacity: number;
  age_restriction: AgeRestriction;
  allowUnverifiedUsers: boolean;
  image?: string;
  tickets: EventTicket[];
  creatorId: string;
  created_at: Date | any; // Firestore Timestamp
  updated_at: Date | any; // Firestore Timestamp
  status?: EventStatus;
  sold_tickets?: number;
  revenue?: number;
}

export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  averageAttendance: number;
  topEvent?: {
    name: string;
    ticketsSold: number;
    revenue: number;
  };
}

export interface EventFormData {
  name: string;
  description: string;
  location: string;
  start_date: Date;
  end_date: Date;
  capacity: number;
  age_restriction: AgeRestriction;
  allowUnverifiedUsers: boolean;
  image?: string;
  tickets: EventTicket[];
}
