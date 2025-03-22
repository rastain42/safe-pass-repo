import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

interface ContactRequest {
  email: string;
  message: string;
  createdAt: Date;
}

interface PhoneChangeRequest {
  email: string;
  oldPhone: string;
  newPhone: string;
  createdAt: Date;
}

/**
 * Envoie une demande d'assistance
 */
export const submitContactRequest = async (
  email: string,
  message: string
): Promise<boolean> => {
  try {
    const contactRequest: ContactRequest = {
      email,
      message,
      createdAt: new Date(),
    };

    await addDoc(collection(db, "support_requests"), contactRequest);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de la demande d'assistance", error);
    return false;
  }
};

/**
 * Soumet une demande de changement de numéro de téléphone
 */
export const submitPhoneChangeRequest = async (
  email: string,
  oldPhone: string,
  newPhone: string
): Promise<boolean> => {
  try {
    const phoneChangeRequest: PhoneChangeRequest = {
      email,
      oldPhone,
      newPhone,
      createdAt: new Date(),
    };

    await addDoc(collection(db, "phone_change_requests"), phoneChangeRequest);
    return true;
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de la demande de changement de numéro",
      error
    );
    return false;
  }
};
