import { TicketStatus, PaymentStatus } from './shared';

export interface EventTicket {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sold?: number;
  status: TicketStatus;
  early_bird?: {
    price: number;
    end_date: Date;
  };
  restrictions?: {
    min_age?: number;
    max_per_person?: number;
  };
}

export interface PurchasedTicket {
  id: string;
  eventId: string;
  eventName: string;
  ticketTypeId: string;
  ticketTypeName: string;
  userId: string;
  quantity: number;
  totalPrice: number;
  qrCode: string;
  purchaseDate: Date | any; // Firestore Timestamp
  status: 'valid' | 'used' | 'cancelled' | 'refunded';
  paymentStatus: PaymentStatus;
  metadata?: {
    seat?: string;
    section?: string;
    row?: string;
  };
}

export interface UserTicket {
  id: string;
  eventId: string;
  eventName: string;
  ticketTypeId: string;
  ticketTypeName: string;
  userId: string;
  quantity: number;
  price: number;
  totalPrice: number;
  qrCode: string;
  purchaseDate: Date | any; // Firestore Timestamp
  status: 'valid' | 'used' | 'cancelled' | 'refunded';
  paymentStatus: PaymentStatus;
  metadata?: {
    seat?: string;
    section?: string;
    row?: string;
  };
}

export interface TicketValidation {
  ticketId: string;
  eventId: string;
  userId: string;
  validatedAt: Date | any; // Firestore Timestamp
  validatedBy: string; // ID de l'organisateur qui a validé
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface TicketSales {
  eventId: string;
  ticketTypeId: string;
  totalSold: number;
  totalRevenue: number;
  salesByDate: {
    date: string;
    sold: number;
    revenue: number;
  }[];
}
