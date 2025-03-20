import { getFunctions, httpsCallable } from "firebase/functions";
import { useStripe, useConfirmPayment } from '@stripe/stripe-react-native';
import { Event } from "@/types/event";

/**
 * Créer un PaymentIntent pour Stripe
 */
export const createPaymentIntent = async (
    amount: number,
    eventId: string,
    tickets: Array<{
        ticketId: string,
        name: string,
        price: number,
        quantity: number
    }>
): Promise<{ clientSecret: string, paymentIntentId: string }> => {
    try {
        const functions = getFunctions();
        const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');

        const result = await createPaymentIntentFn({
            amount,
            eventId,
            tickets
        });

        const { clientSecret, paymentIntentId } = result.data as {
            clientSecret: string,
            paymentIntentId: string
        };

        return { clientSecret, paymentIntentId };
    } catch (error) {
        console.error('Erreur lors de la création du PaymentIntent:', error);
        throw error;
    }
};

/**
 * Confirmer un paiement avec Stripe
 */
export const confirmPayment = async (
    clientSecret: string,
    confirmPaymentFn: any
): Promise<{ success: boolean, paymentIntent?: any, error?: any }> => {
    try {
        const { error, paymentIntent } = await confirmPaymentFn(clientSecret, {
            paymentMethodType: 'Card',
        });

        if (error) {
            return {
                success: false,
                error
            };
        } else if (paymentIntent) {
            return {
                success: true,
                paymentIntent
            };
        } else {
            return {
                success: false,
                error: new Error('État indéterminé après confirmation de paiement')
            };
        }
    } catch (error) {
        console.error('Erreur lors de la confirmation du paiement:', error);
        return {
            success: false,
            error
        };
    }
};

/**
 * Calculer le montant total d'une commande
 */
export const calculateOrderTotal = (
    event: Event,
    selectedTickets: { [key: string]: number }
): number => {
    return event.tickets.reduce((sum, ticket) => {
        const quantity = selectedTickets[ticket.id] || 0;
        return sum + (ticket.price * quantity);
    }, 0);
};