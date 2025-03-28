import * as SecureStore from "expo-secure-store";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Configuration Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyDL6ewrUgqR1JAOUNnQ675J29Jny1qsan4",
  authDomain: "safepass.fr",
  projectId: "safe-pass-5ebef",
  storageBucket: "safe-pass-5ebef.firebasestorage.app",
  messagingSenderId: "977260058877",
  appId: "1:977260058877:android:9d1443dcf8f709ff4e0694",
};

// Initialiser l'application
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialiser les services Firebase
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Définir la langue par défaut pour l'authentification
auth.languageCode = "fr";

// Fonctions pour gérer la persistance manuellement avec SecureStore
export const saveAuthData = async (key: string, data: any) => {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des données:", error);
    return false;
  }
};

export const getAuthData = async (key: string) => {
  try {
    const data = await SecureStore.getItemAsync(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    return null;
  }
};

export const removeAuthData = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression des données:", error);
    return false;
  }
};

export { app, auth, db, functions, storage };
