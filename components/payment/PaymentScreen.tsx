import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CardField, useStripe, useConfirmPayment } from '@stripe/stripe-react-native';
import { TouchableOpacity } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '@/firebase/config';

interface PaymentScreenProps {
  eventId: string;
  eventName: string;
  tickets: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  onCancel: () => void;
  onSuccess: (paymentIntentId: string) => void;
}

export default function PaymentScreen({
  eventId,
  eventName,
  tickets,
  totalAmount,
  onCancel,
  onSuccess
}: PaymentScreenProps) {
  const { confirmPayment } = useConfirmPayment();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handlePayPress = async () => {
    // Vérification facultative en développement, obligatoire en production
    if (!__DEV__ && !cardComplete) {
      Alert.alert("Paiement", "Veuillez remplir tous les champs de la carte");
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Erreur", "Vous devez être connecté pour effectuer un paiement");
      return;
    }

    setLoading(true);

    try {
      const functions = getFunctions();

      // CHANGEMENT: Utilisons toujours createPaymentIntent pour créer un vrai PaymentIntent
      const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');

      console.log("Création d'un PaymentIntent réel");

      // Appeler la Cloud Function pour créer un PaymentIntent
      const result = await createPaymentIntentFn({
        amount: totalAmount,
        eventId,
        tickets: tickets.map(t => ({
          ticketId: t.id,
          name: t.name,
          price: t.price,
          quantity: t.quantity
        }))
      });

      console.log("PaymentIntent créé:", result.data);
      const { clientSecret, paymentIntentId } = result.data as { clientSecret: string, paymentIntentId: string };

      if (!clientSecret) {
        throw new Error("Réponse invalide du serveur: clientSecret manquant");
      }

      console.log("Confirmation du paiement avec Stripe...");

      // CHANGEMENT: Toujours confirmer le paiement avec Stripe
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        console.error("Erreur de confirmation:", error);
        Alert.alert('Erreur', `Paiement échoué: ${error.message}`);
      } else if (paymentIntent) {
        console.log("Paiement réussi:", paymentIntent);
        // Paiement confirmé avec succès
        onSuccess(paymentIntentId);
      } else {
        // État indéterminé
        console.warn("État indéterminé après confirmation");
        Alert.alert(
          'Vérification',
          'Le statut du paiement est incertain. Veuillez vérifier votre compte pour confirmer.'
        );
      }
    } catch (e: any) {
      console.error("Erreur de paiement:", e);
      Alert.alert('Erreur', `Erreur de paiement: ${e.message || 'Une erreur inconnue est survenue'}`);
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = () => {
    if (__DEV__) {
      return true;
    }
    return cardComplete;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paiement</Text>
      <Text style={styles.subtitle}>Total: {totalAmount} €</Text>

      <View style={styles.eventDetails}>
        <Text style={styles.eventName}>{eventName}</Text>
        <Text style={styles.ticketsText}>
          {tickets.map(t => `${t.quantity}x ${t.name}`).join(', ')}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.cardLabel}>Informations de carte bancaire</Text>
        <CardField
          postalCodeEnabled={false}
          placeholders={{  // Garde placeholders au pluriel comme dans ton code original
            number: '4242 4242 4242 4242',
          }}
          cardStyle={{
            backgroundColor: '#222222',
            textColor: '#FFFFFF',
            placeholderColor: '#888888',
            borderWidth: 1,
            borderColor: '#333333',
            borderRadius: 8,
          }}
          style={{
            width: '100%',
            height: 50,
            marginVertical: 10,
          }}
          onCardChange={(cardDetails) => {
            console.log('Changement de carte:', cardDetails);
            setCardComplete(cardDetails.complete);
          }}
        />
        <Text style={styles.cardInfo}>
          Pour tester, utilisez: 4242 4242 4242 4242, date future, CVC 123
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.payButton, !isFormComplete() && styles.disabledButton]}
        onPress={handlePayPress}
        disabled={!isFormComplete() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Text style={styles.payButtonText}>Payer {totalAmount} €</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#111',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#0f0',
    marginBottom: 24,
  },
  eventDetails: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#0a0f0d',
    borderRadius: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  ticketsText: {
    fontSize: 14,
    color: '#aaa',
  },
  cardLabel: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 16,
  },
  cardContainer: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#222',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  cardInfo: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  payButton: {
    backgroundColor: '#0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#0a7a0a',
    opacity: 0.7,
  },
  payButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 14,
  }
});