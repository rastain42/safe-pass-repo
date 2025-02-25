export type UserRole = 'participant' | 'organizer' | 'admin';
export type VerificationStatus = 'non_verified' | 'pending' | 'verified';

export interface User {
  id: string;
  phone: string;
  email: string;
  role: string;
  verifiedStatus: boolean;
  createdAt: String;
  updatedAt: String;
}