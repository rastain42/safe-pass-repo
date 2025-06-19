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

/**
 * Navigue vers la page d'inscription
 */
export const navigateToRegister = () => {
  router.push("/Register");
};

/**
 * Navigue vers la page de support
 */
export const navigateToSupport = () => {
  router.push("/screens/SupportScreen");
};

/**
 * Navigue vers la page d'aide à la connexion
 */
export const navigateToLoginHelp = () => {
  router.push("/screens/SupportScreen");
};
/**
 * Navigue vers la liste des tickets avec un paramètre de rafraîchissement
 */
export const navigateToTicketList = () => {
  router.navigate({
    pathname: "/(tabs)/ticketlist",
    params: { refresh: Date.now().toString() }, // Timestamp pour forcer le refresh
  });
};
