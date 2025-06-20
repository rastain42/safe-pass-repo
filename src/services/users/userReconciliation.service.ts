import { User, DataReconciliation, IdentityData, AnalysisResult } from '@/types/user';

/**
 * Normalise une date depuis différents formats
 */
export const normalizeBirthDate = (dateStr: string): string => {
  // Supprime les informations de lieu entre parenthèses
  const cleanDate = dateStr.replace(/\s*\([^)]*\)/, '');

  // Convertit DD.MM.YYYY vers DD/MM/YYYY
  return cleanDate.replace(/\./g, '/');
};

/**
 * Normalise un nom (retire accents, met en forme)
 */
export const normalizeName = (name: string): string => {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Retire les accents
      .replace(/[^a-z]/g, '') // Garde seulement les lettres
      .charAt(0)
      .toUpperCase() + name.slice(1).toLowerCase()
  );
};

/**
 * Compare deux chaînes normalisées
 */
export const compareNormalizedStrings = (str1: string, str2: string): boolean => {
  return normalizeName(str1) === normalizeName(str2);
};

/**
 * Extrait les données d'identité depuis les résultats d'analyse
 */
export const extractIdentityFromAnalysis = (analysis: AnalysisResult): IdentityData => {
  return {
    firstName: analysis.data.firstName.value,
    lastName: analysis.data.lastName.value,
    birthDate: normalizeBirthDate(analysis.data.birthDate.value),
  };
};

/**
 * Analyse les conflits entre données initiales et données de la carte d'identité
 */
export const analyzeDataConflicts = (
  initialData: IdentityData,
  idData: IdentityData
): DataReconciliation => {
  const conflicts: DataReconciliation['conflicts'] = {};
  let hasConflicts = false;

  // Vérification du prénom
  if (!compareNormalizedStrings(initialData.firstName, idData.firstName)) {
    conflicts.firstName = {
      initial: initialData.firstName,
      fromId: idData.firstName,
    };
    hasConflicts = true;
  }

  // Vérification du nom
  if (!compareNormalizedStrings(initialData.lastName, idData.lastName)) {
    conflicts.lastName = {
      initial: initialData.lastName,
      fromId: idData.lastName,
    };
    hasConflicts = true;
  }

  // Vérification de la date de naissance
  const normalizedInitialDate = normalizeBirthDate(initialData.birthDate);
  const normalizedIdDate = normalizeBirthDate(idData.birthDate);

  if (normalizedInitialDate !== normalizedIdDate) {
    conflicts.birthDate = {
      initial: initialData.birthDate,
      fromId: idData.birthDate,
    };
    hasConflicts = true;
  }

  // Détermination de l'action recommandée
  let recommendedAction: DataReconciliation['recommendedAction'] = 'accept_id_data';

  if (!hasConflicts) {
    recommendedAction = 'accept_id_data';
  } else {
    // Si plusieurs conflits majeurs, recommander une révision manuelle
    const conflictCount = Object.keys(conflicts).length;
    if (conflictCount >= 2) {
      recommendedAction = 'manual_review';
    } else {
      // Pour un seul conflit, privilégier les données de la carte d'identité
      recommendedAction = 'accept_id_data';
    }
  }

  return {
    hasConflicts,
    conflicts,
    recommendedAction,
  };
};

/**
 * Applique la réconciliation des données utilisateur
 */
export const applyDataReconciliation = (
  user: User,
  idData: IdentityData,
  userChoice: 'accept_id_data' | 'keep_initial_data'
): User => {
  const updatedUser = { ...user };

  if (userChoice === 'accept_id_data') {
    // Met à jour les données du profil avec celles de la carte d'identité
    updatedUser.profile = {
      ...idData,
      verified: true,
    };
  } else {
    // Garde les données initiales mais marque comme vérifié
    updatedUser.profile = {
      ...user.initialData,
      verified: true,
    };
  }

  // Met à jour le statut de vérification
  updatedUser.verification = {
    ...updatedUser.verification,
    verification_status: 'verified',
    verification_date: new Date(),
  };

  updatedUser.updated_at = new Date();

  return updatedUser;
};

/**
 * Crée un utilisateur avec la nouvelle structure de données
 */
export const createUserWithNewStructure = (
  id: string,
  email: string,
  phone: string,
  role: string,
  initialData: IdentityData,
  passwordHash?: string,
  passwordSalt?: string
): User => {
  return {
    id,
    email,
    phone,
    role: role as 'user' | 'organizer' | 'admin',
    password_hash: passwordHash,
    password_salt: passwordSalt,
    initialData,
    verification: {
      verification_status: 'pending',
    },
    created_at: new Date(),
    updated_at: new Date(),
  };
};

/**
 * Migre un utilisateur existant vers la nouvelle structure
 */
export const migrateUserStructure = (legacyUser: any): User => {
  // Extraction des données depuis l'ancienne structure
  const initialData: IdentityData = {
    firstName: legacyUser.firstName || legacyUser.first_name || '',
    lastName: legacyUser.lastName || legacyUser.last_name || '',
    birthDate: legacyUser.birthDate || legacyUser.birth_date || '',
  };

  let profile: (IdentityData & { verified: boolean }) | undefined;

  // Si des données de profil existent, les utiliser
  if (legacyUser.profile) {
    profile = {
      firstName: legacyUser.profile.firstName,
      lastName: legacyUser.profile.lastName,
      birthDate: normalizeBirthDate(legacyUser.profile.birthDate),
      verified: legacyUser.profile.verified || false,
    };
  }

  // Construction du statut de vérification
  const verification: User['verification'] = {
    verification_status: legacyUser.verification_status || 'pending',
    verification_method: legacyUser.verification_documents?.analysis_result
      ? 'automatic'
      : undefined,
    verification_date: legacyUser.profile?.verification_date,
    verification_documents: legacyUser.verification_documents,
    analysis_result: legacyUser.verification_documents?.analysis_result,
  };

  return {
    id: legacyUser.id,
    email: legacyUser.email,
    phone: legacyUser.phone,
    role: legacyUser.role || 'user',
    password_hash: legacyUser.password_hash,
    password_salt: legacyUser.password_salt,
    initialData,
    profile,
    verification,
    created_at: legacyUser.created_at,
    updated_at: legacyUser.updated_at,
  };
};
