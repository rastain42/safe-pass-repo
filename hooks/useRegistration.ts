import { useState, useRef } from "react";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { Router } from "expo-router";
import { Animated } from "react-native";
import * as authService from "../services/auth.service";

export function useRegistration(router: Router) {
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal | null>(null);

  // Animation pour les transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // États pour l'authentification téléphonique
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState("non_verified");

  // États pour le formulaire d'inscription
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [role, setRole] = useState("participant");

  // États pour l'UI
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fonction d'animation pour transitions douces
  const fadeOut = () => {
    return new Promise<void>((resolve) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => resolve());
    });
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleSupportRequest = () => {
    router.push("/screens/SupportScreen");
  };

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      setError("Veuillez entrer un numéro de téléphone");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Vérifier si le numéro existe déjà
      const exists = await authService.checkPhoneNumberExists(phoneNumber);
      if (exists) {
        setError("Ce numéro de téléphone est déjà utilisé");
        return;
      }

      const { verificationId: vId, formattedPhone } =
        await authService.sendVerificationCode(
          phoneNumber,
          recaptchaVerifier.current
        );

      setVerificationId(vId);

      // Attendre que fadeOut se termine
      await fadeOut();
      setIsCodeSent(true);
      fadeIn();
      setError(null);
    } catch (err: any) {
      console.error("Erreur lors de l'envoi du code:", err);

      if (err.code === "auth/invalid-phone-number") {
        setError("Numéro de téléphone invalide");
      } else if (err.code === "auth/network-request-failed") {
        setError(`Erreur réseau. Vérifiez votre connexion Internet.`);
      } else {
        setError(`Erreur: ${err.message || "Veuillez réessayer"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError("Veuillez entrer le code de vérification");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { userId, phoneNumber: phone } =
        await authService.verifyCodeForRegistration(
          verificationId,
          verificationCode
        );

      setVerifiedStatus("verified");

      // Sauvegarder le numéro de téléphone vérifié
      await authService.saveVerifiedPhone(
        phone || authService.formatPhoneNumber(phoneNumber)
      );

      // Animation de transition
      await fadeOut();

      // Une fois que l'animation de fondu est terminée, on change l'état
      setShowRegisterForm(true);

      // Retard avant de réactiver le formulaire pour éviter les problèmes de rendu
      setTimeout(() => {
        fadeIn();
      }, 300);
    } catch (err: any) {
      console.error("Erreur de vérification:", err);
      setError(
        err.code === "auth/invalid-verification-code"
          ? "Code de vérification incorrect"
          : "Erreur de vérification : " + (err.message || "Veuillez réessayer")
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    // Vérifier l'email
    if (!email.trim()) {
      setError("Veuillez entrer une adresse email");
      return false;
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format d'email invalide");
      return false;
    }

    // Vérifier si l'email existe déjà
    const emailExists = await authService.checkEmailExists(email);
    if (emailExists) {
      setError("Cette adresse email est déjà utilisée");
      return false;
    }

    // Valider le mot de passe
    if (!authService.validatePassword(password)) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial"
      );
      return false;
    }

    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return false;
    }

    // Vérifier le prénom et le nom
    if (!firstName || firstName.length < 2) {
      setError("Veuillez entrer un prénom valide (au moins 2 caractères)");
      return false;
    }

    if (!lastName || lastName.length < 2) {
      setError("Veuillez entrer un nom valide (au moins 2 caractères)");
      return false;
    }

    // Vérifier la date de naissance
    if (!birthDate) {
      setError("Veuillez sélectionner votre date de naissance");
      return false;
    }

    return true;
  };

  const handleRegisterUser = async () => {
    try {
      // Valider le formulaire
      const isValid = await validateForm();
      if (!isValid) {
        return;
      }

      setLoading(true);

      await authService.registerUser({
        email,
        password,
        firstName,
        lastName,
        birthDate,
        role,
      });

      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement:", err);
      setError(
        "Erreur lors de l'enregistrement : " +
          (err.message || "Veuillez réessayer")
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (loading) return;
    setLoading(true);
    await fadeOut();
    setIsCodeSent(false);
    setVerificationCode("");
    setError(null);
    fadeIn();
    setLoading(false);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.replace("/(tabs)/Index");
  };

  return {
    // États
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    birthDate,
    setBirthDate,
    role,
    setRole,
    isCodeSent,
    showRegisterForm,
    error,
    loading,
    isDatePickerVisible,
    showSuccessModal,
    fadeAnim,
    recaptchaVerifier,

    // Méthodes
    handleSendVerificationCode,
    handleVerifyCode,
    handleRegisterUser,
    reset,
    handleSupportRequest,
    setDatePickerVisibility,
    handleCloseSuccessModal,
  };
}
