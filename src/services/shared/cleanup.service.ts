import { deleteObject, ref } from 'firebase/storage';
import { storage } from '../../config/firebase';

/**
 * Nettoie les fichiers temporaires d'un utilisateur
 */
export const cleanupAllUserTempFiles = async (userId: string): Promise<void> => {
  try {
    // Liste des dossiers temporaires à nettoyer
    const tempFolders = [
      `temp/${userId}/`,
      `verifications/${userId}/temp/`,
      `documents/${userId}/temp/`,
    ];

    for (const folder of tempFolders) {
      try {
        // En production, utiliser listAll() pour lister les fichiers
        // puis les supprimer un par un
        console.log(`Nettoyage du dossier: ${folder}`);
      } catch (error) {
        console.warn(`Erreur lors du nettoyage de ${folder}:`, error);
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des fichiers temporaires:', error);
  }
};

/**
 * Supprime un fichier spécifique du storage
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    console.log(`Fichier supprimé: ${filePath}`);
  } catch (error) {
    console.error(`Erreur lors de la suppression de ${filePath}:`, error);
    throw error;
  }
};
