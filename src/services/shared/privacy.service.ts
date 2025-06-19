import { cleanupAllUserTempFiles } from './cleanup.service';

/**
 * Nettoie les selfies après vérification d'identité
 */
export const cleanupSelfieAfterVerification = async (userId: string): Promise<void> => {
  try {
    // Nettoyer les selfies temporaires après traitement
    console.log(`Nettoyage des selfies pour l'utilisateur: ${userId}`);
    await cleanupAllUserTempFiles(userId);
  } catch (error) {
    console.error('Erreur lors du nettoyage des selfies:', error);
  }
};

/**
 * Anonymise les données sensibles d'un utilisateur
 */
export const anonymizeUserData = async (userId: string): Promise<void> => {
  try {
    // Placeholder pour l'anonymisation des données
    console.log(`Anonymisation des données pour l'utilisateur: ${userId}`);
  } catch (error) {
    console.error("Erreur lors de l'anonymisation:", error);
  }
};
