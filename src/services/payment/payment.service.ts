// Service de paiement avec Stripe (placeholder)
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
}

export const createPaymentIntent = async (
  amount: number,
  currency: string = 'eur'
): Promise<PaymentIntent> => {
  // Placeholder - à implémenter avec Stripe
  const paymentIntentId = `pi_${Date.now()}`;
  return {
    id: paymentIntentId,
    clientSecret: `${paymentIntentId}_secret_${Date.now()}`,
    paymentIntentId: paymentIntentId,
    amount,
    currency,
    status: 'pending',
  };
};

export const confirmPayment = async (paymentIntentId: string): Promise<boolean> => {
  // Placeholder - à implémenter avec Stripe
  return true;
};
