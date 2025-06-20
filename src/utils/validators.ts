/**
 * Valide un email
 */
export const validateEmail = (email: string): boolean => {
  // Regex plus stricte qui autorise les caractères courants mais pas les points consécutifs
  const emailRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

  // Vérifications supplémentaires
  if (!email || email.length === 0) return false;
  if (email.includes('..')) return false; // Pas de points consécutifs
  if (email.startsWith('.') || email.endsWith('.')) return false; // Pas de point au début/fin
  if (email.includes(' ')) return false; // Pas d'espaces

  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone français
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Regex basique pour valider un numéro français (peut être améliorée)
  const phoneRegex = /^(0|\+33)[1-9](\d{2}){4}$/;
  // Supprimer les espaces pour la validation
  const cleanPhone = phone.replace(/\s/g, '');
  return phoneRegex.test(cleanPhone);
};
