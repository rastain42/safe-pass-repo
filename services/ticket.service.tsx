import { collection, query, where, getDocs, addDoc, getDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { UserTicket } from '@/types/tickets';
import { TicketStatus } from '@/types/enum';

/**
 * Récupérer tous les tickets d'un utilisateur
 */
export const getUserTickets = async (userId: string): Promise<UserTicket[]> => {
    try {
        const ticketsRef = collection(db, 'user_tickets');
        const q = query(ticketsRef, where('user_id', '==', userId));
        const querySnapshot = await getDocs(q);

        const tickets: UserTicket[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Convertir les timestamps en objets Date
            const purchaseDate = data.purchase_date?.toDate?.() || new Date(data.purchase_date);
            const createdAt = data.created_at?.toDate?.() || new Date(data.created_at);

            tickets.push({
                ...data,
                id: doc.id,
                purchase_date: purchaseDate,
                created_at: createdAt
            } as UserTicket);
        });

        return tickets;
    } catch (error) {
        console.error('Erreur lors de la récupération des tickets:', error);
        throw error;
    }
};

/**
 * Récupérer un ticket par son ID
 */
export const getTicketById = async (ticketId: string): Promise<UserTicket | null> => {
    try {
        const ticketDoc = await getDoc(doc(db, 'user_tickets', ticketId));

        if (!ticketDoc.exists()) {
            return null;
        }

        const data = ticketDoc.data();

        // Convertir les timestamps en objets Date
        const purchaseDate = data.purchase_date?.toDate?.() || new Date(data.purchase_date);
        const createdAt = data.created_at?.toDate?.() || new Date(data.created_at);

        return {
            ...data,
            id: ticketDoc.id,
            purchase_date: purchaseDate,
            created_at: createdAt
        } as UserTicket;
    } catch (error) {
        console.error('Erreur lors de la récupération du ticket:', error);
        throw error;
    }
};

/**
 * Créer plusieurs tickets pour un achat
 */
export const createTickets = async (
    userId: string,
    eventId: string,
    ticketsData: Array<{ price: number, quantity: number }>,
    paymentIntentId?: string
): Promise<string[]> => {
    try {
        const userTicketsRef = collection(db, 'user_tickets');
        const ticketIds: string[] = [];

        for (const ticketData of ticketsData) {
            const { price, quantity } = ticketData;

            for (let i = 0; i < quantity; i++) {
                // Créer le QR code
                const ticketId = doc(userTicketsRef).id;
                const qrCode = JSON.stringify({
                    ticketId,
                    eventId,
                    userId,
                    timestamp: Date.now()
                });

                // Créer le ticket
                const userTicket: Partial<UserTicket> = {
                    id: ticketId,
                    user_id: userId,
                    event_id: eventId,
                    purchase_date: new Date(),
                    price,
                    qr_code: qrCode,
                    status: TicketStatus.Valid,
                    created_at: new Date(),
                };

                // Ajouter le paymentIntentId s'il existe
                if (paymentIntentId) {
                    userTicket.payment_intent_id = paymentIntentId;
                }

                // Enregistrer dans Firestore
                await addDoc(userTicketsRef, userTicket);

                ticketIds.push(ticketId);
            }
        }

        return ticketIds;
    } catch (error) {
        console.error('Erreur lors de la création des tickets:', error);
        throw error;
    }
};

/**
 * Valider un ticket (utilisation)
 */
export const validateTicket = async (ticketId: string): Promise<boolean> => {
    try {
        const ticketRef = doc(db, 'user_tickets', ticketId);
        const ticketDoc = await getDoc(ticketRef);

        if (!ticketDoc.exists()) {
            return false;
        }

        const ticketData = ticketDoc.data();

        // Vérifier si le ticket est déjà utilisé
        if (ticketData.status === TicketStatus.Used) {
            return false;
        }

        // Mettre à jour le statut et ajouter la date de validation
        await updateDoc(ticketRef, {
            status: TicketStatus.Used,
            validation_date: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Erreur lors de la validation du ticket:', error);
        return false;
    }
};

/**
 * Récupérer les tickets pour un événement spécifique
 */
export const getTicketsForEvent = async (eventId: string, userId: string): Promise<UserTicket[]> => {
    try {
        const ticketsRef = collection(db, 'user_tickets');
        const q = query(
            ticketsRef,
            where('event_id', '==', eventId),
            where('user_id', '==', userId)
        );

        const querySnapshot = await getDocs(q);

        const tickets: UserTicket[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Convertir les timestamps en objets Date
            const purchaseDate = data.purchase_date?.toDate?.() || new Date(data.purchase_date);
            const createdAt = data.created_at?.toDate?.() || new Date(data.created_at);

            tickets.push({
                ...data,
                id: doc.id,
                purchase_date: purchaseDate,
                created_at: createdAt
            } as UserTicket);
        });

        return tickets;
    } catch (error) {
        console.error('Erreur lors de la récupération des tickets:', error);
        throw error;
    }
};