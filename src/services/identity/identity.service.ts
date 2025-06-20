import {
  User,
  IdentityData,
  DataReconciliation,
  AnalysisResult,
  VerificationDocuments,
} from '@/types/user';
import {
  analyzeDataConflicts,
  extractIdentityFromAnalysis,
  applyDataReconciliation,
  migrateUserStructure,
} from '@/services/users/userReconciliation.service';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface VerificationResult {
  success: boolean;
  analysisResult: AnalysisResult;
  hasConflicts: boolean;
  reconciliation?: DataReconciliation;
  idData: IdentityData;
}

/**
 * Traite les résultats de la vérification d'identité
 */
export const processIdentityVerification = async (
  userId: string,
  analysisResult: AnalysisResult,
  verificationDocuments: VerificationDocuments
): Promise<VerificationResult> => {
  try {
    // Récupération de l'utilisateur actuel
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Utilisateur non trouvé');
    }

    // Migration si nécessaire vers la nouvelle structure
    let user: User = migrateUserStructure(userSnap.data());

    // Extraction des données depuis l'analyse
    const idData = extractIdentityFromAnalysis(analysisResult);

    // Analyse des conflits
    const reconciliation = analyzeDataConflicts(user.initialData, idData);

    // Mise à jour des documents de vérification
    const updatedUser: User = {
      ...user,
      verification: {
        ...user.verification,
        verification_documents: verificationDocuments,
        analysis_result: analysisResult,
        verification_method: 'automatic',
      },
    };

    // Si pas de conflits, application automatique
    if (!reconciliation.hasConflicts) {
      const finalUser = applyDataReconciliation(updatedUser, idData, 'accept_id_data');
      await updateDoc(userRef, finalUser as any);
    } else {
      // Sauvegarde des données temporaires pour la réconciliation
      await updateDoc(userRef, updatedUser as any);
    }

    return {
      success: true,
      analysisResult,
      hasConflicts: reconciliation.hasConflicts,
      reconciliation: reconciliation.hasConflicts ? reconciliation : undefined,
      idData,
    };
  } catch (error) {
    console.error('Erreur lors du traitement de la vérification:', error);
    return {
      success: false,
      analysisResult,
      hasConflicts: false,
      idData: extractIdentityFromAnalysis(analysisResult),
    };
  }
};

/**
 * Applique le choix de l'utilisateur pour la réconciliation
 */
export const applyUserReconciliationChoice = async (
  userId: string,
  choice: 'accept_id_data' | 'keep_initial_data',
  idData: IdentityData
): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Utilisateur non trouvé');
    }

    const user: User = migrateUserStructure(userSnap.data());
    const updatedUser = applyDataReconciliation(user, idData, choice);

    await updateDoc(userRef, updatedUser as any);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'application du choix:", error);
    return false;
  }
};

/**
 * Remet à zéro le processus de vérification
 */
export const resetVerificationProcess = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error('Utilisateur non trouvé');
    }

    // Remise à zéro du statut de vérification
    await updateDoc(userRef, {
      verification: {
        verification_status: 'pending',
      },
      profile: null, // Supprime le profil vérifié
      updated_at: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Erreur lors de la remise à zéro:', error);
    return false;
  }
};

/**
 * Récupère l'utilisateur avec la nouvelle structure
 */
export const getUserWithNewStructure = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return migrateUserStructure(userSnap.data());
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur a besoin d'une migration
 */
export const needsMigration = (userData: any): boolean => {
  // Si la structure "initialData" n'existe pas, migration nécessaire
  return !userData.initialData;
};

/**
 * Effectue la migration d'un utilisateur vers la nouvelle structure
 */
export const migrateUserData = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return false;
    }

    const userData = userSnap.data();

    if (!needsMigration(userData)) {
      return true; // Déjà migré
    }

    const migratedUser = migrateUserStructure(userData);
    await updateDoc(userRef, migratedUser as any);

    console.log('Migration utilisateur réussie pour:', userId);
    return true;
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    return false;
  }
};
