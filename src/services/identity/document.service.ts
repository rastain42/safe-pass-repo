/**
 * Service de vérification d'identité
 * Combine l'analyse de documents, la validation MRZ et la comparaison biométrique
 */

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions, storage } from '../../config/firebase';
import { validateMRZ, compareMRZWithOCR, type MRZValidationResult } from './mrz.service';
import { compareFaces, type BiometricComparisonResult } from '../auth/biometric.service';

export type ProgressCallback = (progress: number) => void;

export interface DocumentAnalysisResult {
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
  mrzValidation?: MRZValidationResult;
  crossValidation?: {
    matches: boolean;
    discrepancies: string[];
    confidence: number;
  };
}

export interface VerificationResult {
  documentAnalysis: DocumentAnalysisResult;
  biometricComparison: BiometricComparisonResult;
  finalDecision: 'approved' | 'rejected' | 'manual_review';
  confidence: number;
  issues?: string[];
}

/**
 * Télécharge une image vers Firebase Storage
 */
export const uploadImage = async (
  uri: string,
  path: string,
  onProgress?: ProgressCallback
): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const storage = getStorage();
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, blob);

  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      snapshot => {
        // Afficher la progression
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      error => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

/**
 * Analyse un document d'identité
 */
export const analyzeIdDocument = async (
  imageUri: string,
  userId: string
): Promise<DocumentAnalysisResult> => {
  try {
    console.log('=== Début analyse document ===');

    // Vérifier que l'utilisateur est connecté
    if (!auth.currentUser) {
      throw new Error('Vous devez être connecté pour analyser un document');
    }

    console.log('Utilisateur connecté:', auth.currentUser.uid);

    // Attendre que le token d'authentification soit prêt
    await auth.currentUser.getIdToken(true);

    // Upload temporaire de l'image
    const timestamp = Date.now();
    const tempPath = `temp/${userId}/document_${timestamp}.jpg`;

    console.log("Upload de l'image vers:", tempPath);
    const imageUrl = await uploadImage(imageUri, tempPath);
    console.log("URL de l'image uploadée:", imageUrl);

    // Appeler la Cloud Function d'analyse
    const analyzeDocumentFunction = httpsCallable<
      { imageUrl: string; userId: string },
      DocumentAnalysisResult
    >(functions, 'analyzeDocument');

    console.log('Appel de la Cloud Function...');
    const result = await analyzeDocumentFunction({
      imageUrl,
      userId,
    });

    const analysisResult = result.data;
    console.log('=== Résultat analyse ===', analysisResult);

    return analysisResult;
  } catch (error: any) {
    console.error("Erreur lors de l'analyse du document:", error);

    return {
      success: false,
      data: {},
      confidence: 0,
      error: error.message || "Erreur lors de l'analyse du document",
    };
  }
};

/**
 * Effectue une vérification complète d'identité
 */
export const performCompleteVerification = async (
  documentImageUri: string,
  selfieImageUri: string,
  userId: string,
  onProgress?: ProgressCallback
): Promise<VerificationResult> => {
  try {
    console.log('=== Début vérification complète ===');

    // Étape 1: Analyse du document
    if (onProgress) onProgress(20);
    const documentAnalysis = await analyzeIdDocument(documentImageUri, userId);

    if (!documentAnalysis.success) {
      throw new Error("Échec de l'analyse du document");
    }

    // Étape 2: Upload des images pour la comparaison biométrique
    if (onProgress) onProgress(50);
    const timestamp = Date.now();

    const documentUrl = await uploadImage(
      documentImageUri,
      `verifications/${userId}/document_${timestamp}.jpg`
    );

    const selfieUrl = await uploadImage(
      selfieImageUri,
      `verifications/${userId}/selfie_${timestamp}.jpg`
    );

    // Étape 3: Comparaison biométrique
    if (onProgress) onProgress(80);
    const biometricComparison = await compareFaces(documentUrl, selfieUrl, userId);

    // Étape 4: Décision finale
    if (onProgress) onProgress(90);
    const finalDecision = determineFinalDecision(documentAnalysis, biometricComparison);

    const result: VerificationResult = {
      documentAnalysis,
      biometricComparison,
      finalDecision: finalDecision.decision,
      confidence: finalDecision.confidence,
      issues: finalDecision.issues,
    };

    // Sauvegarder le résultat
    await saveVerificationResult(userId, result);

    if (onProgress) onProgress(100);

    return result;
  } catch (error: any) {
    console.error('Erreur lors de la vérification complète:', error);
    throw error;
  }
};

/**
 * Détermine la décision finale basée sur l'analyse du document et la comparaison biométrique
 */
const determineFinalDecision = (
  documentAnalysis: DocumentAnalysisResult,
  biometricComparison: BiometricComparisonResult
): {
  decision: 'approved' | 'rejected' | 'manual_review';
  confidence: number;
  issues: string[];
} => {
  const issues: string[] = [];

  // Vérifications du document
  if (documentAnalysis.confidence < 0.8) {
    issues.push('Confiance document insuffisante');
  }

  if (documentAnalysis.mrzValidation && !documentAnalysis.mrzValidation.isValid) {
    issues.push('Validation MRZ échouée');
  }

  // Vérifications biométriques
  if (!biometricComparison.success || !biometricComparison.match) {
    issues.push('Comparaison biométrique échouée');
  }

  if (biometricComparison.confidence < 0.75) {
    issues.push('Confiance biométrique insuffisante');
  }

  // Calcul de la confiance globale
  const globalConfidence = (documentAnalysis.confidence + biometricComparison.confidence) / 2;

  // Décision finale
  if (issues.length === 0 && globalConfidence >= 0.85) {
    return { decision: 'approved', confidence: globalConfidence, issues };
  } else if (globalConfidence < 0.5 || issues.length > 2) {
    return { decision: 'rejected', confidence: globalConfidence, issues };
  } else {
    return { decision: 'manual_review', confidence: globalConfidence, issues };
  }
};

/**
 * Sauvegarde le résultat de vérification
 */
const saveVerificationResult = async (
  userId: string,
  result: VerificationResult
): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), {
    verification_status:
      result.finalDecision === 'approved'
        ? 'verified'
        : result.finalDecision === 'rejected'
          ? 'rejected'
          : 'pending',
    verification_result: result,
    verification_updated_at: serverTimestamp(),
  });
};

/**
 * Soumet une demande de vérification d'identité (méthode simple)
 */
export const submitVerificationRequest = async (
  idFront: string,
  idBack: string,
  selfie: string,
  onProgress?: ProgressCallback
): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('Utilisateur non connecté');
  }

  const userId = auth.currentUser.uid;
  const timestamp = Date.now();

  // Upload des images
  const idFrontURL = await uploadImage(
    idFront,
    `verifications/${userId}/id_front_${timestamp}.jpg`,
    onProgress
  );

  const idBackURL = await uploadImage(
    idBack,
    `verifications/${userId}/id_back_${timestamp}.jpg`,
    onProgress
  );

  const selfieURL = await uploadImage(
    selfie,
    `verifications/${userId}/selfie_${timestamp}.jpg`,
    onProgress
  );

  // Mise à jour du statut de vérification dans Firestore
  await updateDoc(doc(db, 'users', userId), {
    verification_status: 'pending',
    verification_documents: {
      id_front: idFrontURL,
      id_back: idBackURL,
      selfie: selfieURL,
      submitted_at: serverTimestamp(),
    },
  });
};
