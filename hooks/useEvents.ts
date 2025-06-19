import { useState, useEffect, useCallback } from "react";
import { Event } from "@/types/event";
import * as eventService from "@/services/event.service";

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const fetchedEvents = await eventService.fetchAllEvents();

      // Filtrer les événements à venir et les trier par date de début (plus proches en premier)
      const now = new Date();
      const upcomingEvents = fetchedEvents
        .filter((event) => new Date(event.start_date) > now)
        .sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );

      setEvents(upcomingEvents);
    } catch (err) {
      console.error("Erreur dans useEvents:", err);
      setError("Impossible de charger les événements");
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  useEffect(() => {
    const initialFetch = async () => {
      await fetchEvents();
      setLoading(false);
    };
    initialFetch();
  }, [fetchEvents]);

  return {
    events,
    loading,
    refreshing,
    error,
    handleRefresh,
    fetchEvents,
  };
}
