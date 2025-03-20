/**
 * Utilitaires de cryptographie pour l'application SafePass
 */
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as Random from "expo-random";
import { encode as encodeBase64, decode as decodeBase64 } from "base-64";

/**
 * Générer un sel aléatoire pour le hachage
 */
export const generateSalt = async (length: number = 16): Promise<string> => {
  const randomBytes = await Random.getRandomBytesAsync(length);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * Hacher un mot de passe avec un sel
 */
export const hashPassword = async (
  password: string,
  salt?: string
): Promise<{ hash: string; salt: string }> => {
  const usedSalt = salt || (await generateSalt());
  const passwordWithSalt = password + usedSalt;

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    passwordWithSalt
  );

  return { hash, salt: usedSalt };
};

/**
 * Vérifier un mot de passe par rapport à un hash stocké
 */
export const verifyPassword = async (
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> => {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
};

/**
 * Stocker une donnée sensible dans le SecureStore
 */
export const saveSecureData = async (
  key: string,
  value: string
): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    console.error("Erreur lors du stockage sécurisé:", error);
    return false;
  }
};

/**
 * Récupérer une donnée sensible depuis le SecureStore
 */
export const getSecureData = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error("Erreur lors de la récupération sécurisée:", error);
    return null;
  }
};

/**
 * Supprimer une donnée sensible du SecureStore
 */
export const deleteSecureData = async (key: string): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression sécurisée:", error);
    return false;
  }
};

/**
 * Générer un UUID v4
 */
export const generateUUID = async (): Promise<string> => {
  const randomBytes = await Random.getRandomBytesAsync(16);

  // Set version (4) and variant (2)
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;

  const hexBytes = Array.from(randomBytes).map((b) =>
    b.toString(16).padStart(2, "0")
  );

  return [
    hexBytes.slice(0, 4).join(""),
    hexBytes.slice(4, 6).join(""),
    hexBytes.slice(6, 8).join(""),
    hexBytes.slice(8, 10).join(""),
    hexBytes.slice(10).join(""),
  ].join("-");
};

/**
 * Chiffrer des données sensibles
 * Note: Ceci est une implémentation simplifiée pour l'exemple.
 * Dans un contexte réel, utilisez une bibliothèque dédiée comme expo-crypto.
 */
export const encryptData = (data: string, secretKey: string): string => {
  // Simple XOR encryption (pour l'illustration uniquement, non sécurisé)
  const encrypted = [];
  for (let i = 0; i < data.length; i++) {
    const charCode =
      data.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length);
    encrypted.push(String.fromCharCode(charCode));
  }

  return encodeBase64(encrypted.join(""));
};

/**
 * Déchiffrer des données sensibles
 */
export const decryptData = (
  encryptedData: string,
  secretKey: string
): string => {
  const data = decodeBase64(encryptedData);

  // Simple XOR decryption
  const decrypted = [];
  for (let i = 0; i < data.length; i++) {
    const charCode =
      data.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length);
    decrypted.push(String.fromCharCode(charCode));
  }

  return decrypted.join("");
};

/**
 * Générer une chaîne aléatoire
 */
export const generateRandomString = async (
  length: number = 16
): Promise<string> => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomBytes = await Random.getRandomBytesAsync(length);

  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % charset.length;
    result += charset[randomIndex];
  }

  return result;
};
