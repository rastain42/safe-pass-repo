import { useState, useRef } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/config/firebase';
import { createTicketsForPurchase } from '@/services/events/tickets.service';
import { useUserProfile } from '@/hooks/users/useUserProfile';

export function useTicketPurchase(event: any | null) {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { userData } = useUserProfile();
  const [selectedTickets, setSelectedTickets] = useState<{
    [key: string]: number;
  }>({});
  const [showPayment, setShowPayment] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  // Calcule le montant total
  const totalAmount =
    event?.tickets?.reduce(
      (sum: number, ticket: any) => sum + (selectedTickets[ticket.id] || 0) * ticket.price,
      0
    ) || 0;

  // Prépare les données de tickets pour le processus de paiement
  const ticketsData =
    event?.tickets
      ?.filter((ticket: any) => (selectedTickets[ticket.id] || 0) > 0)
      ?.map((ticket: any) => ({
        id: ticket.id,
        name: ticket.name,
        price: ticket.price,
        quantity: selectedTickets[ticket.id] || 0,
        eventName: event.name,
      })) || [];

  const updateTicketQuantity = (ticketId: string, increment: boolean) => {
    setSelectedTickets(prev => {
      const currentQty = prev[ticketId] || 0;
      const newQty = increment ? currentQty + 1 : Math.max(0, currentQty - 1);
      const updatedTickets = { ...prev, [ticketId]: newQty };

      // Si on ajoute un ticket et que cela fera apparaître le bouton de paiement
      // Alors on scrolle vers le bas
      const hadTickets = Object.values(prev).some(qty => qty > 0);
      const hasTickets = Object.values(updatedTickets).some(qty => qty > 0);

      // Si on vient juste d'ajouter le premier ticket ou on a ajouté un ticket supplémentaire
      if (increment && ((!hadTickets && hasTickets) || hasTickets)) {
        // Utiliser setTimeout pour s'assurer que le rendu est fait avant de scroller
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
      }

      return updatedTickets;
    });
  };
  const handlePurchase = () => {
    if (!event || !auth.currentUser) {
      Alert.alert('Erreur', 'Veuillez vous connecter pour effectuer un achat.');
      return;
    } // Vérifier si l'événement exige une vérification d'identité
    // Par défaut, si allowUnverifiedUsers n'est pas défini, on considère que la vérification est requise
    if (event.allowUnverifiedUsers !== true) {
      const isVerified =
        userData?.verification?.verification_status === 'auto_approved' ||
        userData?.verification?.verification_status === 'verified' ||
        userData?.profile?.verified;

      if (!isVerified) {
        Alert.alert(
          'Vérification requise',
          "Cet événement nécessite une vérification d'identité. Veuillez vérifier votre identité dans votre profil avant d'acheter des billets.",
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Aller au profil',
              onPress: () => router.push('/(tabs)/Profile'),
            },
          ]
        );
        return;
      }
    }

    // Vérifier qu'au moins un billet est sélectionné
    const hasTickets = Object.values(selectedTickets).some(qty => qty > 0);
    if (!hasTickets) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un billet');
      return;
    }

    // Afficher l'écran de paiement
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!event) return;
    setProcessingPayment(true);
    try {
      const result = await createTicketsForPurchase(
        event.id,
        selectedTickets,
        event.tickets || [],
        paymentIntentId
      );

      // Réinitialiser les sélections après l'achat
      setSelectedTickets({});
      setShowPayment(false);

      // Déterminer le message en fonction du nombre de tickets achetés
      const ticketCount = result.purchasedTickets.length;
      const additionalMessage = ticketCount > 1 ? `et ${ticketCount - 1} autres billets` : '';

      // Naviguer vers le modal de confirmation
      router.push({
        pathname: '/screens/PurchaseConfirmationScreen',
        params: {
          eventName: result.firstEventName || event.name,
          ticketName: `${result.firstTicketName} ${additionalMessage}`,
          price: result.totalPrice.toString(),
          ticketCount: ticketCount.toString(),
        },
      });
    } catch (error) {
      console.error('Error creating tickets:', error);
      Alert.alert(
        'Erreur',
        'Le paiement a été accepté mais une erreur est survenue lors de la création des billets. Notre équipe a été notifiée.'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  return {
    selectedTickets,
    showPayment,
    processingPayment,
    totalAmount,
    ticketsData,
    scrollViewRef,
    updateTicketQuantity,
    handlePurchase,
    handlePaymentSuccess,
    handlePaymentCancel,
    setProcessingPayment,
  };
}
