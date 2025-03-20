import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import * as Crypto from "expo-crypto";
import { auth, db, saveAuthData } from "../firebase/config";

/**
 * Hache un mot de passe avec un sel en utilisant SHA-256
 */
export const hashPassword = async (password: string, salt: string) => {
  const passwordWithSalt = password + salt;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    passwordWithSalt
  );
  return hash;
};

/**
 * Formate un numéro de téléphone au format international
 */
export const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.trim().replace(/\s/g, "").replace(/[()-]/g, "");

  return !cleaned.startsWith("+")
    ? cleaned.startsWith("0")
      ? `+33${cleaned.slice(1)}`
      : `+33${cleaned}`
    : cleaned;
};

/**
 * Envoie un code de vérification au numéro de téléphone
 */
export const sendVerificationCode = async (
  phoneNumber: string,
  recaptchaVerifier: any
) => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const phoneProvider = new PhoneAuthProvider(auth);
  const verificationId = await phoneProvider.verifyPhoneNumber(
    formattedPhone,
    recaptchaVerifier
  );
  return { verificationId, formattedPhone };
};

/**
 * Vérifie le code d'authentification
 */
export const verifyCode = async (
  verificationId: string,
  verificationCode: string
) => {
  const credential = PhoneAuthProvider.credential(
    verificationId,
    verificationCode
  );
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  // Vérifier si l'utilisateur existe dans Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid));

  if (!userDoc.exists()) {
    await auth.signOut();
    throw new Error("Ce numéro n'est pas enregistré. Veuillez vous inscrire.");
  }

  const userData = userDoc.data();

  if (!userData.password_hash || !userData.password_salt) {
    await auth.signOut();
    throw new Error(
      "Ce compte n'a pas de mot de passe configuré. Veuillez contacter le support."
    );
  }

  return {
    userId: user.uid,
    phoneNumber: user.phoneNumber,
    userData,
  };
};

/**
 * Authentifie l'utilisateur avec son mot de passe
 */
export const authenticateWithPassword = async (
  userId: string,
  password: string
) => {
  const userDoc = await getDoc(doc(db, "users", userId));

  if (!userDoc.exists()) {
    throw new Error("Utilisateur introuvable");
  }

  const userData = userDoc.data();

  if (!userData.password_hash || !userData.password_salt) {
    throw new Error(
      "Ce compte n'a pas de mot de passe configuré. Veuillez contacter le support."
    );
  }

  const hashedPassword = await hashPassword(password, userData.password_salt);

  if (hashedPassword !== userData.password_hash) {
    throw new Error("Mot de passe incorrect");
  }

  // Sauvegarder les informations utilisateur
  await saveAuthData("lastLogin", new Date().toISOString());
  await saveAuthData("userFirstName", userData.first_name || "");
  await saveAuthData("userLastName", userData.last_name || "");
  await saveAuthData("userBirthDate", userData.birth_date || "");
  await saveAuthData("userRole", userData.role || "user");
  await saveAuthData("userId", userId);

  return userData;
};

/**
 * Sauvegarde le téléphone vérifié
 */
export const saveVerifiedPhone = async (phone: string) => {
  await saveAuthData("verifiedPhone", phone);
};

/**
 * Vérifie si un numéro de téléphone existe déjà
 */
export const checkPhoneNumberExists = async (phoneNumber: string) => {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("phone", "==", formattedPhone));
  const querySnapshot = await getDocs(q);

  return !querySnapshot.empty;
};

/**
 * Vérifie si un email existe déjà
 */
export const checkEmailExists = async (email: string) => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
  const querySnapshot = await getDocs(q);

  return !querySnapshot.empty;
};

/**
 * Valide la complexité du mot de passe
 */
export const validatePassword = (password: string): boolean => {
  // Au moins 8 caractères, une majuscule, un chiffre et un caractère spécial
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return minLength && hasUpperCase && hasNumber && hasSpecialChar;
};

/**
 * Enregistre un nouvel utilisateur après validation du numéro de téléphone
 */
export const registerUser = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  role: string;
}) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error(
      "Impossible de récupérer l'utilisateur après vérification."
    );
  }

  // Hacher le mot de passe avec le sel (uid)
  const passwordHash = await hashPassword(userData.password, currentUser.uid);

  const userRef = doc(db, "users", currentUser.uid);
  const userDbData = {
    phone:
      currentUser.phoneNumber ||
      formatPhoneNumber(currentUser.phoneNumber || ""),
    email: userData.email.toLowerCase().trim(),
    password_hash: passwordHash,
    password_salt: currentUser.uid,
    first_name: userData.firstName.trim(),
    last_name: userData.lastName.trim(),
    birth_date: userData.birthDate,
    role: userData.role,
    verified_status: "verified",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  await setDoc(userRef, userDbData);

  // Sauvegarder les données dans SecureStore pour la persistance
  await saveAuthData("userId", currentUser.uid);
  await saveAuthData("userFirstName", userData.firstName.trim());
  await saveAuthData("userLastName", userData.lastName.trim());
  await saveAuthData("userBirthDate", userData.birthDate);
  await saveAuthData("userEmail", userData.email.toLowerCase().trim());
  await saveAuthData("userRole", userData.role);
  await saveAuthData("lastLogin", new Date().toISOString());

  return currentUser.uid;
};

/**
 * Vérifie le code pour l'inscription (différent de la vérification pour login)
 */
export const verifyCodeForRegistration = async (
  verificationId: string,
  verificationCode: string
) => {
  const credential = PhoneAuthProvider.credential(
    verificationId,
    verificationCode
  );
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  // Vérifier si l'utilisateur existe déjà dans Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid));

  if (userDoc.exists()) {
    await auth.signOut();
    throw new Error("Ce numéro de téléphone est déjà enregistré.");
  }

  return {
    userId: user.uid,
    phoneNumber: user.phoneNumber,
  };
};
