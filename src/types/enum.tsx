export enum UserRole {
  Participant = 'participant',
  Organizer = 'organisateur',
  Admin = 'administrateur',
}

export enum VerificationStatus {
  NonVerified = 'non vérifié',
  Pending = 'en cours de vérification',
  Verified = 'verifié',
}

export enum AgeRestriction {
  None = 'aucune',
  Eighteen = '18+',
}

export enum TicketStatus {
  Valid = 'valid',
  Used = 'used',
  Refunded = 'refunded',
}
