import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { CardField } from '@stripe/stripe-react-native';
import { usePayment } from '@/hooks/payment/usePayment';

interface PaymentScreenProps {
  eventId: string;
  eventName: string;
  tickets: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
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
  onSuccess,
}: PaymentScreenProps) {
  const { loading, cardComplete, setCardComplete, handlePayPress } = usePayment();

  const isFormComplete = () => cardComplete;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paiement</Text>
      <Text style={styles.subtitle}>Total : {totalAmount} €</Text>

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
          placeholders={{
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
          onCardChange={cardDetails => setCardComplete(cardDetails.complete)}
        />
        <Text style={styles.cardInfo}>
          Pour tester, utilisez : 4242 4242 4242 4242, date future, CVC 123
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.payButton, !isFormComplete() && styles.disabledButton]}
        onPress={() => handlePayPress(totalAmount, eventId, tickets, onSuccess)}
        disabled={!isFormComplete() || loading}
      >
        {loading ? (
          <ActivityIndicator color='#000' size='small' />
        ) : (
          <Text style={styles.payButtonText}>Payer {totalAmount} €</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={loading}>
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
  },
});
