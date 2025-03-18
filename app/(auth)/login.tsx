import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { firebaseConfig } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { auth, db, saveAuthData } from '../../firebase/config';

export default function LoginScreen() {
  const router = useRouter();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  var formattedPhone = '';

  // Fonction pour hacher le mot de passe avec SHA-256 et sel
  const hashPassword = async (password: string, salt: string) => {
    const passwordWithSalt = password + salt;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      passwordWithSalt
    );
    return hash;
  };

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      setError('Veuillez entrer un numéro de téléphone');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      formattedPhone = phoneNumber.startsWith('+33')
        ? phoneNumber
        : `+33${phoneNumber.replace(/^0/, '')}`;

      const phoneProvider = new PhoneAuthProvider(auth);
      const vId = await phoneProvider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier.current as any
      );
      setVerificationId(vId);
      setIsCodeSent(true);
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi du code:', err);
      setError("Erreur lors de l'envoi du code : " + (err.message || 'Veuillez réessayer'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Veuillez entrer le code de vérification');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);

      // Authentifier temporairement pour obtenir l'ID utilisateur
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Vérifier si l'utilisateur existe dans Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // Déconnexion immédiate car l'utilisateur n'existe pas
        await auth.signOut();
        setError("Ce numéro n'est pas enregistré. Veuillez vous inscrire.");
        setIsCodeSent(false); // Retour à l'étape du numéro de téléphone
        return;
      }

      // Vérifier si l'utilisateur a un mot de passe configuré
      const userData = userDoc.data();
      if (!userData.password_hash || !userData.password_salt) {
        await auth.signOut();
        setError("Ce compte n'a pas de mot de passe configuré. Veuillez contacter le support.");
        return;
      }

      // Stocker l'ID utilisateur pour la vérification du mot de passe
      setUserId(user.uid);
      setIsCodeVerified(true);

      // Sauvegarder l'information du téléphone vérifié dans SecureStore
      await saveAuthData('verifiedPhone', user.phoneNumber || formattedPhone);
    } catch (err: any) {
      console.error('Erreur lors de la vérification du code:', err);
      setError("Code de vérification incorrect");
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

      // Récupérer les informations utilisateur de Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        setError("Utilisateur introuvable");
        return;
      }

      const userData = userDoc.data();

      // Vérifier si le hash du mot de passe est stocké
      if (!userData.password_hash || !userData.password_salt) {
        setError("Ce compte n'a pas de mot de passe configuré. Veuillez contacter le support.");
        return;
      }

      // Hacher le mot de passe entré avec le sel stocké
      const hashedPassword = await hashPassword(password, userData.password_salt);

      // Comparer avec le hash stocké
      if (hashedPassword !== userData.password_hash) {
        setError("Mot de passe incorrect");
        return;
      }

      // Connexion réussie - Sauvegarder des informations dans SecureStore
      await saveAuthData('lastLogin', new Date().toISOString());
      await saveAuthData('userFirstName', userData.first_name || '');
      await saveAuthData('userLastName', userData.last_name || '');
      await saveAuthData('userBirthDate', userData.birth_date || '');
      await saveAuthData('userRole', userData.role || 'user');

      // Enregistrer l'ID utilisateur comme référence rapide pour les futures vérifications
      await saveAuthData('userId', userId);

      // La connexion est réussie
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error("Erreur d'authentification:", err);
      setError("Erreur d'authentification : " + (err.message || 'Veuillez réessayer'));
    } finally {
      setLoading(false);
    }
  };

  const handleSupportRequest = () => {
    router.push('/support');
  };

  // Pour formater le numéro de téléphone en format international
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, ''); // Supprimer tous les caractères non numériques
    return phone.startsWith('+33')
      ? phone
      : `+33${cleaned.replace(/^0/, '')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />
      <View style={styles.formContainer}>
        {!isCodeSent ? (
          // Étape 1: Numéro de téléphone
          <>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 0612345678"
              placeholderTextColor="#888"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!loading}
              autoComplete="tel"
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleSendVerificationCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Envoyer le code</Text>
              )}
            </TouchableOpacity>
          </>
        ) : !isCodeVerified ? (
          // Étape 2: Code de vérification
          <>
            <Text style={styles.label}>Code de vérification</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez le code reçu par SMS"
              placeholderTextColor="#888"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              autoComplete="sms-otp"
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Vérifier le code</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                if (!loading) {
                  setIsCodeSent(false);
                  setVerificationCode('');
                  setError(null);
                }
              }}
              disabled={loading}
            >
              <Text style={[styles.linkText, loading && styles.disabledText]}>
                Modifier le numéro
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Étape 3: Mot de passe
          <>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez votre mot de passe"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              autoComplete="password"
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleSupportRequest}
              disabled={loading}
            >
              <Text style={styles.linkText}>J'ai oublié mon mot de passe</Text>
            </TouchableOpacity>
          </>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {error && error.includes("pas enregistré") && (
          <Link href="/register" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>S'inscrire maintenant</Text>
            </TouchableOpacity>
          </Link>
        )}

        {!isCodeVerified && (
          <><Link href="/register" asChild>
            <TouchableOpacity style={styles.linkButton} disabled={loading}>
              <Text style={[styles.linkText, loading && styles.disabledText]}>
                Pas de compte ? Inscrivez-vous
              </Text>
            </TouchableOpacity>
          </Link>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleSupportRequest}
              disabled={loading}
            >
              <Text style={[styles.linkText, loading && styles.disabledText]}>
                J'ai un souci pour me connecter
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles existants sans changement
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: '#111',
    padding: 24,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: '#333',
    borderWidth: 1,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0f0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#0f0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#0a0',
    opacity: 0.7,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#0f0',
    fontSize: 14,
  },
  disabledText: {
    opacity: 0.5,
  },
  errorText: {
    color: '#ff4444',
    marginTop: 16,
    textAlign: 'center',
  },
});