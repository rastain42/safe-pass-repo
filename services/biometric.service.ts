/**
 * Service de comparaison biométrique faciale
 * Utilise Google Cloud Vision API ou une alternative pour comparer les visages
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/config";

export interface BiometricComparisonResult {
  success: boolean;
  match: boolean;
  confidence: number;
  similarityScore: number;
  error?: string;
  details?: {
    faceDetectedInDocument: boolean;
    faceDetectedInSelfie: boolean;
    qualityScore: number;
    matchDecision?: string;
    thresholds?: {
      high: number;
      low: number;
    };
  };
}

/**
 * Compare deux images pour vérifier si elles contiennent le même visage
 */
export const compareFaces = async (
  documentImageUri: string,
  selfieImageUri: string,
  userId: string
): Promise<BiometricComparisonResult> => {
  try {
    console.log("=== Début comparaison biométrique ===");
    console.log("Document:", documentImageUri);
    console.log("Selfie:", selfieImageUri);
    console.log("User ID:", userId);

    // Appeler la Cloud Function de comparaison biométrique
    const compareFacesFunction = httpsCallable<
      { documentImageUri: string; selfieImageUri: string; userId: string },
      BiometricComparisonResult
    >(functions, "compareFaces");

    const result = await compareFacesFunction({
      documentImageUri,
      selfieImageUri,
      userId,
    });

    console.log("Résultat comparaison biométrique:", result.data);
    return result.data;
  } catch (error) {
    console.error("Erreur lors de la comparaison biométrique:", error);

    // Retourner un résultat d'erreur avec des détails
    return {
      success: false,
      match: false,
      confidence: 0,
      similarityScore: 0,
      error: error instanceof Error ? error.message : "Erreur inconnue",
      details: {
        faceDetectedInDocument: false,
        faceDetectedInSelfie: false,
        qualityScore: 0,
      },
    };
  }
};

/**
 * Évalue la qualité d'un selfie pour la comparaison biométrique
 */
export const evaluateSelfieQuality = async (
  selfieUri: string
): Promise<{
  isGoodQuality: boolean;
  score: number;
  issues: string[];
}> => {
  try {
    const evaluateQualityFunction = httpsCallable<
      { selfieUri: string },
      { isGoodQuality: boolean; score: number; issues: string[] }
    >(functions, "evaluateSelfieQuality");

    const result = await evaluateQualityFunction({ selfieUri });
    return result.data;
  } catch (error) {
    console.error("Erreur lors de l'évaluation de qualité:", error);
    return {
      isGoodQuality: false,
      score: 0,
      issues: ["Erreur lors de l'évaluation de la qualité"],
    };
  }
};
