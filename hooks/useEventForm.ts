import { useState } from "react";
import { useForm } from "react-hook-form";
import { getAuth } from "firebase/auth";
import { router } from "expo-router";
import { AgeRestriction } from "@/types/enum";
import {
  createEvent,
  pickAndProcessImage,
  EventFormData,
} from "@/services/event.service";
import { useTicketManagement } from "./useTicketManagement";

export function useEventForm() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const {
    tickets,
    showTicketForm,
    currentTicket,
    setShowTicketForm,
    handleAddTicket,
    handleRemoveTicket,
    updateTicketField,
    resetTickets,
  } = useTicketManagement();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<EventFormData>({
    defaultValues: {
      name: "",
      description: "",
      location: "",
      start_date: new Date(),
      end_date: new Date(),
      capacity: 0,
      age_restriction: AgeRestriction.None,
      tickets: [],
    },
  });

  const start_date = watch("start_date");

  const openImagePicker = async () => {
    const uri = await pickAndProcessImage();
    if (uri) setImageUri(uri);
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);
      setSubmissionError(null);

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setSubmissionError("Utilisateur non connecté");
        return;
      }

      // Ajouter l'image et les tickets aux données du formulaire
      const formData = {
        ...data,
        image: imageUri || "../../assets/images/safepasslogoV1.png",
        tickets: tickets,
      };

      await createEvent(formData, user.uid);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      setSubmissionError(
        "Une erreur est survenue lors de la création de l'événement"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    reset();
    setImageUri(null);
    resetTickets();
    router.push("/(tabs)/Index");
  };

  return {
    // Form state and handlers
    control,
    errors,
    handleSubmit,
    onSubmit,
    watch,

    // Image state
    imageUri,
    openImagePicker,

    // Date pickers
    showStartPicker,
    setShowStartPicker,
    showEndPicker,
    setShowEndPicker,
    start_date,

    // Submission state
    showSuccessModal,
    isSubmitting,
    submissionError,
    handleCloseSuccessModal,

    // Ticket management
    tickets,
    showTicketForm,
    currentTicket,
    setShowTicketForm,
    handleAddTicket,
    handleRemoveTicket,
    updateTicketField,
  };
}
