/**
 * Service de comparaison biométrique faciale
 * Utilise Google Cloud Vision API ou une alternative pour comparer les visages
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

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

export interface FaceDetectionResult {
  faceDetected: boolean;
  confidence: number;
  quality: 'high' | 'medium' | 'low';
  landmarks?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    mouth: { x: number; y: number };
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
    console.log('=== Début comparaison biométrique ===');
    console.log('Document:', documentImageUri);
    console.log('Selfie:', selfieImageUri);
    console.log('User ID:', userId);

    // Appeler la Cloud Function de comparaison biométrique
    const compareFacesFunction = httpsCallable<
      { documentImageUri: string; selfieImageUri: string; userId: string },
      BiometricComparisonResult
    >(functions, 'compareFaces');

    const result = await compareFacesFunction({
      documentImageUri,
      selfieImageUri,
      userId,
    });

    const response = result.data;
    console.log('=== Résultat comparaison biométrique ===', response);

    return response;
  } catch (error: any) {
    console.error('Erreur lors de la comparaison biométrique:', error);

    return {
      success: false,
      match: false,
      confidence: 0,
      similarityScore: 0,
      error: error.message || 'Erreur lors de la comparaison biométrique',
    };
  }
};

/**
 * Détecte la présence d'un visage dans une image
 */
export const detectFace = async (imageUri: string): Promise<FaceDetectionResult> => {
  try {
    // Pour l'instant, simulons la détection de visage
    // En production, utiliser une API de détection faciale
    console.log('Détection de visage pour:', imageUri);

    // Simulation - en réalité, analyser l'image
    return {
      faceDetected: true,
      confidence: 0.85,
      quality: 'high',
      landmarks: {
        leftEye: { x: 100, y: 150 },
        rightEye: { x: 200, y: 150 },
        nose: { x: 150, y: 200 },
        mouth: { x: 150, y: 250 },
      },
    };
  } catch (error) {
    console.error('Erreur lors de la détection de visage:', error);
    return {
      faceDetected: false,
      confidence: 0,
      quality: 'low',
    };
  }
};

/**
 * Valide la qualité d'un selfie pour la vérification biométrique
 */
export const validateSelfieQuality = async (
  imageUri: string
): Promise<{
  isValid: boolean;
  score: number;
  issues: string[];
}> => {
  try {
    const faceDetection = await detectFace(imageUri);
    const issues: string[] = [];

    if (!faceDetection.faceDetected) {
      issues.push("Aucun visage détecté dans l'image");
    }

    if (faceDetection.confidence < 0.7) {
      issues.push("Qualité de l'image insuffisante");
    }

    if (faceDetection.quality === 'low') {
      issues.push('Éclairage insuffisant ou image floue');
    }

    return {
      isValid: issues.length === 0,
      score: faceDetection.confidence,
      issues,
    };
  } catch (error) {
    console.error('Erreur lors de la validation du selfie:', error);
    return {
      isValid: false,
      score: 0,
      issues: ["Erreur lors de l'analyse de l'image"],
    };
  }
};

/**
 * Prépare une image pour la comparaison biométrique (redimensionnement, optimisation)
 */
export const prepareImageForComparison = async (
  imageUri: string
): Promise<{
  optimizedUri: string;
  size: { width: number; height: number };
}> => {
  // Pour l'instant, retourner l'URI originale
  // En production, appliquer des optimisations (compression, redimensionnement)
  return {
    optimizedUri: imageUri,
    size: { width: 1024, height: 1024 },
  };
};
