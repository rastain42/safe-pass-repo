import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formate une date pour l'affichage
 */
export const formatEventDate = (date: Date): string => {
  return format(date, "PPP", { locale: fr });
};

/**
 * Formate l'heure pour l'affichage
 */
export const formatEventTime = (date: Date): string => {
  return format(date, "HH:mm", { locale: fr });
};

/**
 * Détermine si un événement est en cours
 */
export const isEventOngoing = (startDate: Date, endDate: Date): boolean => {
  const now = new Date();
  return now >= startDate && now <= endDate;
};

/**
 * Détermine si un événement est passé
 */
export const isEventPast = (endDate: Date): boolean => {
  return new Date() > endDate;
};

/**
 * Formate une date pour l'affichage avec heure
 */
export const formatEventDateTime = (date: Date): string => {
  return format(date, "dd MMM yyyy - HH:mm", { locale: fr });
};

/**
 * Formate un prix pour l'affichage
 */
export const formatPrice = (price: number): string => {
  return `${price}€`;
};
