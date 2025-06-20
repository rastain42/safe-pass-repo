// Types pour les données d'identité
export interface IdentityData {
  firstName: string;
  lastName: string;
  birthDate: string; // Format: DD/MM/YYYY ou DD.MM.YYYY (CITY)
}

// Types pour la vérification d'identité
export interface VerificationDocuments {
  id_front?: string;
  selfie?: string;
  submitted_at?: any;
}

export interface BiometricResult {
  match: boolean;
  confidence: number;
  similarityScore: number;
  success: boolean;
  details: {
    faceDetectedInDocument: boolean;
    faceDetectedInSelfie: boolean;
    matchDecision: string;
    qualityScore: number;
    thresholds: {
      high: number;
      low: number;
    };
  };
}

export interface AnalysisResult {
  success: boolean;
  confidence: number;
  auto_approved: boolean;
  data: {
    firstName: {
      value: string;
      confidence: number;
    };
    lastName: {
      value: string;
      confidence: number;
    };
    birthDate: {
      value: string;
      confidence: number;
    };
    code: {
      value: string;
      confidence: number;
    };
  };
  debugInfo: {
    entitiesFound: number;
    formFieldsFound: number;
    hasRawText: boolean;
    processorType: string;
  };
  biometric_result?: BiometricResult;
}

export interface UserVerificationStatus {
  verification_status: 'pending' | 'verified' | 'auto_approved' | 'rejected';
  verification_method?: 'automatic' | 'manual';
  verification_date?: any;
  verification_documents?: VerificationDocuments;
  analysis_result?: AnalysisResult;
}

// Interface principale utilisateur - version consolidée
export interface User {
  id: string;
  email: string;
  phone: string;
  role: 'user' | 'organizer' | 'admin';

  // Données d'authentification (sensibles)
  password_hash?: string;
  password_salt?: string;

  // Données personnelles initiales (saisie manuelle)
  initialData: IdentityData;

  // Données du profil (confirmées par vérification d'identité)
  profile?: IdentityData & {
    verified: boolean;
  };
  // Statut de vérification
  verification: UserVerificationStatus;

  // Métadonnées
  created_at: any;
  updated_at: any;
}

// Type pour la réconciliation des données
export interface DataReconciliation {
  hasConflicts: boolean;
  conflicts: {
    firstName?: {
      initial: string;
      fromId: string;
    };
    lastName?: {
      initial: string;
      fromId: string;
    };
    birthDate?: {
      initial: string;
      fromId: string;
    };
  };
  recommendedAction: 'accept_id_data' | 'keep_initial_data' | 'manual_review';
}
