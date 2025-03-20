import { auth, db } from '@/firebase/config';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import {
    PhoneAuthProvider,
    signInWithCredential,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User,
    PhoneAuthCredential
} from 'firebase/auth';
import * as Crypto from 'expo-crypto';
import { doc, setDoc, getDoc, serverTimestamp, query, collection, where, getDocs, updateDoc } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { createError } from '@/utils/helpers';

/**
 * Formate un numéro de téléphone au format international (+33)
 */
export const formatPhone = (phone: string): string => {
    const cleaned = phone.trim().replace(/\s/g, '').replace(/[()-]/g, '');
    return !cleaned.startsWith('+')
        ? cleaned.startsWith('0')
            ? `+33${cleaned.slice(1)}`
            : `+33${cleaned}`
        : cleaned;
};

/**
 * Envoie un code de vérification au numéro de téléphone
 */
export const sendVerificationCode = async (
    phoneNumber: string,
    recaptchaVerifier: React.RefObject<FirebaseRecaptchaVerifierModal>
): Promise<string> => {
    const formattedPhone = formatPhone(phoneNumber);
    const provider = new PhoneAuthProvider(auth);
    return await provider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier.current as any
    );
};

/**
 * Vérifie si un numéro de téléphone existe déjà dans la base de données
 */
export const checkPhoneExists = async (phoneNumber: string): Promise<boolean> => {
    const formattedPhone = formatPhone(phoneNumber);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', formattedPhone));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};

/**
 * Vérifie si un email existe déjà dans la base de données
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};

/**
 * Hache un mot de passe avec un sel basé sur l'identifiant utilisateur
 */
export const hashPassword = async (password: string, uid: string) => {
    const salt = uid.slice(0, 16);
    const passwordWithSalt = password + salt;
    const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        passwordWithSalt
    );
    return { hash, salt };
};

/**
 * Vérifie un mot de passe avec le hash stocké
 */
export const verifyPassword = async (password: string, storedHash: string, userId: string): Promise<boolean> => {
    const { hash } = await hashPassword(password, userId);
    return hash === storedHash;
};

/**
 * Valide un mot de passe selon les règles de sécurité
 */
export const validatePassword = (password: string): boolean => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return minLength && hasUpperCase && hasNumber && hasSpecialChar;
};

/**
 * S'inscrire avec téléphone et mot de passe
 */
export const registerWithPhone = async (
    credential: PhoneAuthCredential,
    userData: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        phone: string;
        birthDate: Date;
    }
) => {
    // Connecter l'utilisateur avec le téléphone vérifié
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    // Hasher le mot de passe
    const { hash } = await hashPassword(userData.password, user.uid);

    // Mettre à jour le profil utilisateur
    await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
    });

    // Créer le document utilisateur dans Firestore
    await setDoc(doc(db, 'users', user.uid), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email.toLowerCase(),
        phone: formatPhone(userData.phone),
        birthDate: userData.birthDate,
        password_hash: hash,
        isVerified: false,
        verification_status: 'not_submitted',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
    });

    return user;
};

/**
 * S'inscrire avec email et mot de passe
 */
export const registerWithEmail = async (
    email: string,
    password: string,
    userData: {
        firstName: string;
        lastName: string;
        phone: string;
        birthDate: Date;
    }
) => {
    // Créer l'utilisateur avec email/mot de passe
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Hasher le mot de passe pour le stocker aussi dans Firestore
    const { hash } = await hashPassword(password, user.uid);

    // Mettre à jour le profil utilisateur
    await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
    });

    // Créer le document utilisateur dans Firestore
    await setDoc(doc(db, 'users', user.uid), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: email.toLowerCase(),
        phone: formatPhone(userData.phone),
        birthDate: userData.birthDate,
        password_hash: hash,
        isVerified: false,
        verification_status: 'not_submitted',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
    });

    return user;
};

/**
 * Se connecter avec téléphone et code de vérification
 */
export const loginWithPhone = async (credential: PhoneAuthCredential) => {
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
};

/**
 * Se connecter avec email et mot de passe
 */
export const loginWithEmail = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

/**
 * Se déconnecter
 */
export const logout = async (): Promise<void> => {
    await signOut(auth);
    // Nettoyer les données stockées localement
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('userEmail');
};

/**
 * Récupérer les données utilisateur depuis Firestore
 */
export const getUserData = async (userId: string) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
        return userDoc.data();
    }
    return null;
};

/**
 * Mettre à jour les données utilisateur
 */
export const updateUserData = async (userId: string, data: any) => {
    await updateDoc(doc(db, 'users', userId), {
        ...data,
        updated_at: serverTimestamp()
    });
};

/**
 * Valider un email
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
/**
 * Vérifie le code de vérification reçu par SMS
 */
export const verifyPhoneCode = async (
    verificationId: string,
    verificationCode: string,
    phoneNumber: string
): Promise<PhoneAuthCredential> => {
    try {
        // Vérifier si le numéro existe déjà
        const phoneExists = await checkPhoneExists(phoneNumber);

        // Si on essaie de s'inscrire avec un numéro déjà utilisé
        if (phoneExists) {
            throw createError('Ce numéro de téléphone est déjà utilisé', 'phone_exists');
        }

        // Créer l'objet credential pour l'authentification
        const credential = PhoneAuthProvider.credential(
            verificationId,
            verificationCode
        );

        return credential;
    } catch (error) {
        console.error('Erreur de vérification du code:', error);
        throw error;
    }
};

/**
 * Vérifie le code de vérification reçu par SMS pour la connexion
 * (sans vérifier si le numéro existe déjà)
 */
export const verifyPhoneCodeForLogin = async (
    verificationId: string,
    verificationCode: string
): Promise<PhoneAuthCredential> => {
    try {
        // Créer l'objet credential pour l'authentification
        const credential = PhoneAuthProvider.credential(
            verificationId,
            verificationCode
        );

        return credential;
    } catch (error) {
        console.error('Erreur de vérification du code:', error);
        throw error;
    }
};