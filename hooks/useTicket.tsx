import { useState, useEffect, useCallback, useMemo } from 'react';
import { auth } from '@/firebase/config';
import {
    getUserTickets,
    getTicketById,
    createTickets,
    validateTicket as validateTicketService,
    getTicketsForEvent
} from '@/services/ticket.service';
import { UserTicket } from '@/types/tickets';
import { TicketStatus } from '@/types/enum';

interface UseTicketsOptions {
    autoLoad?: boolean;
    eventId?: string;
}

export const useTickets = (options: UseTicketsOptions = {}) => {
    const { autoLoad = true, eventId } = options;

    // États
    const [tickets, setTickets] = useState<UserTicket[]>([]);
    const [currentTicket, setCurrentTicket] = useState<UserTicket | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingTicket, setLoadingTicket] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [validatingTicket, setValidatingTicket] = useState<boolean>(false);

    /**
     * Charger tous les tickets de l'utilisateur actuel
     */
    const loadUserTickets = useCallback(async (showLoading = true) => {
        if (!auth.currentUser) {
            setError('Utilisateur non authentifié');
            return;
        }

        try {
            if (showLoading) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            setError(null);

            let userTickets: UserTicket[];

            // Si on filtre par événement
            if (eventId) {
                userTickets = await getTicketsForEvent(eventId, auth.currentUser.uid);
            } else {
                userTickets = await getUserTickets(auth.currentUser.uid);
            }

            // Tri par date d'achat (plus récent d'abord)
            userTickets.sort((a, b) => b.purchase_date.getTime() - a.purchase_date.getTime());

            setTickets(userTickets);
        } catch (err) {
            console.error('Erreur lors du chargement des tickets:', err);
            setError('Impossible de récupérer vos tickets. Veuillez réessayer.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [eventId]);

    /**
     * Charger un ticket spécifique par son ID
     */
    const loadTicketById = useCallback(async (ticketId: string) => {
        try {
            setLoadingTicket(true);
            setError(null);

            const ticket = await getTicketById(ticketId);
            if (ticket) {
                setCurrentTicket(ticket);
            } else {
                setError('Ticket introuvable');
                setCurrentTicket(null);
            }
        } catch (err) {
            console.error('Erreur lors du chargement du ticket:', err);
            setError('Impossible de récupérer ce ticket. Veuillez réessayer.');
            setCurrentTicket(null);
        } finally {
            setLoadingTicket(false);
        }
    }, []);

    /**
     * Rafraîchir la liste des tickets
     */
    const refreshTickets = useCallback(() => {
        return loadUserTickets(false);
    }, [loadUserTickets]);

    /**
     * Acheter des tickets
     */
    const purchaseTickets = useCallback(async (
        eventId: string,
        ticketsData: Array<{ price: number, quantity: number }>,
        paymentIntentId?: string
    ): Promise<string[]> => {
        if (!auth.currentUser) {
            throw new Error('Utilisateur non authentifié');
        }

        try {
            setLoading(true);
            setError(null);

            const ticketIds = await createTickets(
                auth.currentUser.uid,
                eventId,
                ticketsData,
                paymentIntentId
            );

            // Rafraîchir la liste après l'achat
            await loadUserTickets(false);

            return ticketIds;
        } catch (err) {
            console.error('Erreur lors de l\'achat des tickets:', err);
            const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'achat';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadUserTickets]);


    /**
     * Valider un ticket (utilisation)
     */
    const validateTicket = useCallback(async (ticketId: string): Promise<boolean> => {
        try {
            setValidatingTicket(true);
            setError(null);

            const success = await validateTicketService(ticketId);

            if (success) {
                // Créer la date de validation
                const now = new Date();

                // Mettre à jour le statut dans la liste locale
                setTickets(prevTickets =>
                    prevTickets.map(ticket =>
                        ticket.id === ticketId
                            ? { ...ticket, status: TicketStatus.Used, validation_date: now }
                            : ticket
                    )
                );

                // Mettre à jour le ticket actuel s'il est sélectionné
                if (currentTicket?.id === ticketId) {
                    setCurrentTicket({
                        ...currentTicket,
                        status: TicketStatus.Used,
                        validation_date: now
                    });
                }
            } else {
                setError('Impossible de valider ce ticket. Il est peut-être déjà utilisé ou invalide.');
            }

            return success;
        } catch (err) {
            console.error('Erreur lors de la validation du ticket:', err);
            setError('Une erreur est survenue lors de la validation du ticket');
            return false;
        } finally {
            setValidatingTicket(false);
        }
    }, [currentTicket]);

    /**
     * Chercher un ticket par son ID dans la liste actuelle
     */
    const findTicketInList = useCallback((ticketId: string): UserTicket | undefined => {
        return tickets.find(ticket => ticket.id === ticketId);
    }, [tickets]);

    // Filtres mémorisés pour la liste des tickets
    const filteredTickets = useMemo(() => {
        return {
            // Tickets valides
            valid: tickets.filter(ticket => ticket.status === TicketStatus.Valid),

            // Tickets utilisés
            used: tickets.filter(ticket => ticket.status === TicketStatus.Used),

            // Groupés par événement
            byEvent: tickets.reduce<Record<string, UserTicket[]>>((acc, ticket) => {
                if (!acc[ticket.event_id]) {
                    acc[ticket.event_id] = [];
                }
                acc[ticket.event_id].push(ticket);
                return acc;
            }, {}),
        };
    }, [tickets]);

    // Charger automatiquement les tickets au chargement
    useEffect(() => {
        if (autoLoad) {
            loadUserTickets();
        }
    }, [autoLoad, loadUserTickets]);

    return {
        // États
        tickets,
        filteredTickets,
        currentTicket,
        loading,
        loadingTicket,
        error,
        refreshing,
        validatingTicket,

        // Actions
        loadUserTickets,
        refreshTickets,
        loadTicketById,
        purchaseTickets,
        validateTicket,
        findTicketInList,
        setCurrentTicket,
    };
};

export default useTickets;