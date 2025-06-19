// services/documentAnalysis.ts
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import { functions, storage, auth } from "@/firebase/config";
import {
  validateMRZ,
  compareMRZWithOCR,
  type MRZValidationResult,
} from "./mrz.service";

export interface AnalysisResult {
  success: boolean;
  data: {
    firstName?: { value: string; confidence: number };
    lastName?: { value: string; confidence: number };
    birthDate?: { value: string; confidence: number };
    documentNumber?: { value: string; confidence: number };
    address?: { value: string; confidence: number };
    rawText?: { value: string; confidence: number };
  };
  confidence: number;
  isDevelopmentMode?: boolean;
  error?: string;
  message?: string;
  // Nouvelles propriétés pour MRZ
  mrzValidation?: MRZValidationResult;
  crossValidation?: {
    matches: boolean;
    discrepancies: string[];
    confidence: number;
  };
}

// Nouvelle fonction qui combine upload + analyse
export const analyzeIdDocument = async (
  imageUri: string,
  userId: string
): Promise<AnalysisResult> => {
  try {
    console.log("=== Début analyse document ===");

    // Vérifier que l'utilisateur est connecté
    if (!auth.currentUser) {
      throw new Error("Vous devez être connecté pour analyser un document");
    }

    console.log("Utilisateur connecté:", auth.currentUser.uid);

    // Attendre que le token d'authentification soit prêt
    await auth.currentUser.getIdToken(true);
    console.log("Token d'authentification récupéré");

    // 1. Convertir l'image en blob
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error("Impossible de lire l'image");
    }
    const blob = await response.blob();

    // 2. Créer une référence unique dans Storage
    const fileName = `analysis_${Date.now()}.jpg`;
    const storageRef = ref(storage, `temp/${userId}/${fileName}`);

    console.log("Upload vers Firebase Storage...");

    // 3. Upload vers Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob);

    // 4. Construire l'URI GCS
    const gcsUri = `gs://${snapshot.ref.bucket}/${snapshot.ref.fullPath}`;
    console.log("GCS URI créé:", gcsUri);

    // 5. Créer l'instance de la fonction avec l'authentification
    console.log("Appel de analyzeIdentityDocument...");

    // Forcer la récupération d'un token frais juste avant l'appel
    const idToken = await auth.currentUser.getIdToken(true);
    console.log("Token ID récupéré (longueur):", idToken.length);
    const analyzeDocument = httpsCallable<{ gcsUri: string }, AnalysisResult>(
      functions,
      "analyzeIdentityDocument"
    ); // Appeler la Cloud Function
    const result = await analyzeDocument({ gcsUri });

    console.log("Résultat reçu:", result.data);

    // Handle development mode (when Document AI is not configured)
    if (result.data.isDevelopmentMode) {
      console.warn("Document AI not configured - using development mode");
    }

    // Si on a des données de document, essayer d'extraire et valider les lignes MRZ
    let analysisResult = result.data; // Tenter de détecter et valider le MRZ depuis le texte brut
    if (result.data.success && result.data.data?.rawText?.value) {
      console.log("Tentative d'extraction MRZ depuis le texte...");
      try {
        // Extraire les lignes potentielles de MRZ (lignes avec des caractères spéciaux typiques)
        const text = result.data.data.rawText.value;
        const lines = text.split("\n").map((line) => line.trim());

        // Filtrer les lignes qui ressemblent à du MRZ (contiennent des '<' ou sont de longueur fixe)
        const mrzLines = lines.filter(
          (line) =>
            (line.includes("<") && line.length >= 30) ||
            line.length === 30 ||
            line.length === 44
        );

        if (mrzLines.length > 0) {
          console.log("Lignes MRZ potentielles trouvées:", mrzLines);
          const mrzValidation = validateMRZ(mrzLines);
          if (mrzValidation.isValid && mrzValidation.data) {
            console.log("MRZ valide détecté:", mrzValidation);
            analysisResult.mrzValidation = mrzValidation; // Ajouter la validation croisée entre MRZ et OCR
            if (result.data.data.firstName || result.data.data.lastName) {
              const crossValidation = compareMRZWithOCR(mrzValidation.data, {
                firstName: result.data.data.firstName?.value,
                lastName: result.data.data.lastName?.value,
                birthDate: result.data.data.birthDate?.value,
                documentNumber: result.data.data.documentNumber?.value,
              });
              analysisResult.crossValidation = crossValidation;
              console.log("Validation croisée:", crossValidation);
            }
          } else {
            console.log("MRZ détecté mais invalide:", mrzValidation.errors);
          }
        } else {
          console.log("Aucune ligne MRZ détectée dans le texte");
        }
      } catch (mrzError) {
        console.warn("Erreur lors de la validation MRZ:", mrzError);
        // Ne pas faire échouer l'analyse pour une erreur MRZ
      }
    } // 6. Nettoyer le fichier temporaire
    try {
      await deleteObject(storageRef);
      console.log("Fichier temporaire supprimé");
    } catch (cleanupError) {
      console.warn("Erreur lors du nettoyage:", cleanupError);
      // Ne pas faire échouer l'analyse pour un problème de nettoyage
    }

    return analysisResult;
  } catch (error: unknown) {
    console.error("Erreur complète lors de l'analyse:", error);

    // Gérer les différents types d'erreurs
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "functions/failed-precondition") {
        throw new Error("Vous devez être connecté pour analyser un document");
      } else if (error.code === "functions/unauthenticated") {
        throw new Error("Vous devez être connecté pour analyser un document");
      } else if (error.code === "storage/unauthorized") {
        throw new Error("Permissions insuffisantes pour accéder au stockage");
      } else if (error.code === "functions/not-found") {
        throw new Error("Service d'analyse non disponible");
      }
    }
    // Fallback pour les autres types d'erreurs
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erreur lors de l'analyse du document";
    throw new Error(errorMessage);
  }
};
