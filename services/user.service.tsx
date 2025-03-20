import { doc, getDoc, updateDoc, serverTimestamp, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { updateProfile, deleteUser, UserProfile } from 'firebase/auth';
import { User } from '@/types/user';

/**
 * Créer un profil d'utilisateur
 */
export const createUserProfile = async (
    userDataOrId: string | UserProfile,
    userData?: UserProfile
): Promise<void> => {
    try {
        let userId: string;
        let data: UserProfile;

        // Si le premier paramètre est une chaîne, c'est l'ID utilisateur
        if (typeof userDataOrId === 'string') {
            userId = userDataOrId;
            data = userData as UserProfile;
        } else {
            // Sinon, userDataOrId contient les données et userId est dans userData.userId
            data = userDataOrId;
            userId = data.userId as string;
            delete data.userId; // Supprimer userId des données
        }

        // Convertir la date si elle est définie
        if (data.birthDate && !(data.birthDate instanceof Date)) {
            if (typeof data.birthDate === 'string' && data.birthDate.includes('/')) {
                const [day, month, year] = data.birthDate.split('/');
                data.birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
                data.birthDate = new Date(data.birthDate as string);
            }
        }

        // Créer le document utilisateur
        await setDoc(doc(db, 'users', userId), {
            ...data,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });
    } catch (error) {
        console.error("Erreur lors de la création du profil utilisateur:", error);
        throw error;
    }
};

/**
 * Récupérer les données du profil utilisateur
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (!userDoc.exists()) {
            return null;
        }

        const userData = userDoc.data() as User;

        // Convertir les dates Firestore en objets Date
        if (userData.birthDate) {
            // Cas 1: Timestamp Firestore (a une méthode toDate)
            if (typeof (userData.birthDate as any).toDate === 'function') {
                userData.birthDate = (userData.birthDate as any).toDate();
            }
            // Cas 2: String (ISO date ou autre format de date)
            else if (typeof userData.birthDate === 'string') {
                userData.birthDate = new Date(userData.birthDate);
            }
            // Cas 3: Timestamp numérique (millisecondes)
            else if (typeof userData.birthDate === 'number') {
                userData.birthDate = new Date(userData.birthDate);
            }
            // Cas 4: Déjà un objet Date
            else if (!(userData.birthDate instanceof Date)) {
                // Tentative de conversion en dernier recours
                userData.birthDate = new Date(userData.birthDate);
            }
        }

        return userData;
    } catch (error) {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
        throw error;
    }
};

/**
 * Mettre à jour les données du profil utilisateur
 */
export const updateUserProfile = async (
    userId: string,
    profileData: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        birthDate?: Date;
    }
): Promise<boolean> => {
    try {
        // Préparer les données à mettre à jour
        const updateData: any = {
            ...profileData,
            updated_at: serverTimestamp()
        };

        // Si le prénom ou le nom sont mis à jour, mettre à jour aussi le displayName dans Auth
        if (profileData.firstName || profileData.lastName) {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const firstName = profileData.firstName || userData.firstName;
                const lastName = profileData.lastName || userData.lastName;

                if (auth.currentUser) {
                    await updateProfile(auth.currentUser, {
                        displayName: `${firstName} ${lastName}`
                    });
                }
            }
        }

        // Mettre à jour le document Firestore
        await updateDoc(doc(db, 'users', userId), updateData);

        return true;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        throw error;
    }
};

/**
 * Supprimer un compte utilisateur (Firebase Auth + Firestore)
 */
export const deleteUserAccount = async (userId: string): Promise<boolean> => {
    try {
        // Supprimer le document utilisateur de Firestore
        await deleteDoc(doc(db, 'users', userId));

        // Supprimer le compte Firebase Auth si l'utilisateur est connecté
        if (auth.currentUser) {
            await deleteUser(auth.currentUser);
        }

        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        throw error;
    }
};

/**
 * Mettre à jour le statut de vérification d'identité
 */
export const updateVerificationStatus = async (
    userId: string,
    status: 'not_submitted' | 'pending' | 'verified' | 'rejected',
    verificationData?: {
        id_front?: string;
        id_back?: string;
        selfie?: string;
        rejection_reason?: string;
    }
): Promise<boolean> => {
    try {
        const updateData: any = {
            verification_status: status,
            updated_at: serverTimestamp()
        };

        // Mettre à jour isVerified en fonction du statut
        if (status === 'verified') {
            updateData.isVerified = true;
            updateData.verified_at = serverTimestamp();
        } else {
            updateData.isVerified = false;
        }

        // Ajouter les données de vérification si fournies
        if (verificationData) {
            updateData.verification_documents = verificationData;
        }

        await updateDoc(doc(db, 'users', userId), updateData);

        return true;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut de vérification:', error);
        throw error;
    }
};

/**
 * Vérifier si un numéro de téléphone existe déjà
 */
export const checkPhoneNumberExists = async (phoneNumber: string): Promise<boolean> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phone', '==', phoneNumber));
        const querySnapshot = await getDocs(q);

        return !querySnapshot.empty;
    } catch (error) {
        console.error('Erreur lors de la vérification du numéro de téléphone:', error);
        throw error;
    }
};

/**
 * Vérifier si un email existe déjà
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        return !querySnapshot.empty;
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'email:', error);
        throw error;
    }
};

/**
 * Mettre à jour les préférences de notification
 */
export const updateNotificationPreferences = async (
    userId: string,
    preferences: {
        email?: boolean;
        push?: boolean;
        sms?: boolean;
    }
): Promise<boolean> => {
    try {
        await updateDoc(doc(db, 'users', userId), {
            'preferences.notifications': preferences,
            updated_at: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Erreur lors de la mise à jour des préférences:', error);
        throw error;
    }
};

/**
 * Récupérer les utilisateurs avec vérification en attente (admin)
 */
export const getPendingVerifications = async (): Promise<User[]> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('verification_status', '==', 'pending'));
        const querySnapshot = await getDocs(q);

        const users: User[] = [];

        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() } as User);
        });

        return users;
    } catch (error) {
        console.error('Erreur lors de la récupération des vérifications en attente:', error);
        throw error;
    }
};