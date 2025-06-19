/**
 * Service de nettoyage des fichiers temporaires
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/config";

export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  failedCount: number;
  message: string;
}

/**
 * Nettoie les fichiers temporaires pour un utilisateur
 */
export const cleanupUserTempFiles = async (
  userId: string,
  patterns: string[]
): Promise<CleanupResult> => {
  try {
    console.log("=== Début nettoyage fichiers temporaires ===");
    console.log("User ID:", userId);
    console.log("Patterns:", patterns);

    // Appeler la Cloud Function de nettoyage
    const cleanupFunction = httpsCallable<
      { userId: string; patterns: string[] },
      CleanupResult
    >(functions, "cleanupTempFiles");

    const result = await cleanupFunction({
      userId,
      patterns,
    });

    console.log("Résultat nettoyage:", result.data);
    return result.data;
  } catch (error) {
    console.error("Erreur lors du nettoyage:", error);
    throw new Error(
      error instanceof Error ? error.message : "Erreur de nettoyage inconnue"
    );
  }
};

/**
 * Génère les patterns de nettoyage pour un utilisateur
 */
export const generateCleanupPatterns = (
  userId: string,
  timestamp?: number
): string[] => {
  const patterns = [
    `temp/${userId}/biometric_doc_`,
    `temp/${userId}/biometric_selfie_`,
    `temp/${userId}/temp_`,
  ];

  // Si un timestamp spécifique est fourni, nettoyer seulement ces fichiers
  if (timestamp) {
    return patterns.map((pattern) => `${pattern}${timestamp}`);
  }

  return patterns;
};

/**
 * Nettoie tous les fichiers temporaires d'un utilisateur
 */
export const cleanupAllUserTempFiles = async (
  userId: string
): Promise<CleanupResult> => {
  const patterns = generateCleanupPatterns(userId);
  return cleanupUserTempFiles(userId, patterns);
};

/**
 * Nettoie les fichiers temporaires d'une session spécifique
 */
export const cleanupSessionTempFiles = async (
  userId: string,
  timestamp: number
): Promise<CleanupResult> => {
  const patterns = generateCleanupPatterns(userId, timestamp);
  return cleanupUserTempFiles(userId, patterns);
};
