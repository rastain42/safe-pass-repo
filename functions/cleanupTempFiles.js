const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getStorage } = require('firebase-admin/storage');

/**
 * Fonction Firebase pour nettoyer les fichiers temporaires
 */
const cleanupTempFiles = onCall(async request => {
  console.log('=== Cleanup Temp Files Start ===');
  console.log('User UID:', request.auth?.uid);

  // Vérifier l'authentification
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Non authentifié');
  }

  const { userId, patterns } = request.data;

  if (!userId || !patterns || !Array.isArray(patterns)) {
    throw new HttpsError('invalid-argument', 'Paramètres manquants ou invalides');
  }

  // Vérifier que l'utilisateur peut seulement nettoyer ses propres fichiers
  if (request.auth.uid !== userId) {
    throw new HttpsError('permission-denied', 'Vous ne pouvez nettoyer que vos propres fichiers');
  }

  try {
    const bucket = getStorage().bucket();
    let deletedCount = 0;
    let failedCount = 0;

    console.log(`Nettoyage pour l'utilisateur ${userId} avec ${patterns.length} patterns`);

    for (const pattern of patterns) {
      try {
        console.log(`Recherche des fichiers correspondant au pattern: ${pattern}`);

        // Lister les fichiers correspondant au pattern
        const [files] = await bucket.getFiles({
          prefix: pattern,
          maxResults: 100, // Limiter pour éviter les abus
        });

        console.log(`Trouvé ${files.length} fichiers pour le pattern ${pattern}`);

        // Supprimer chaque fichier
        for (const file of files) {
          try {
            await file.delete();
            deletedCount++;
            console.log(`Fichier supprimé: ${file.name}`);
          } catch (deleteError) {
            failedCount++;
            console.warn(`Erreur lors de la suppression de ${file.name}:`, deleteError.message);
          }
        }
      } catch (patternError) {
        console.warn(`Erreur pour le pattern ${pattern}:`, patternError.message);
        failedCount++;
      }
    }

    console.log(`Nettoyage terminé: ${deletedCount} supprimés, ${failedCount} échecs`);

    return {
      success: true,
      deletedCount,
      failedCount,
      message: `${deletedCount} fichiers supprimés, ${failedCount} échecs`,
    };
  } catch (error) {
    console.error('Erreur lors du nettoyage des fichiers temporaires:', error);
    throw new HttpsError('internal', `Erreur interne: ${error.message}`);
  }
});

module.exports = { cleanupTempFiles };
