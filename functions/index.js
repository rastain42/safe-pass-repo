const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(
  process.env.STRIPE_SECRET_KEY ||
    'sk_test_51QwQLRQWcv6PLtrYOq2YSKw3iMumohUa8ScamI9g9qXiZmlPPuCpX79sMIxyux2OVp5OIs7Nm7w8rnX6cNz5o1lX00PlVEkP29'
);
const analyzeDocument = require('./analyzeDocument');
const { compareFaces, evaluateSelfieQuality } = require('./compareFaces');
const { cleanupTempFiles } = require('./cleanupTempFiles');

admin.initializeApp();

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  // Vérification de l'authentification
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  try {
    // Code pour créer le PaymentIntent avec Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100),
      currency: 'eur',
      metadata: {
        userId: context.auth.uid,
        eventId: data.eventId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Stripe error:', error);
    throw new functions.https.HttpsError('internal', `Payment error: ${error.message}`);
  }
});

// Version de test pour le développement
exports.createTestPaymentIntentV2 = functions.https.onCall(async (data, context) => {
  // Simple authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  return {
    clientSecret: 'test_client_secret_' + Date.now(),
    paymentIntentId: 'test_pi_' + Date.now(),
  };
});

// Simple webhook endpoint
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  res.status(200).send({ received: true });
});

exports.analyzeIdentityDocument = analyzeDocument.analyzeIdentityDocument;
exports.compareFaces = compareFaces;
exports.evaluateSelfieQuality = evaluateSelfieQuality;
exports.cleanupTempFiles = cleanupTempFiles;
