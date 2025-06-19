import { useState, useEffect, useCallback } from 'react';
import { UserTicket } from '@/types/tickets';
import * as ticketService from '@/services/events/tickets.service';

export function useTickets(refreshParam?: string) {
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setError(null);
      const userTickets = await ticketService.fetchUserTickets();
      setTickets(userTickets);
    } catch (err: any) {
      setError(`Erreur: ${err.code || ''} - ${err.message || err}`);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  const handleTicketPress = (ticket: UserTicket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  // Rafraîchir la liste quand le paramètre refresh change
  useEffect(() => {
    if (refreshParam) {
      handleRefresh();
    }
  }, [refreshParam, handleRefresh]);

  useEffect(() => {
    const initialFetch = async () => {
      await fetchTickets();
      setLoading(false);
    };
    initialFetch();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    refreshing,
    error,
    selectedTicket,
    showTicketModal,
    handleRefresh,
    handleTicketPress,
    setShowTicketModal,
  };
}
