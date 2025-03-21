import { useState } from "react";
import { useRouter } from "expo-router";
import { sendPasswordReset } from "@/services/auth.service";
import {
  submitContactRequest,
  submitPhoneChangeRequest,
} from "@/services/support.service";
import { validateEmail, validatePhoneNumber } from "@/utils/validators";

// Type pour gérer les différentes sections
export type SupportSection =
  | "menu"
  | "contact"
  | "phoneChange"
  | "passwordReset";

export function useSupport() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SupportSection>("menu");

  // États du formulaire de contact
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  // États pour le changement de numéro
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [oldPhoneNumber, setOldPhoneNumber] = useState("");

  // États pour la réinitialisation de mot de passe
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const goToSection = (section: SupportSection) => {
    setActiveSection(section);
  };

  const resetForms = () => {
    setSent(false);
    setResetSent(false);
  };

  const goToMenu = () => {
    goToSection("menu");
    resetForms();
  };

  const goBack = () => {
    router.back();
  };

  const handleSendContactRequest = async () => {
    if (!validateEmail(email)) {
      // À implémenter: alerte pour email invalide
      return;
    }

    try {
      // En développement, on simule une réponse d'API
      if (__DEV__) {
        setTimeout(() => {
          setSent(true);
        }, 1000);
        return;
      }

      const success = await submitContactRequest(email, message);
      if (success) {
        setSent(true);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande", error);
    }
  };

  const handlePhoneChangeRequest = async () => {
    if (
      !validateEmail(email) ||
      !validatePhoneNumber(oldPhoneNumber) ||
      !validatePhoneNumber(newPhoneNumber)
    ) {
      // À implémenter: alerte pour validation
      return;
    }

    try {
      // En développement, on simule une réponse d'API
      if (__DEV__) {
        setTimeout(() => {
          setSent(true);
        }, 1000);
        return;
      }

      const success = await submitPhoneChangeRequest(
        email,
        oldPhoneNumber,
        newPhoneNumber
      );
      if (success) {
        setSent(true);
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de la demande de changement de numéro",
        error
      );
    }
  };

  const handlePasswordReset = async () => {
    if (!validateEmail(resetEmail)) {
      // À implémenter: alerte pour email invalide
      return;
    }

    try {
      const success = await sendPasswordReset(resetEmail);
      if (success) {
        setResetSent(true);
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi du mail de réinitialisation",
        error
      );
    }
  };

  return {
    // États
    activeSection,
    email,
    setEmail,
    message,
    setMessage,
    sent,
    newPhoneNumber,
    setNewPhoneNumber,
    oldPhoneNumber,
    setOldPhoneNumber,
    resetEmail,
    setResetEmail,
    resetSent,

    // Actions
    goToSection,
    goToMenu,
    goBack,
    handleSendContactRequest,
    handlePhoneChangeRequest,
    handlePasswordReset,
  };
}
