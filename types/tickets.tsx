import { TicketStatus } from "./enum";

export interface EventTicket {
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
}

export interface UserTicket {
    id: string;           // SERIAL (PK)
    user_id: string;      // FK vers l'utilisateur
    event_id: string;     // FK vers l'événement
    purchase_date: Date;  // Date d'achat
    price: number;        // Prix payé
    qr_code: string;      // QR code généré
    status: TicketStatus; // État du ticket
    created_at: Date;     // Date de création
    payment_intent_id?: string; // Added property

}

