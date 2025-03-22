import { useState, useRef } from "react";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { useRouter } from "expo-router";
import * as authService from "../services/auth.service";

export function useAuth() {
  const router = useRouter();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal | null>(null);

  // Variables d'état
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formattedPhone, setFormattedPhone] = useState("");

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      setError("Veuillez entrer un numéro de téléphone");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { verificationId: vId, formattedPhone: fPhone } =
        await authService.sendVerificationCode(
          phoneNumber,
          recaptchaVerifier.current
        );

      setVerificationId(vId);
      setFormattedPhone(fPhone);
      setIsCodeSent(true);
    } catch (err: any) {
      console.error("Erreur lors de l'envoi du code:", err);
      setError(
        "Erreur lors de l'envoi du code : " +
          (err.message || "Veuillez réessayer")
      );
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

      const { userId: uid, phoneNumber: phone } = await authService.verifyCode(
        verificationId,
        verificationCode
      );

      setUserId(uid);
      setIsCodeVerified(true);

      // Sauvegarder le téléphone vérifié
      await authService.saveVerifiedPhone(phone || formattedPhone);
    } catch (err: any) {
      console.error("Erreur lors de la vérification du code:", err);
      setError(err.message || "Code de vérification incorrect");

      if (err.message?.includes("pas enregistré")) {
        setIsCodeSent(false); // Retour à l'étape du numéro de téléphone
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!userId) {
      setError("Erreur d'authentification");
      return;
    }

    if (!password.trim()) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await authService.authenticateWithPassword(userId, password);

      // Connexion réussie
      router.replace("/(tabs)/Index");
    } catch (err: any) {
      console.error("Erreur d'authentification:", err);
      setError(err.message || "Erreur d'authentification : Veuillez réessayer");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setIsCodeSent(false);
    setVerificationCode("");
    setError(null);
  };

  return {
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    password,
    setPassword,
    isCodeSent,
    isCodeVerified,
    error,
    loading,
    recaptchaVerifier,
    handleSendVerificationCode,
    handleVerifyCode,
    handleLogin,
    reset,
  };
}
