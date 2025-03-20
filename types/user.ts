export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
  isVerified: boolean;
  verification_status: "not_submitted" | "pending" | "verified" | "rejected";
  verification_documents?: {
    id_front?: string;
    id_back?: string;
    selfie?: string;
    rejection_reason?: string;
    submitted_at?: any;
  };
  created_at?: any;
  updated_at?: any;
  verified_at?: any;
  role: "user" | "admin";
  preferences?: {
    notifications: {
      email: boolean;
      push: boolean;
      sms?: boolean;
    };
  };
}
