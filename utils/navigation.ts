import { router } from "expo-router";

/**
 * Navigue vers les détails d'un événement
 */
export const navigateToEventDetails = (eventId: string) => {
  router.push({
    pathname: "/screens/EventDetails",
    params: { id: eventId },
  });
};

/**
 * Revient à la page précédente
 */
export const goBack = () => {
  router.back();
};
