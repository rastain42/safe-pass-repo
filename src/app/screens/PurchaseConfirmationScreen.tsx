import { StatusBar } from 'expo-status-bar';
import { Platform, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/basic/Themed';
import { Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { usePurchaseConfirmation } from '@/hooks/tickets/usePurchaseConfirmation';
import { confirmationStyles as styles } from '@/styles/confirmation.styles';

export default function PurchaseConfirmationScreen() {
  const {
    eventName,
    ticketName,
    formattedPrice,
    ticketCountText,
    confirmationMessage,
    handleViewTickets,
    handleClose,
  } = usePurchaseConfirmation();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Achat confirmé',
          presentation: 'modal',
          headerShown: false,
        }}
      />

      <View style={styles.confirmationCard}>
        <View style={styles.iconContainer}>
          <FontAwesome name='check-circle' size={80} color='#0f0' />
        </View>

        <Text style={styles.title}>Achat réussi !</Text>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailsLabel}>Événement :</Text>
          <Text style={styles.detailsValue}>{eventName}</Text>

          <Text style={styles.detailsLabel}>{ticketCountText} :</Text>
          <Text style={styles.detailsValue}>{ticketName}</Text>

          <Text style={styles.detailsLabel}>Montant total :</Text>
          <Text style={styles.detailsValue}>{formattedPrice}</Text>
        </View>

        <Text style={styles.message}>
          {confirmationMessage}
          Vous pouvez y accéder à tout moment dans la section "Mes Tickets".
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleViewTickets}>
          <FontAwesome name='ticket' size={16} color='#000' style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Voir mes tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
          <Text style={styles.secondaryButtonText}>Continuer l'exploration</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
