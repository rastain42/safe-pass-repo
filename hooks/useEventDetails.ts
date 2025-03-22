import { useState, useEffect, useCallback } from "react";
import { fetchEventById } from "@/services/event.service";
import { Event } from "@/types/event";

export function useEventDetails(eventId: string | null) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadEventDetails = useCallback(async () => {
    if (!eventId) {
      setError("Aucun ID d'événement fourni");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const eventData = await fetchEventById(eventId);
      setEvent(eventData);
    } catch (err: any) {
      console.error(
        "Erreur lors de la récupération des détails de l'événement :",
        err
      );
      setError(
        err.message || "Impossible de charger les détails de l'événement"
      );
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEventDetails();
  }, [loadEventDetails]);

  // Extraire les propriétés nécessaires pour simplifier l'utilisation
  const eventName = event?.name || "Nom de l'événement non disponible";
  const eventStartDate = event?.start_date || null;

  return {
    eventName,
    eventStartDate,
    loading,
    error,
    reload: loadEventDetails,
  };
}
