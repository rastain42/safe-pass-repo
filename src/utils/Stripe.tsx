import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

type PaymentData = {
  amount: number;
  currency?: string;
};

export const createPaymentIntent = functions.https.onCall(async request => {
  try {
    const { amount, currency = 'eur' } = request.data as PaymentData;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe utilise les centimes
      currency,
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create payment intent');
  }
});
