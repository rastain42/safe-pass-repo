import * as SecureStore from 'expo-secure-store';
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuration Firebase
export const firebaseConfig = {
  apiKey: 'AIzaSyDL6ewrUgqR1JAOUNnQ675J29Jny1qsan4',
  authDomain: 'safepass.fr',
  projectId: 'safe-pass-5ebef',
  storageBucket: 'safe-pass-5ebef.firebasestorage.app',
  messagingSenderId: '977260058877',
  appId: '1:977260058877:android:9d1443dcf8f709ff4e0694',
};

// Initialiser l'application
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialiser l'authentification avec persistance
let auth: Auth;
try {
  // Pour React Native avec Firebase v11, la persistance AsyncStorage est automatique
  // Il suffit d'utiliser initializeAuth sans paramètres de persistance spécifiques
  auth = initializeAuth(app);
} catch (error) {
  // Si l'auth est déjà initialisée, utiliser l'instance existante
  console.warn('Firebase Auth already initialized:', error);
  auth = getAuth(app);
}

// Initialiser les autres services Firebase
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Définir la langue par défaut pour l'authentification
auth.languageCode = 'fr';

/**
 * Sauvegarde une donnée de manière sécurisée
 */
export const saveAuthData = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
    throw error;
  }
};

/**
 * Récupère une donnée sauvegardée de manière sécurisée
 */
export const getAuthData = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération de ${key}:`, error);
    return null;
  }
};

/**
 * Supprime une donnée sauvegardée
 */
export const removeAuthData = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression de ${key}:`, error);
  }
};

/**
 * Nettoie toutes les données d'authentification
 */
export const clearAuthData = async (): Promise<void> => {
  const keys = [
    'userId',
    'userFirstName',
    'userLastName',
    'userBirthDate',
    'userEmail',
    'userRole',
    'lastLogin',
    'verifiedPhone',
  ];

  await Promise.all(keys.map(key => removeAuthData(key)));
};

export { auth, db, functions, storage };
