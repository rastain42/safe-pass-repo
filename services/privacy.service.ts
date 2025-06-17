// services/privacy.service.ts
import { getStorage, ref, deleteObject, listAll } from "firebase/storage";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase/config";

/**
 * Service de gestion de la vie privée et des données personnelles
 */

/**
 * Supprime automatiquement les selfies après vérification
 */
export const cleanupSelfieAfterVerification = async (userId: string) => {
  try {
    const storage = getStorage();
    const userFolder = ref(storage, `verifications/${userId}`);
    const files = await listAll(userFolder);

    // Supprimer seulement les selfies, garder les documents d'identité
    const selfieFiles = files.items.filter((item) =>
      item.name.includes("selfie_")
    );

    for (const file of selfieFiles) {
      await deleteObject(file);
      console.log(`Selfie supprimé: ${file.name}`);
    }

    // Mettre à jour Firestore pour supprimer l'URL du selfie
    await updateDoc(doc(db, "users", userId), {
      "verification_documents.selfie": null,
      "verification_documents.selfie_deleted_at": new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du selfie:", error);
  }
};

/**
 * Supprime tous les documents de vérification d'un utilisateur
 */
export const deleteAllVerificationDocuments = async (userId: string) => {
  try {
    const storage = getStorage();
    const userFolder = ref(storage, `verifications/${userId}`);
    const files = await listAll(userFolder);

    // Supprimer tous les fichiers
    for (const file of files.items) {
      await deleteObject(file);
    }

    // Mettre à jour Firestore
    await updateDoc(doc(db, "users", userId), {
      verification_documents: null,
      verification_status: "not_verified",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression des documents:", error);
  }
};

/**
 * Nettoie automatiquement les documents anciens (tâche de maintenance)
 */
export const cleanupOldDocuments = async (daysOld: number = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("verification_documents.submitted_at", "<", cutoffDate),
      where("verification_status", "in", ["auto_approved", "approved"])
    );

    const querySnapshot = await getDocs(q);

    for (const userDoc of querySnapshot.docs) {
      await cleanupSelfieAfterVerification(userDoc.id);
    }
  } catch (error) {
    console.error("Erreur lors du nettoyage automatique:", error);
  }
};

/**
 * Configuration des règles de rétention
 */
export const RETENTION_POLICIES = {
  SELFIE_AFTER_VERIFICATION: 7, // jours
  DOCUMENTS_AFTER_APPROVAL: 365, // jours (légal)
  FAILED_VERIFICATIONS: 30, // jours
};
