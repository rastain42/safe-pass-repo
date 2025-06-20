import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { UserTicket } from '@/types/tickets';
import { PaymentStatus } from '@/types/shared';
import { getCurrentUser } from '../users/user.service';

/**
 * Vérifie et valide un ticket
 */
export const validateTicket = async (ticketId: string) => {
  try {
    const ticketRef = doc(db, 'user_tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);

    if (!ticketSnap.exists()) {
      return {
        success: false,
        type: 'error',
        title: 'Erreur',
        message: 'Billet introuvable',
      };
    }

    const userTicket = ticketSnap.data();

    if (userTicket.status === 'used') {
      return {
        success: false,
        type: 'warning',
        title: 'Refusé',
        message: 'Ce billet a déjà été scanné',
      };
    }

    // Mettre à jour le statut du ticket
    await updateDoc(ticketRef, {
      status: 'used',
      scannedAt: new Date().toISOString(),
    });

    return {
      success: true,
      type: 'success',
      title: 'Succès',
      message: 'Billet validé avec succès',
    };
  } catch (error: any) {
    console.error('Erreur lors de la validation du ticket:', error);

    if (error.code === 'permission-denied') {
      return {
        success: false,
        type: 'error',
        title: 'Accès refusé',
        message:
          "Vous n'avez pas les droits pour scanner ce billet. Vous devez être un organisateur.",
      };
    }

    return {
      success: false,
      type: 'error',
      title: 'Erreur',
      message: 'Une erreur est survenue lors de la validation du billet',
    };
  }
};

/**
 * Parse un QR code de ticket
 */
export const parseTicketQrCode = (data: string) => {
  try {
    const ticketData = JSON.parse(data);

    if (!ticketData || !ticketData.ticketId) {
      return {
        success: false,
        type: 'error',
        title: 'Erreur',
        message: 'QR code invalide ou mal formaté',
      };
    }

    return {
      success: true,
      ticketId: ticketData.ticketId,
    };
  } catch (error) {
    console.error('Erreur de parsing JSON:', error);
    return {
      success: false,
      type: 'error',
      title: 'Erreur',
      message: 'Format de QR code invalide',
    };
  }
};

/**
 * Récupère les billets de l'utilisateur connecté
 */
export const fetchUserTickets = async (): Promise<UserTicket[]> => {
  try {
    const user = getCurrentUser();

    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const ticketsRef = collection(db, 'user_tickets');
    const q = query(ticketsRef, where('user_id', '==', (await user)?.id));
    const querySnapshot = await getDocs(q);
    const userTickets: UserTicket[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();

      // Conversion sécurisée vers UserTicket avec des valeurs par défaut
      const userTicket: UserTicket = {
        id: doc.id,
        eventId: data.eventId || '',
        eventName: data.eventName || 'Événement inconnu',
        ticketTypeId: data.ticketTypeId || '',
        ticketTypeName: data.ticketTypeName || 'Ticket standard',
        userId: data.userId || '',
        quantity: data.quantity || 1,
        price: data.price || 0,
        totalPrice: data.totalPrice || data.price || 0,
        qrCode: data.qrCode || '',
        purchaseDate: data.purchase_date?.toDate() || data.purchaseDate || new Date(),
        status: data.status || 'valid',
        paymentStatus: data.paymentStatus || 'completed',
        metadata: data.metadata || undefined,
      };

      userTickets.push(userTicket);
    });

    return userTickets;
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error);
    throw error;
  }
};

/**
 * Récupère les détails d'un ticket spécifique
 */
export const getTicketDetails = async (ticketId: string): Promise<UserTicket | null> => {
  // Implémentation pour récupérer un ticket spécifique
  // ...
  return null;
};

/**
 * Crée un ticket utilisateur après un achat
 */
export const createUserTicket = async (
  eventId: string,
  eventName: string,
  ticketTypeId: string,
  ticketTypeName: string,
  quantity: number,
  ticketPrice: number,
  totalPrice: number,
  paymentIntentId?: string
): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  const userTicketsRef = collection(db, 'user_tickets');
  const ticketId = doc(userTicketsRef).id;

  const userTicket: UserTicket = {
    id: ticketId,
    userId: auth.currentUser.uid,
    eventId: eventId,
    eventName: eventName,
    ticketTypeId: ticketTypeId,
    ticketTypeName: ticketTypeName,
    quantity: quantity,
    purchaseDate: new Date(),
    price: ticketPrice,
    totalPrice: totalPrice,
    qrCode: JSON.stringify({
      ticketId,
      eventId,
      userId: auth.currentUser.uid,
      timestamp: Date.now(),
    }),
    status: 'valid',
    paymentStatus: PaymentStatus.Completed,
  };

  await setDoc(doc(userTicketsRef, ticketId), userTicket);
  return ticketId;
};

/**
 * Crée plusieurs tickets pour un achat
 */
export const createTicketsForPurchase = async (
  eventId: string,
  selectedTickets: { [key: string]: number },
  eventTickets: any[],
  paymentIntentId?: string
): Promise<{
  purchasedTickets: string[];
  firstEventName: string;
  firstTicketName: string;
  totalPrice: number;
}> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    let purchasedTickets: string[] = [];
    let firstEventName = '';
    let firstTicketName = '';
    let totalPrice = 0;

    // Créer un ticket pour chaque billet sélectionné
    for (const ticket of eventTickets) {
      const quantity = selectedTickets[ticket.id] || 0;

      if (quantity > 0) {
        // Garder les infos du premier ticket pour le modal de confirmation
        if (firstEventName === '') {
          firstEventName = ticket.eventName || '';
          firstTicketName = ticket.name;
        }

        totalPrice += ticket.price * quantity;

        for (let i = 0; i < quantity; i++) {
          const ticketId = await createUserTicket(
            eventId,
            'Event Name', // TODO: récupérer le vrai nom de l'événement
            ticket.id,
            ticket.name,
            quantity,
            ticket.price,
            ticket.price * quantity,
            paymentIntentId
          );
          purchasedTickets.push(ticketId);
        }
      }
    }

    return {
      purchasedTickets,
      firstEventName,
      firstTicketName,
      totalPrice,
    };
  } catch (error) {
    console.error('Error creating tickets:', error);
    throw error;
  }
};
