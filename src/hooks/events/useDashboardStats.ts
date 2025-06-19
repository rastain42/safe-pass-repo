import { useState, useEffect } from "react";
import { auth } from "@/config/firebase";
import * as eventService from "@/services/events/event.service";
import { EventTicket } from "@/types/tickets";

interface EventStats {
  id: string;
  name: string;
  start_date: string;
  capacity: number;
  ticketsSold: number;
  revenue: number;
}

interface DashboardStats {
  totalEvents: number;
  totalTicketsSold: number;
  totalParticipants: number;
  totalRevenue: number;
  averageFillRate: number;
  averageTicketPrice: number;
  upcomingEvents: number;
  recentEvents: EventStats[];
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = async (): Promise<DashboardStats> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Utilisateur non authentifié");
    }

    try {
      // Récupérer tous les événements de l'organisateur
      const events = await eventService.getUserEvents(user.uid);

      let totalEvents = events.length;
      let totalTicketsSold = 0;
      let totalRevenue = 0;
      let totalCapacity = 0;
      let upcomingEvents = 0;

      const now = new Date();
      const recentEvents: EventStats[] = [];

      for (const event of events) {
        // Simulation temporaire des billets vendus (en attendant l'implémentation complète des UserTickets)
        const eventTicketsSold = Math.floor(
          Math.random() * Math.min(event.capacity / 2, 50)
        );
        const averageTicketPrice =
          event.tickets && event.tickets.length > 0
            ? event.tickets.reduce(
                (sum: number, ticket: EventTicket) => sum + ticket.price,
                0
              ) / event.tickets.length
            : 25;
        const eventRevenue = eventTicketsSold * averageTicketPrice;

        totalTicketsSold += eventTicketsSold;
        totalRevenue += eventRevenue;
        totalCapacity += event.capacity;

        // Vérifier si l'événement est à venir
        const eventDate = new Date(event.start_date);
        if (eventDate > now) {
          upcomingEvents++;
        }

        // Ajouter aux événements récents (limiter à 5)
        if (recentEvents.length < 5) {
          recentEvents.push({
            id: event.id,
            name: event.name,
            start_date: event.start_date.toString(),
            capacity: event.capacity,
            ticketsSold: eventTicketsSold,
            revenue: eventRevenue,
          });
        }
      }

      // Trier les événements récents par date (plus récents en premier)
      recentEvents.sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );

      return {
        totalEvents,
        totalTicketsSold,
        totalParticipants: totalTicketsSold,
        totalRevenue,
        averageFillRate:
          totalCapacity > 0 ? (totalTicketsSold / totalCapacity) * 100 : 0,
        averageTicketPrice:
          totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0,
        upcomingEvents,
        recentEvents,
      };
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques:", error);
      throw error;
    }
  };

  const refreshStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const newStats = await calculateStats();
      setStats(newStats);
    } catch (err) {
      console.error("Erreur lors du calcul des statistiques:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}
