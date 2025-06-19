export enum AgeRestriction {
  None = 'none',
  Eighteen = '18',
  TwentyOne = '21',
}

export enum UserRole {
  User = 'user',
  Organizer = 'organizer',
  Admin = 'admin',
}

export enum VerificationStatus {
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
}

export enum EventStatus {
  Draft = 'draft',
  Published = 'published',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

export enum TicketStatus {
  Available = 'available',
  SoldOut = 'sold_out',
  Suspended = 'suspended',
}

export enum PaymentStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Refunded = 'refunded',
}
