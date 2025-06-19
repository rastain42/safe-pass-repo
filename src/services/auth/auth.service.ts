import { auth, db, saveAuthData } from '@/config/firebase';
import { hashPassword, formatPhoneNumber } from '@/utils/auth.utils';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

export interface UserData {
  phone: string;
  email: string;
  password_hash: string;
  password_salt: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  role: string;
  verified_status: string;
  created_at: any;
  updated_at: any;
}

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  role: string;
}

/**
 * Envoie un code de vérification au numéro de téléphone
 */
export const sendVerificationCode = async (
  phoneNumber: string,
  recaptchaVerifier: any
): Promise<{ verificationId: string; formattedPhone: string }> => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const phoneProvider = new PhoneAuthProvider(auth);
  const verificationId = await phoneProvider.verifyPhoneNumber(formattedPhone, recaptchaVerifier);
  return { verificationId, formattedPhone };
};

/**
 * Vérifie le code d'authentification pour la connexion
 */
export const verifyCode = async (
  verificationId: string,
  verificationCode: string
): Promise<{
  userId: string;
  phoneNumber: string | null;
  userData: any;
}> => {
  const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  // Vérifier si l'utilisateur existe dans Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid));

  if (!userDoc.exists()) {
    await auth.signOut();
    throw new Error("Ce numéro n'est pas enregistré. Veuillez vous inscrire.");
  }

  const userData = userDoc.data();

  if (!userData.password_hash || !userData.password_salt) {
    await auth.signOut();
    throw new Error("Ce compte n'a pas de mot de passe configuré. Veuillez contacter le support.");
  }

  return {
    userId: user.uid,
    phoneNumber: user.phoneNumber,
    userData,
  };
};

/**
 * Vérifie le code pour l'inscription (différent de la vérification pour login)
 */
export const verifyCodeForRegistration = async (
  verificationId: string,
  verificationCode: string
): Promise<{
  userId: string;
  phoneNumber: string | null;
}> => {
  const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  // Vérifier si l'utilisateur existe déjà dans Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid));

  if (userDoc.exists()) {
    await auth.signOut();
    throw new Error('Ce numéro de téléphone est déjà enregistré.');
  }

  return {
    userId: user.uid,
    phoneNumber: user.phoneNumber,
  };
};

/**
 * Authentifie l'utilisateur avec son mot de passe
 */
export const authenticateWithPassword = async (userId: string, password: string): Promise<any> => {
  const userDoc = await getDoc(doc(db, 'users', userId));

  if (!userDoc.exists()) {
    throw new Error('Utilisateur introuvable');
  }

  const userData = userDoc.data();

  if (!userData.password_hash || !userData.password_salt) {
    throw new Error("Ce compte n'a pas de mot de passe configuré. Veuillez contacter le support.");
  }

  const hashedPassword = await hashPassword(password, userData.password_salt);

  if (hashedPassword !== userData.password_hash) {
    throw new Error('Mot de passe incorrect');
  }

  // Sauvegarder les informations utilisateur
  await saveAuthData('lastLogin', new Date().toISOString());
  await saveAuthData('userFirstName', userData.first_name || '');
  await saveAuthData('userLastName', userData.last_name || '');
  await saveAuthData('userBirthDate', userData.birth_date || '');
  await saveAuthData('userRole', userData.role || 'user');
  await saveAuthData('userId', userId);

  return userData;
};

/**
 * Sauvegarde le téléphone vérifié
 */
export const saveVerifiedPhone = async (phone: string): Promise<void> => {
  await saveAuthData('verifiedPhone', phone);
};

/**
 * Vérifie si un numéro de téléphone existe déjà
 */
export const checkPhoneNumberExists = async (phoneNumber: string): Promise<boolean> => {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('phone', '==', formattedPhone));
  const querySnapshot = await getDocs(q);

  return !querySnapshot.empty;
};

/**
 * Vérifie si un email existe déjà
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
  const querySnapshot = await getDocs(q);

  return !querySnapshot.empty;
};

/**
 * Enregistre un nouvel utilisateur après validation du numéro de téléphone
 */
export const registerUser = async (userData: RegisterUserData): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Impossible de récupérer l'utilisateur après vérification.");
  }

  // Hacher le mot de passe avec le sel (uid)
  const passwordHash = await hashPassword(userData.password, currentUser.uid);

  const userRef = doc(db, 'users', currentUser.uid);
  const userDbData: UserData = {
    phone: currentUser.phoneNumber || formatPhoneNumber(currentUser.phoneNumber || ''),
    email: userData.email.toLowerCase().trim(),
    password_hash: passwordHash,
    password_salt: currentUser.uid,
    first_name: userData.firstName.trim(),
    last_name: userData.lastName.trim(),
    birth_date: userData.birthDate,
    role: userData.role,
    verified_status: 'verified',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  await setDoc(userRef, userDbData);

  // Sauvegarder les données dans SecureStore pour la persistance
  await saveAuthData('userId', currentUser.uid);
  await saveAuthData('userFirstName', userData.firstName.trim());
  await saveAuthData('userLastName', userData.lastName.trim());
  await saveAuthData('userBirthDate', userData.birthDate);
  await saveAuthData('userEmail', userData.email.toLowerCase().trim());
  await saveAuthData('userRole', userData.role);
  await saveAuthData('lastLogin', new Date().toISOString());

  return currentUser.uid;
};

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error);
    throw error;
  }
};
