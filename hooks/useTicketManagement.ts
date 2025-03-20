import { useState } from "react";
import { EventTicket } from "@/types/tickets";

export function useTicketManagement() {
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<EventTicket>({
    id: "",
    name: "",
    price: null as unknown as number,
    quantity: null as unknown as number,
    description: "",
  });

  const handleAddTicket = () => {
    if (
      !currentTicket.name ||
      !currentTicket.price ||
      !currentTicket.quantity
    ) {
      return; // On pourrait ajouter une validation et gestion d'erreur ici
    }

    setTickets([
      ...tickets,
      {
        ...currentTicket,
        id: Date.now().toString(),
        price: currentTicket.price || 0,
        quantity: currentTicket.quantity || 0,
      },
    ]);

    // Réinitialiser le formulaire de ticket
    setCurrentTicket({
      id: "",
      name: "",
      price: null as unknown as number,
      quantity: null as unknown as number,
      description: "",
    });
    setShowTicketForm(false);
  };

  const handleRemoveTicket = (ticketId: string) => {
    setTickets(tickets.filter((t) => t.id !== ticketId));
  };

  const updateTicketField = (field: keyof EventTicket, value: any) => {
    setCurrentTicket({
      ...currentTicket,
      [field]: value,
    });
  };

  return {
    tickets,
    showTicketForm,
    currentTicket,
    setShowTicketForm,
    handleAddTicket,
    handleRemoveTicket,
    updateTicketField,
    resetTickets: () => setTickets([]),
  };
}
