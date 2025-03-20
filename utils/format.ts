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
 * Formate un prix pour l'affichage
 */
export const formatPrice = (price: number): string => {
  return `${price.toFixed(2)} €`;
};
