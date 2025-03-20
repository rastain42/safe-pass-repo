/**
 * Utilitaires de validation pour l'application SafePass
 */

/**
 * Vérifie si un email est valide
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Vérifie si un numéro de téléphone est valide (format français)
 * Accepte: +33612345678, 0612345678, 06 12 34 56 78, etc.
 */
export const isValidPhoneNumber = (phone: string): boolean => {
    const cleanedPhone = phone.trim().replace(/\s/g, '').replace(/[()-]/g, '');

    // Vérifier le format français (mobile)
    const frenchMobileRegex = /^(?:(?:\+|00)33|0)[67][0-9]{8}$/;

    return frenchMobileRegex.test(cleanedPhone);
};

/**
 * Vérifie si un mot de passe respecte les critères de sécurité
 * - Au moins 8 caractères
 * - Au moins une lettre majuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 */
export const isStrongPassword = (password: string): boolean => {
    if (password.length < 8) return false;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
};

/**
 * Vérifie la force du mot de passe et retourne un score (0-100)
 */
export const passwordStrength = (password: string): {
    score: number;
    feedback: string;
} => {
    let score = 0;
    let feedback = '';

    // Longueur de base
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Complexité
    if (/[A-Z]/.test(password)) score += 10;
    if (/[a-z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;

    // Mélange (pas juste des lettres, des chiffres ou des symboles)
    const hasMultipleTypes =
        (/[a-zA-Z]/.test(password) ? 1 : 0) +
        (/\d/.test(password) ? 1 : 0) +
        (/[^a-zA-Z0-9]/.test(password) ? 1 : 0);

    if (hasMultipleTypes >= 2) score += 10;
    if (hasMultipleTypes >= 3) score += 10;

    // Feedback basé sur le score
    if (score < 40) {
        feedback = 'Mot de passe faible';
    } else if (score < 70) {
        feedback = 'Mot de passe moyen';
    } else {
        feedback = 'Mot de passe fort';
    }

    return { score, feedback };
};

/**
 * Vérifie si une date est valide
 */
export const isValidDate = (date: string | Date): boolean => {
    const d = new Date(date);
    return !isNaN(d.getTime());
};

/**
 * Vérifie si une date est dans le futur
 */
export const isFutureDate = (date: string | Date): boolean => {
    const d = new Date(date);
    const now = new Date();
    return isValidDate(date) && d > now;
};

/**
 * Vérifie si une valeur est vide (null, undefined, chaîne vide, tableau vide, objet vide)
 */
export const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

/**
 * Validation d'âge (18 ans minimum)
 */
export const isAdult = (birthDate: string | Date): boolean => {
    const today = new Date();
    const birth = new Date(birthDate);

    if (!isValidDate(birthDate)) return false;

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age >= 18;
};

/**
 * Vérifie si une chaîne est un identifiant Firebase valide
 */
export const isValidFirebaseId = (id: string): boolean => {
    // Les IDs Firebase sont généralement au format alphanumérique 
    // et ont une longueur spécifique
    return /^[a-zA-Z0-9]{20,}$/.test(id);
};

/**
 * Validation d'URL
 */
export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Vérifier si une valeur est du bon type
 */
export const validateType = (value: any, expectedType: string): boolean => {
    if (expectedType === 'array') return Array.isArray(value);
    if (expectedType === 'date') return isValidDate(value);
    return typeof value === expectedType;
};