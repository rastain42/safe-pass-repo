/**
 * Formate les valeurs manquantes
 */
export const formatMissingValue = (value?: string | null): string => {
  return value || "Non renseigné";
};

/**
 * Formate le nom complet
 */
export const formatFullName = (
  firstName?: string,
  lastName?: string
): string => {
  if (!firstName && !lastName) return "Non renseigné";
  return `${firstName || ""} ${lastName || ""}`.trim();
};
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formate une date pour l'affichage
 */
export const formatDate = (date: Date): string => {
  return format(date, "d MMMM yyyy", { locale: fr });
};

/**
 * Formate l'heure pour l'affichage
 */
export const formatTime = (date: Date): string => {
  return format(date, "HH:mm", { locale: fr });
};

/**
 * Formate une date pour l'affichage avec heure
 */
export const formatEventDateTime = (date: Date): string => {
  return format(date, "dd MMM yyyy - HH:mm", { locale: fr });
};
/**
 * Ajoute un 's' conditionnel en fonction du nombre
 */
export const pluralize = (word: string, count: number): string => {
  return count > 1 ? `${word}s` : word;
};

/**
 * Formate un message concernant le nombre de billets
 */
export const getTicketCountMessage = (count: number): string => {
  if (count > 1) {
    return `Vos ${count} billets ont été ajoutés à votre compte.`;
  }
  return `Votre billet a été ajouté à votre compte.`;
};

/**
 * Formate un prix pour l'affichage
 * @param price Le prix à formater (nombre ou chaîne)
 * @param decimals Le nombre de décimales à afficher (par défaut 2)
 */
export const formatPrice = (
  price: string | number,
  decimals: number = 2
): string => {
  if (typeof price === "number") {
    return `${price.toFixed(decimals)} €`;
  }
  // Si c'est une chaîne, tenter de la convertir en nombre pour le formatage
  const numPrice = parseFloat(price);
  if (!isNaN(numPrice)) {
    return `${numPrice.toFixed(decimals)} €`;
  }
  // Si la conversion échoue, retourner la chaîne originale avec le symbole
  return `${price} €`;
};
