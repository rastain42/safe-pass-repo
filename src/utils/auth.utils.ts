import * as Crypto from 'expo-crypto';

/**
 * Hache un mot de passe avec un sel en utilisant SHA-256
 */
export const hashPassword = async (password: string, salt: string): Promise<string> => {
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
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.trim().replace(/\s/g, '').replace(/[()-]/g, '');

  return !cleaned.startsWith('+')
    ? cleaned.startsWith('0')
      ? `+33${cleaned.slice(1)}`
      : `+33${cleaned}`
    : cleaned;
};

/**
 * Génère un sel aléatoire pour le hachage du mot de passe
 */
export const generateSalt = async (): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Math.random().toString() + Date.now().toString()
  );
};

/**
 * Valide la force d'un mot de passe
 */
export const validatePasswordStrength = (
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valide un numéro de téléphone français
 */
export const validatePhoneNumber = (
  phone: string
): {
  isValid: boolean;
  error?: string;
} => {
  const formattedPhone = formatPhoneNumber(phone);

  // Vérification du format français
  const phoneRegex = /^\+33[1-9](\d{8})$/;

  if (!phoneRegex.test(formattedPhone)) {
    return {
      isValid: false,
      error: 'Le numéro de téléphone doit être un numéro français valide',
    };
  }

  return { isValid: true };
};
