import { getAuth } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { UserRole } from "@/types/enum";
import { signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Récupère l'utilisateur actuellement authentifié
 */
export const getCurrentUser = () => {
  const auth = getAuth();
  return auth.currentUser;
};

/**
 * Vérifie si l'utilisateur connecté est un organisateur
 */
export const checkUserIsOrganizer = async (): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user) return false;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    return userDoc.exists() && userDoc.data().role === UserRole.Organizer;
  } catch (error) {
    console.error("Erreur lors de la vérification du rôle:", error);
    return false;
  }
};

/**
 * Récupère les données d'un utilisateur depuis Firestore
 */
export const getUserData = async (userId: string) => {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données utilisateur:",
      error
    );
    throw error;
  }
};

/**
 * Déconnecte l'utilisateur actuel
 */
export const logoutUser = async () => {
  const auth = getAuth();
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    throw error;
  }
};
