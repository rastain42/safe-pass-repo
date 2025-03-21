import { useState } from "react";
import { Alert } from "react-native";
import { useConfirmPayment } from "@stripe/stripe-react-native";
import { createPaymentIntent } from "@/services/payment.service";
import { auth } from "@/firebase/config";

export function usePayment() {
  const { confirmPayment } = useConfirmPayment();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handlePayPress = async (
    totalAmount: number,
    eventId: string,
    tickets: any[],
    onSuccess: (paymentIntentId: string) => void
  ) => {
    if (!cardComplete) {
      Alert.alert("Paiement", "Veuillez remplir tous les champs de la carte");
      return;
    }

    if (!auth.currentUser) {
      Alert.alert(
        "Erreur",
        "Vous devez être connecté pour effectuer un paiement"
      );
      return;
    }

    setLoading(true);

    try {
      const { clientSecret, paymentIntentId } = await createPaymentIntent(
        totalAmount,
        eventId,
        tickets
      );

      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: "Card",
      });

      if (error) {
        console.error("Erreur de confirmation :", error);
        Alert.alert("Erreur", `Paiement échoué : ${error.message}`);
      } else if (paymentIntent) {
        console.log("Paiement réussi :", paymentIntent);
        onSuccess(paymentIntentId);
      } else {
        Alert.alert(
          "Vérification",
          "Le statut du paiement est incertain. Veuillez vérifier votre compte pour confirmer."
        );
      }
    } catch (e: any) {
      console.error("Erreur de paiement :", e);
      Alert.alert(
        "Erreur",
        `Erreur de paiement : ${
          e.message || "Une erreur inconnue est survenue"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    cardComplete,
    setCardComplete,
    handlePayPress,
  };
}
