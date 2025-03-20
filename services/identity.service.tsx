import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';

/**
 * Upload une image vers Firebase Storage
 */
export const uploadImage = async (uri: string, path: string, onProgress?: (progress: number) => void) => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();

        const storage = getStorage();
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, blob);

        return new Promise<string>((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    // Progression de l'upload
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) {
                        onProgress(progress);
                    }
                },
                (error) => {
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    } catch (error) {
        console.error('Erreur lors de l\'upload de l\'image:', error);
        throw error;
    }
};

/**
 * Soumettre une demande de vérification d'identité
 */
export const submitVerification = async (
    userId: string,
    idFrontUrl: string,
    idBackUrl: string,
    selfieUrl: string,
    onProgress?: (progress: number) => void
) => {
    try {
        // Mettre à jour le statut de vérification dans Firestore
        await updateDoc(doc(db, 'users', userId), {
            verification_status: 'pending',
            verification_documents: {
                id_front: idFrontUrl,
                id_back: idBackUrl,
                selfie: selfieUrl,
                submitted_at: serverTimestamp()
            },
            updated_at: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Erreur lors de la soumission de la vérification:', error);
        throw error;
    }
};

/**
 * Récupérer le statut de vérification d'identité
 */
export const getVerificationStatus = async (userId: string) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (!userDoc.exists()) {
            return null;
        }

        const userData = userDoc.data();

        return {
            status: userData.verification_status || 'not_submitted',
            isVerified: userData.isVerified || false,
            submissionDate: userData.verification_documents?.submitted_at?.toDate?.() || null
        };
    } catch (error) {
        console.error('Erreur lors de la récupération du statut de vérification:', error);
        throw error;
    }
};

/**
 * Approuver une vérification d'identité (pour l'administration)
 */
export const approveVerification = async (userId: string) => {
    try {
        await updateDoc(doc(db, 'users', userId), {
            verification_status: 'approved',
            isVerified: true,
            verification_approved_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Erreur lors de l\'approbation de la vérification:', error);
        throw error;
    }
};

/**
 * Rejeter une vérification d'identité (pour l'administration)
 */
export const rejectVerification = async (userId: string, reason: string) => {
    try {
        await updateDoc(doc(db, 'users', userId), {
            verification_status: 'rejected',
            isVerified: false,
            verification_rejection_reason: reason,
            verification_rejected_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Erreur lors du rejet de la vérification:', error);
        throw error;
    }
};