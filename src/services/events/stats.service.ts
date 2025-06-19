import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UserTicket } from '@/types/tickets';

/**
 * Récupère les statistiques de vente pour un événement
 */
export const getEventSalesStats = async (eventId: string) => {
  try {
    const ticketsRef = collection(db, 'user_tickets');
    const ticketsQuery = query(ticketsRef, where('event_id', '==', eventId));
    const querySnapshot = await getDocs(ticketsQuery);

    const tickets: UserTicket[] = querySnapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as UserTicket
    );

    const totalSold = tickets.length;
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);

    return {
      totalSold,
      totalRevenue,
      tickets,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de vente:', error);
    return {
      totalSold: 0,
      totalRevenue: 0,
      tickets: [],
    };
  }
};

/**
 * Récupère les statistiques pour tous les événements d'un organisateur
 */
export const getOrganizerSalesStats = async (organizerId: string) => {
  try {
    // Récupérer tous les événements de l'organisateur
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(eventsRef, where('creatorId', '==', organizerId));
    const eventsSnapshot = await getDocs(eventsQuery);

    const eventIds = eventsSnapshot.docs.map(doc => doc.id);

    if (eventIds.length === 0) {
      return {
        totalSold: 0,
        totalRevenue: 0,
        eventStats: [],
      };
    }

    // Récupérer tous les billets vendus pour ces événements
    const ticketsRef = collection(db, 'user_tickets');
    const ticketsQuery = query(ticketsRef, where('event_id', 'in', eventIds));
    const ticketsSnapshot = await getDocs(ticketsQuery);

    const tickets: UserTicket[] = ticketsSnapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as UserTicket
    );

    // Grouper par événement
    const eventStats = eventIds.map(eventId => {
      const eventTickets = tickets.filter(ticket => ticket.eventId === eventId);
      return {
        eventId,
        totalSold: eventTickets.length,
        totalRevenue: eventTickets.reduce((sum, ticket) => sum + ticket.price, 0),
      };
    });

    return {
      totalSold: tickets.length,
      totalRevenue: tickets.reduce((sum, ticket) => sum + ticket.price, 0),
      eventStats,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques de l'organisateur:", error);
    return {
      totalSold: 0,
      totalRevenue: 0,
      eventStats: [],
    };
  }
};
