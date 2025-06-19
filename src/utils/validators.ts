/**
 * Valide un email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone français
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Regex basique pour valider un numéro français (peut être améliorée)
  const phoneRegex = /^(0|\+33)[1-9](\d{2}){4}$/;
  // Supprimer les espaces pour la validation
  const cleanPhone = phone.replace(/\s/g, "");
  return phoneRegex.test(cleanPhone);
};
