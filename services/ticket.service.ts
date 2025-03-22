import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { TicketStatus } from "@/types/enum";
import { collection, query, where, getDocs } from "firebase/firestore";
import { UserTicket } from "@/types/tickets";
import { getCurrentUser } from "./user.service";

/**
 * Vérifie et valide un ticket
 */
export const validateTicket = async (ticketId: string) => {
  try {
    const ticketRef = doc(db, "user_tickets", ticketId);
    const ticketSnap = await getDoc(ticketRef);

    if (!ticketSnap.exists()) {
      return {
        success: false,
        type: "error",
        title: "Erreur",
        message: "Billet introuvable",
      };
    }

    const userTicket = ticketSnap.data();

    if (userTicket.status === TicketStatus.Used) {
      return {
        success: false,
        type: "warning",
        title: "Refusé",
        message: "Ce billet a déjà été scanné",
      };
    }

    // Mettre à jour le statut du ticket
    await updateDoc(ticketRef, {
      status: TicketStatus.Used,
      scannedAt: new Date().toISOString(),
    });

    return {
      success: true,
      type: "success",
      title: "Succès",
      message: "Billet validé avec succès",
    };
  } catch (error: any) {
    console.error("Erreur lors de la validation du ticket:", error);

    if (error.code === "permission-denied") {
      return {
        success: false,
        type: "error",
        title: "Accès refusé",
        message:
          "Vous n'avez pas les droits pour scanner ce billet. Vous devez être un organisateur.",
      };
    }

    return {
      success: false,
      type: "error",
      title: "Erreur",
      message: "Une erreur est survenue lors de la validation du billet",
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
        type: "error",
        title: "Erreur",
        message: "QR code invalide ou mal formaté",
      };
    }

    return {
      success: true,
      ticketId: ticketData.ticketId,
    };
  } catch (error) {
    console.error("Erreur de parsing JSON:", error);
    return {
      success: false,
      type: "error",
      title: "Erreur",
      message: "Format de QR code invalide",
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
      throw new Error("Utilisateur non connecté");
    }

    const ticketsRef = collection(db, "user_tickets");
    const q = query(ticketsRef, where("user_id", "==", user.uid));
    const querySnapshot = await getDocs(q);

    const userTickets: UserTicket[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      userTickets.push({
        ...data,
        id: doc.id,
        purchase_date: data.purchase_date?.toDate() || new Date(),
        created_at: data.created_at?.toDate() || new Date(),
      } as UserTicket);
    });

    return userTickets;
  } catch (error) {
    console.error("Erreur lors de la récupération des tickets:", error);
    throw error;
  }
};

/**
 * Récupère les détails d'un ticket spécifique
 */
export const getTicketDetails = async (
  ticketId: string
): Promise<UserTicket | null> => {
  // Implémentation pour récupérer un ticket spécifique
  // ...
  return null;
};
import { setDoc } from "firebase/firestore";
import { auth } from "@/firebase/config";

/**
 * Crée un ticket utilisateur après un achat
 */
export const createUserTicket = async (
  eventId: string,
  ticketPrice: number,
  paymentIntentId?: string
): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error("User not authenticated");
  }

  const userTicketsRef = collection(db, "user_tickets");
  const ticketId = doc(userTicketsRef).id;

  const userTicket: UserTicket = {
    id: ticketId,
    user_id: auth.currentUser.uid,
    event_id: eventId,
    purchase_date: new Date(),
    price: ticketPrice,
    qr_code: JSON.stringify({
      ticketId,
      eventId,
      userId: auth.currentUser.uid,
      timestamp: Date.now(),
    }),
    status: TicketStatus.Valid,
    created_at: new Date(),
    payment_intent_id: paymentIntentId,
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
      throw new Error("User not authenticated");
    }

    const userTicketsRef = collection(db, "user_tickets");
    let purchasedTickets: string[] = [];
    let firstEventName = "";
    let firstTicketName = "";
    let totalPrice = 0;

    // Créer un ticket pour chaque billet sélectionné
    for (const ticket of eventTickets) {
      const quantity = selectedTickets[ticket.id] || 0;

      if (quantity > 0) {
        // Garder les infos du premier ticket pour le modal de confirmation
        if (firstEventName === "") {
          firstEventName = ticket.eventName || "";
          firstTicketName = ticket.name;
        }

        totalPrice += ticket.price * quantity;

        for (let i = 0; i < quantity; i++) {
          const ticketId = await createUserTicket(
            eventId,
            ticket.price,
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
    console.error("Error creating tickets:", error);
    throw error;
  }
};
